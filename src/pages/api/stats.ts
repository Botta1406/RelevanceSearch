import { NextApiRequest, NextApiResponse } from 'next';
import { QdrantVectorDatabase } from '@/lib/vectordb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const vectorDb = new QdrantVectorDatabase();
        const count = await vectorDb.getDocumentCount();
        const docs = await vectorDb.getAllDocuments();

        res.status(200).json({
            totalChunks: count,
            uniqueDocuments: docs.length,
            documents: docs.map(d => d.title)
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get stats' });
    }
}
