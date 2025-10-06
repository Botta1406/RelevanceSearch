import { OllamaClient } from './ollama';
import { GeminiClient } from './geminiClient';

export type EmbeddingProvider = 'ollama' | 'gemini';

export interface EmbeddingStrategy {
    generateEmbedding(text: string): Promise<number[]>;
    generateResponse(prompt: string): Promise<string>;
    getEmbeddingSize(): Promise<number>;
    testConnection(): Promise<boolean>;
    getProviderInfo(): { provider: string; [key: string]: any };
}

export class OllamaStrategy implements EmbeddingStrategy {
    private client: OllamaClient;

    constructor() {
        this.client = new OllamaClient();
    }

    async generateEmbedding(text: string): Promise<number[]> {
        return this.client.generateEmbedding(text);
    }

    async generateResponse(prompt: string): Promise<string> {
        return this.client.generateResponse(prompt);
    }

    async getEmbeddingSize(): Promise<number> {
        return this.client.getEmbeddingSize();
    }

    async testConnection(): Promise<boolean> {
        return this.client.testConnection();
    }

    getProviderInfo() {
        return {
            provider: 'Ollama (Local)',
            endpoint: 'http://localhost:11434',
            cost: 'Free (runs locally)'
        };
    }
}

export class GeminiStrategy implements EmbeddingStrategy {
    private client: GeminiClient;

    constructor(apiKey?: string) {
        this.client = new GeminiClient(apiKey);
    }

    async generateEmbedding(text: string): Promise<number[]> {
        return this.client.generateEmbedding(text);
    }

    async generateResponse(prompt: string): Promise<string> {
        return this.client.generateResponse(prompt);
    }

    async getEmbeddingSize(): Promise<number> {
        return this.client.getEmbeddingSize();
    }

    async testConnection(): Promise<boolean> {
        return this.client.testConnection();
    }

    getProviderInfo() {
        return this.client.getModelInfo();
    }
}

export class EmbeddingStrategyManager {
    private strategy: EmbeddingStrategy;
    private provider: EmbeddingProvider;

    constructor(provider: EmbeddingProvider = 'ollama', apiKey?: string) {
        this.provider = provider;
        this.strategy = this.createStrategy(provider, apiKey);
    }

    private createStrategy(provider: EmbeddingProvider, apiKey?: string): EmbeddingStrategy {
        switch (provider) {
            case 'gemini':
                return new GeminiStrategy(apiKey);
            case 'ollama':
            default:
                return new OllamaStrategy();
        }
    }

    setProvider(provider: EmbeddingProvider, apiKey?: string) {
        this.provider = provider;
        this.strategy = this.createStrategy(provider, apiKey);
    }

    getProvider(): EmbeddingProvider {
        return this.provider;
    }

    async generateEmbedding(text: string): Promise<number[]> {
        return this.strategy.generateEmbedding(text);
    }

    async generateResponse(prompt: string): Promise<string> {
        return this.strategy.generateResponse(prompt);
    }

    async getEmbeddingSize(): Promise<number> {
        return this.strategy.getEmbeddingSize();
    }

    async testConnection(): Promise<boolean> {
        return this.strategy.testConnection();
    }

    getProviderInfo() {
        return this.strategy.getProviderInfo();
    }
}
