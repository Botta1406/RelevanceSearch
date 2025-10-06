import { NextApiRequest, NextApiResponse } from 'next';
import multer from 'multer';

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }
});

export const config = {
    api: { bodyParser: false }
};

function runMiddleware(req: any, res: any, fn: any) {
    return new Promise((resolve, reject) => {
        fn(req, res, (result: any) => {
            if (result instanceof Error) return reject(result);
            return resolve(result);
        });
    });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        await runMiddleware(req, res, upload.single('document'));
        const file = (req as any).file;

        if (!file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        if (file.mimetype === 'application/pdf') {
            const pdfParse = require('pdf-parse');

            try {
                const pdfData = await pdfParse(file.buffer);

                res.status(200).json({
                    success: true,
                    filename: file.originalname,
                    size: file.size,
                    pages: pdfData.numpages,
                    textLength: pdfData.text.length,
                    firstChars: pdfData.text.substring(0, 500),
                    info: pdfData.info,
                    metadata: pdfData.metadata
                });
            } catch (error) {
                res.status(500).json({
                    error: 'PDF parsing failed',
                    details: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        } else {
            res.status(400).json({ error: 'Please upload a PDF file' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Upload failed' });
    }
}