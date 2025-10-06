import { NextApiRequest, NextApiResponse } from 'next';
import { QdrantVectorDatabase } from '@/lib/vectordb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { title } = req.body;

        if (!title) {
            return res.status(400).json({ error: 'Document title is required' });
        }

        const vectorDb = new QdrantVectorDatabase();
        await vectorDb.initialize();

        const removed = await vectorDb.removeDocumentByTitle(title);

        if (removed) {
            res.status(200).json({
                success: true,
                message: `Document "${title}" removed successfully`
            });
        } else {
            res.status(404).json({
                error: 'Document not found'
            });
        }
    } catch (error) {
        console.error('Error removing document:', error);
        res.status(500).json({
            error: 'Failed to remove document',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}