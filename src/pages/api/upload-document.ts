import { NextApiRequest, NextApiResponse } from 'next';
import multer from 'multer';
import { DocumentParser } from '@/lib/documentParser';
import { OllamaClient } from '@/lib/ollama';
import { GeminiClient } from '@/lib/gemini';
import { QdrantVectorDatabase } from '@/lib/vectordb';

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024,
    },
    fileFilter: (req, file, cb) => {
        console.log(`File received: ${file.originalname} (${file.mimetype})`);

        const allowedTypes = [
            'text/plain',
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/msword'
        ];

        const allowedExtensions = /\.(txt|pdf|docx|doc)$/i;

        if (allowedTypes.includes(file.mimetype) || allowedExtensions.test(file.originalname)) {
            cb(null, true);
        } else {
            cb(new Error(`Unsupported file type: ${file.mimetype}. Only .txt, .pdf, and .docx files are allowed.`));
        }
    }
});

export const config = {
    api: {
        bodyParser: false,
    },
};

function runMiddleware(req: any, res: any, fn: any) {
    return new Promise((resolve, reject) => {
        fn(req, res, (result: any) => {
            if (result instanceof Error) {
                return reject(result);
            }
            return resolve(result);
        });
    });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    console.log(`Upload request received: ${req.method}`);

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    let vectorDb: QdrantVectorDatabase | null = null;

    try {
        console.log('Processing file upload...');

        await runMiddleware(req, res, upload.single('document'));

        const file = (req as any).file;
        if (!file) {
            console.error('No file uploaded');
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const provider = (req as any).body.provider || 'ollama';
        const apiKey = (req as any).body.apiKey;

        console.log(`Processing file: ${file.originalname} (${file.size} bytes)`);
        console.log(`Using provider: ${provider}`);

        let aiClient: OllamaClient | GeminiClient;

        if (provider === 'gemini') {
            if (!apiKey && !process.env.GEMINI_API_KEY) {
                return res.status(400).json({
                    error: 'Gemini API key required',
                    details: 'Please provide a Gemini API key or set GEMINI_API_KEY environment variable'
                });
            }
            aiClient = new GeminiClient(apiKey || process.env.GEMINI_API_KEY);
        } else {
            aiClient = new OllamaClient();
        }

// Initialize vectorDb immediately instead of null
        const vectorDb = new QdrantVectorDatabase();

        console.log(`Testing ${provider} connection...`);
        const isAIConnected = await aiClient.testConnection();
        if (!isAIConnected) {
            const errorMsg = provider === 'ollama'
                ? 'Cannot connect to Ollama. Make sure Ollama is running on http://localhost:11434'
                : 'Cannot connect to Gemini. Check your API key';
            throw new Error(errorMsg);
        }
        console.log(`${provider} connected`);

        console.log('Testing Qdrant connection...');
        const isQdrantConnected = await vectorDb.testConnection();
        if (!isQdrantConnected) {
            throw new Error('Cannot connect to Qdrant. Make sure Qdrant is running on http://localhost:6333');
        }
        console.log('Qdrant connected');

        console.log('Determining embedding size...');
        let embeddingSize: number;
        try {
            embeddingSize = await aiClient.getEmbeddingSize();
            console.log(`Embedding size: ${embeddingSize} dimensions (${provider})`);
        } catch (error) {
            console.error('Failed to get embedding size:', error);
            return res.status(500).json({
                error: 'Failed to determine embedding size',
                details: error instanceof Error ? error.message : 'Unknown error',
                suggestions: [
                    provider === 'ollama'
                        ? 'Make sure Ollama is running: ollama serve'
                        : 'Check your Gemini API key',
                    provider === 'ollama'
                        ? 'Pull an embedding model: ollama pull nomic-embed-text'
                        : 'Verify API access at https://aistudio.google.com'
                ]
            });
        }

        // Initialize without deleting existing collection
        console.log('Setting up vector database...');
        try {
            const collections = await vectorDb['client'].getCollections();
            const collectionExists = collections.collections.some(
                (collection) => collection.name === vectorDb['collectionName']
            );

            if (collectionExists) {
                console.log('Collection exists, will add to existing documents');
                vectorDb['vectorSize'] = embeddingSize;
            } else {
                console.log('Creating new collection...');
                await vectorDb['client'].createCollection(vectorDb['collectionName'], {
                    vectors: {
                        size: embeddingSize,
                        distance: 'Cosine',
                    },
                });
                vectorDb['vectorSize'] = embeddingSize;
                console.log('Collection created');
            }
        } catch (error) {
            console.error('Failed to setup vector database:', error);
            throw error;
        }

        console.log('Parsing document...');
        let parsedDoc;
        try {
            parsedDoc = await DocumentParser.parseFile(
                file.buffer,
                file.originalname,
                file.mimetype
            );
            console.log(`Document parsed: ${parsedDoc.chunks.length} chunks created`);
        } catch (error) {
            console.error('Document parsing failed:', error);
            return res.status(400).json({
                error: 'Failed to parse document',
                details: error instanceof Error ? error.message : 'Unknown parsing error',
                suggestions: [
                    'Make sure the file is not corrupted',
                    'For PDFs: ensure they contain selectable text (not scanned images)',
                    'Try a simple text file first to test the system'
                ]
            });
        }

        if (parsedDoc.chunks.length === 0) {
            return res.status(400).json({
                error: 'No content found in document',
                details: 'The document appears to be empty or contains only unsupported content'
            });
        }

        console.log(`Processing chunks with ${provider} embeddings...`);
        let processedChunks = 0;
        const errors: string[] = [];

        for (let i = 0; i < parsedDoc.chunks.length; i++) {
            const chunk = parsedDoc.chunks[i];
            try {
                console.log(`Processing chunk ${i + 1}/${parsedDoc.chunks.length}: ${chunk.id}`);

                console.log(`Generating ${provider} embedding...`);
                const embedding = await aiClient.generateEmbedding(chunk.text);

                if (!embedding || embedding.length === 0) {
                    throw new Error('Empty embedding generated');
                }

                if (embedding.length !== embeddingSize) {
                    throw new Error(`Embedding size mismatch: expected ${embeddingSize}, got ${embedding.length}`);
                }

                console.log(`Embedding generated: ${embedding.length} dimensions`);

                const metadata = {
                    documentTitle: parsedDoc.title,
                    documentType: parsedDoc.type,
                    uploadedAt: new Date().toISOString(),
                    chunkIndex: chunk.chunkIndex,
                    length: chunk.text.length,
                    provider: provider,
                    ...chunk.metadata
                };

                console.log('Adding to vector database...');
                await vectorDb.addDocument(
                    chunk.id,
                    chunk.text,
                    embedding,
                    metadata
                );

                processedChunks++;
                console.log(`Chunk ${processedChunks}/${parsedDoc.chunks.length} processed successfully`);

            } catch (error) {
                const errorMsg = `Failed to process chunk ${chunk.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
                console.error(errorMsg);
                errors.push(errorMsg);

                if (errors.length >= 3) {
                    console.error('Too many errors, stopping processing');
                    break;
                }
            }
        }

        if (processedChunks === 0) {
            return res.status(500).json({
                error: 'Failed to process any document chunks',
                details: errors.join('; '),
                suggestions: [
                    `Check that ${provider} is properly configured`,
                    provider === 'ollama'
                        ? 'Make sure Ollama is running'
                        : 'Verify your Gemini API key',
                    'Check that Qdrant is running',
                    'Try a simple text file first'
                ]
            });
        }

        console.log(`Upload completed: ${processedChunks}/${parsedDoc.chunks.length} chunks processed with ${provider} embeddings`);

        const response = {
            success: true,
            message: `Document uploaded and indexed successfully with ${provider}`,
            document: {
                title: parsedDoc.title,
                type: parsedDoc.type,
                chunksProcessed: processedChunks,
                totalChunks: parsedDoc.chunks.length,
                embeddingSize: embeddingSize,
                provider: provider
            },
            ...(errors.length > 0 && {
                warnings: `${errors.length} chunks failed to process`,
                errorDetails: errors.slice(0, 3)
            })
        };

        res.status(200).json(response);

    } catch (error) {
        console.error('Upload error:', error);

        res.status(500).json({
            error: 'Failed to process document',
            details: error instanceof Error ? error.message : 'Unknown error',
            suggestions: [
                'Make sure your AI provider is running/configured',
                'Make sure Qdrant is running: docker run -p 6333:6333 qdrant/qdrant',
                'Check the console logs for more details'
            ]
        });
    }
}
