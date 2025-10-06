import { NextApiRequest, NextApiResponse } from 'next';
import { QdrantVectorDatabase } from '@/lib/vectordb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const vectorDb = new QdrantVectorDatabase();
        await vectorDb.initialize();

        const documents = await vectorDb.getAllDocuments();

        res.status(200).json({
            success: true,
            documents
        });
    } catch (error) {
        console.error('Error getting documents:', error);
        res.status(500).json({
            error: 'Failed to get documents',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}