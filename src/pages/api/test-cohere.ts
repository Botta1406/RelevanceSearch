import { NextApiRequest, NextApiResponse } from 'next';
import { CohereClientWrapper } from '@/lib/cohere';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const cohere = new CohereClientWrapper();
        const isConnected = await cohere.testConnection();

        if (isConnected) {
            res.status(200).json({ success: true, message: 'Cohere API connected' });
        } else {
            res.status(500).json({ success: false, error: 'Cohere API not available' });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}
