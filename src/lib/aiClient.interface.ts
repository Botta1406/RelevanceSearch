export interface AIClient {
    generateEmbedding(text: string): Promise<number[]>;
    generateResponse(prompt: string): Promise<string>;
    getEmbeddingSize(): Promise<number>;
    testConnection(): Promise<boolean>;
}
