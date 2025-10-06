import { AIClient } from './aiClient.interface';

interface OpenAIEmbeddingResponse {
    data: Array<{
        embedding: number[];
    }>;
}

interface OpenAIChatResponse {
    choices: Array<{
        message: {
            content: string;
        };
    }>;
}

export class OpenAIClient implements AIClient {
    private apiKey: string;
    private readonly baseUrl = 'https://api.openai.com/v1';

    constructor(apiKey?: string) {
        this.apiKey = apiKey || process.env.OPENAI_API_KEY || '';
        if (!this.apiKey) {
            throw new Error('OpenAI API key required');
        }
    }

    async testConnection(): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}/models`, {
                headers: { 'Authorization': `Bearer ${this.apiKey}` }
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
                input: text.substring(0, 8000),
                model: 'text-embedding-3-small'
            })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`OpenAI embedding error: ${error}`);
        }

        const data: OpenAIEmbeddingResponse = await response.json();
        return data.data[0].embedding;
    }

    async generateResponse(prompt: string): Promise<string> {
        const response = await fetch(`${this.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7,
                max_tokens: 2000
            })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`OpenAI chat error: ${error}`);
        }

        const data: OpenAIChatResponse = await response.json();
        return data.choices[0].message.content;
    }

    async getEmbeddingSize(): Promise<number> {
        return 1536; // text-embedding-3-small size
    }
}
