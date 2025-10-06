import { AIClient } from './aiClient.interface';

interface GroqChatResponse {
    choices: Array<{
        message: {
            content: string;
        };
    }>;
}

export class GroqClient implements AIClient {
    private apiKey: string;
    private readonly baseUrl = 'https://api.groq.com/openai/v1';

    constructor(apiKey?: string) {
        this.apiKey = apiKey || process.env.GROQ_API_KEY || '';
        if (!this.apiKey) {
            throw new Error('Groq API key required. Get free at https://console.groq.com');
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
        // Groq doesn't have embeddings, use Ollama for embeddings
        // But for this use case, we'll use a simple approach
        throw new Error('Groq embeddings not supported - use Ollama/Gemini embeddings with Groq chat');
    }

    async generateResponse(prompt: string): Promise<string> {
        const response = await fetch(`${this.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile', // Updated model
                messages: [
                    { role: 'system', content: 'You are a helpful assistant analyzing CVs. Be concise and specific.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.7,
                max_tokens: 2000
            })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Groq error: ${error}`);
        }

        const data: GroqChatResponse = await response.json();
        return data.choices[0].message.content;
    }
    async getEmbeddingSize(): Promise<number> {
        // Use Ollama embeddings
        return 768;
    }
}
