import { AIClient } from './aiClient.interface';

interface GeminiEmbeddingResponse {
    embedding: {
        values: number[];
    };
}

interface GeminiChatResponse {
    candidates: Array<{
        content: {
            parts: Array<{
                text: string;
            }>;
        };
    }>;
}

export class GeminiClient implements AIClient {
    private apiKey: string;

    constructor(apiKey?: string) {
        this.apiKey = apiKey || process.env.GEMINI_API_KEY || '';
        if (!this.apiKey) {
            throw new Error('Gemini API key required');
        }
    }

    async testConnection(): Promise<boolean> {
        try {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${this.apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        content: { parts: [{ text: 'test' }] }
                    })
                }
            );
            return response.ok;
        } catch {
            return false;
        }
    }

    async generateEmbedding(text: string): Promise<number[]> {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${this.apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: { parts: [{ text: text.substring(0, 8000) }] },
                    taskType: 'RETRIEVAL_DOCUMENT'
                })
            }
        );

        if (!response.ok) {
            throw new Error(`Embedding failed: ${response.status}`);
        }

        const data: GeminiEmbeddingResponse = await response.json();
        return data.embedding.values;
    }

    async generateResponse(prompt: string): Promise<string> {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 2048
                    },
                    safetySettings: [
                        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
                    ]
                })
            }
        );

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Gemini error: ${error}`);
        }

        const data: GeminiChatResponse = await response.json();

        if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
            throw new Error('No response from Gemini');
        }

        return data.candidates[0].content.parts[0].text;
    }

    async getEmbeddingSize(): Promise<number> {
        return 768;
    }
}
