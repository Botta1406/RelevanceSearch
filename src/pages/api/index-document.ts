import { NextApiRequest, NextApiResponse } from 'next';
import { OllamaClient } from '@/lib/ollama';
import { QdrantVectorDatabase, DocumentMetadata } from '@/lib/vectordb';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { text, metadata, id } = req.body;

        if (!text) {
            return res.status(400).json({ error: 'Text is required' });
        }

        const ollama = new OllamaClient();
        const vectorDb = new QdrantVectorDatabase();

        await vectorDb.initialize();

        const embedding = await ollama.generateEmbedding(text);

        // Use proper typing for metadata
        const documentMetadata: DocumentMetadata = {
            timestamp: new Date().toISOString(),
            length: text.length,
            ...metadata
        };

        await vectorDb.addDocument(
            id || `doc_${Date.now()}`,
            text,
            embedding,
            documentMetadata
        );

        res.status(200).json({
            success: true,
            message: 'Document indexed successfully',
            id: id || `doc_${Date.now()}`
        });
    } catch (error) {
        console.error('Error indexing document:', error);
        res.status(500).json({
            error: 'Failed to index document',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}