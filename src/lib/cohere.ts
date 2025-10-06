import { CohereClient } from 'cohere-ai';

export class CohereClientWrapper {
    private client: CohereClient;

    constructor() {
        const apiKey = process.env.COHERE_API_KEY;
        if (!apiKey) {
            throw new Error('COHERE_API_KEY environment variable is required');
        }
        this.client = new CohereClient({ token: apiKey });
    }

    async testConnection(): Promise<boolean> {
        try {
            await this.client.embed({
                texts: ['test'],
                model: 'embed-english-v3.0',
                inputType: 'search_document'
            });
            return true;
        } catch (error) {
            console.error('Cohere connection test failed:', error);
            return false;
        }
    }

    async generateEmbedding(text: string): Promise<number[]> {
        try {
            const response = await this.client.embed({
                texts: [text.substring(0, 8000)],
                model: 'embed-english-v3.0',
                inputType: 'search_document'
            });

            return response.embeddings[0];
        } catch (error) {
            console.error('Cohere embedding generation failed:', error);
            throw new Error(`Failed to generate embedding: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async generateQueryEmbedding(text: string): Promise<number[]> {
        try {
            const response = await this.client.embed({
                texts: [text.substring(0, 8000)],
                model: 'embed-english-v3.0',
                inputType: 'search_query'
            });

            return response.embeddings[0];
        } catch (error) {
            console.error('Cohere embedding generation failed:', error);
            throw new Error(`Failed to generate embedding: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async getEmbeddingSize(): Promise<number> {
        return 1024; // embed-english-v3.0 size
    }

    async generateResponse(prompt: string): Promise<string> {
        try {
            const response = await this.client.chat({
                message: prompt,
                model:'command-r-08-2024', // Changed from 'command-r'
                temperature: 0.7,
            });

            return response.text || 'No response generated';
        } catch (error) {
            console.error('Cohere response generation failed:', error);
            throw new Error(`Failed to generate response: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}
