import { NextApiRequest, NextApiResponse } from 'next';
import { OllamaClient } from '@/lib/ollama';
import { QdrantVectorDatabase } from '@/lib/vectordb';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { query, limit = 5 } = req.body;

        if (!query) {
            return res.status(400).json({ error: 'Query is required' });
        }

        const ollama = new OllamaClient();
        const vectorDb = new QdrantVectorDatabase();

        // Initialize database
        await vectorDb.initialize();

        // Generate query embedding
        const queryEmbedding = await ollama.generateEmbedding(query);

        // Search similar documents
        const searchResults = await vectorDb.searchSimilar(queryEmbedding, limit);

        res.status(200).json({ results: searchResults });
    } catch (error) {
        console.error('Error searching:', error);
        res.status(500).json({
            error: 'Search failed',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}