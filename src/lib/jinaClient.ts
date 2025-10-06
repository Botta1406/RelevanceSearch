import { AIClient } from './aiClient.interface';

interface JinaEmbeddingResponse {
    data: Array<{
        embedding: number[];
    }>;
}

export class JinaClient implements AIClient {
    private apiKey: string;
    private readonly baseUrl = 'https://api.jina.ai/v1';

    constructor(apiKey?: string) {
        this.apiKey = apiKey || process.env.JINA_API_KEY || '';
        if (!this.apiKey) {
            throw new Error('Jina API key required. Get free at https://jina.ai');
        }
    }

    async testConnection(): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}/embeddings`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    input: ['test'],
                    model: 'jina-embeddings-v2-base-en'
                })
            });
            return response.ok;
        } catch {
            return false;
        }
    }

    async generateEmbedding(text: string): Promise<number[]> {
        const response = await fetch(`${this.baseUrl}/embeddings`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                input: [text.substring(0, 8000)],
                model: 'jina-embeddings-v2-base-en'
            })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Jina embedding error: ${error}`);
        }

        const data: JinaEmbeddingResponse = await response.json();
        return data.data[0].embedding;
    }

    async generateResponse(prompt: string): Promise<string> {
        // Jina doesn't have chat models, use Ollama for response
        throw new Error('Jina only provides embeddings. Use with another provider for chat.');
    }

    async getEmbeddingSize(): Promise<number> {
        return 768; // jina-embeddings-v2-base-en
    }
}
