import { AIClient } from './aiClient.interface';

interface CohereChatResponse {
    text: string;
    generation_id?: string;
}

export class CohereClient implements AIClient {
    private apiKey: string;
    private readonly baseUrl = 'https://api.cohere.com/v1';

    constructor(apiKey?: string) {
        this.apiKey = apiKey || process.env.COHERE_API_KEY || '';
        if (!this.apiKey) {
            throw new Error('Cohere API key required. Get free at https://dashboard.cohere.com/api-keys');
        }
    }

    async testConnection(): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}/check-api-key`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({})
            });
            return response.ok;
        } catch {
            return false;
        }
    }

    async generateEmbedding(text: string): Promise<number[]> {
        throw new Error('Cohere embeddings not used - use Ollama embeddings with Cohere chat');
    }

    async generateResponse(prompt: string): Promise<string> {
        const response = await fetch(`${this.baseUrl}/chat`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'command-r-plus-08-2024', // Updated to current model
                message: prompt,
                temperature: 0.7,
                max_tokens: 2000
            })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Cohere error: ${error}`);
        }

        const data: CohereChatResponse = await response.json();
        return data.text;
    }

    async getEmbeddingSize(): Promise<number> {
        return 768; // Uses Ollama embeddings
    }
}
