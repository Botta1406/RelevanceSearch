import { NextApiRequest, NextApiResponse } from 'next';
import { OllamaClient } from '@/lib/ollama';
import { GeminiClient } from '@/lib/geminiClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const results = {
        ollama: { status: 'unknown', error: null as string | null, details: '' },
        gemini: { status: 'unknown', error: null as string | null, details: '' },
        cohere: { status: 'unknown', error: null as string | null, details: '' }
    };

    // Test Ollama
    try {
        const ollama = new OllamaClient();
        const connected = await ollama.testConnection();
        if (connected) {
            const embedding = await ollama.generateEmbedding('test');
            results.ollama.status = 'working';
            results.ollama.details = `Embedding size: ${embedding.length}`;
        } else {
            results.ollama.status = 'failed';
        }
    } catch (error: any) {
        results.ollama.status = 'failed';
        results.ollama.error = error.message;
    }

    // Test Gemini
    try {
        const geminiKey = process.env.GEMINI_API_KEY;
        if (!geminiKey) {
            results.gemini.status = 'no_api_key';
            results.gemini.error = 'GEMINI_API_KEY not set in .env';
        } else {
            const gemini = new GeminiClient(geminiKey);
            const connected = await gemini.testConnection();
            if (connected) {
                const embedding = await gemini.generateEmbedding('test');
                results.gemini.status = 'working';
                results.gemini.details = `Embedding size: ${embedding.length}`;
            } else {
                results.gemini.status = 'failed';
            }
        }
    } catch (error: any) {
        results.gemini.status = 'failed';
        results.gemini.error = error.message;
    }

    // Test Cohere
    try {
        const cohereKey = process.env.COHERE_API_KEY;
        if (!cohereKey) {
            results.cohere.status = 'no_api_key';
            results.cohere.error = 'COHERE_API_KEY not set in .env';
        } else {
            const response = await fetch('https://api.cohere.com/v1/embed', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${cohereKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    texts: ['test'],
                    model: 'embed-english-v3.0',
                    input_type: 'search_document',
                    embedding_types: ['float']
                })
            });

            const data = await response.json();

            if (response.ok && data.embeddings && data.embeddings[0]) {
                results.cohere.status = 'working';
                results.cohere.details = `Embedding size: ${data.embeddings[0].length}`;
            } else {
                results.cohere.status = 'failed';
                results.cohere.error = JSON.stringify(data);
            }
        }
    } catch (error: any) {
        results.cohere.status = 'failed';
        results.cohere.error = error.message;
    }

    try {
        const cohereKey = process.env.COHERE_API_KEY;
        if (!cohereKey) {
            results.cohere.status = 'no_api_key';
            results.cohere.error = 'COHERE_API_KEY not set in .env';
        } else {
            const response = await fetch('https://api.cohere.com/v1/check-api-key', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${cohereKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({})
            });

            if (response.ok) {
                results.cohere.status = 'working';
                results.cohere.details = 'Cohere API connected';
            } else {
                results.cohere.status = 'failed';
                results.cohere.error = `HTTP ${response.status}`;
            }
        }
    } catch (error: any) {
        results.cohere.status = 'failed';
        results.cohere.error = error.message;
    }

    return res.status(200).json(results);
}
