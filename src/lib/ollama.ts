interface OllamaResponse {
    response: string;
    done: boolean;
}

interface OllamaEmbeddingResponse {
    embedding: number[];
}

interface OllamaModel {
    name: string;
    size: number;
    digest: string;
    details: {
        format: string;
        family: string;
        families: string[];
        parameter_size: string;
        quantization_level: string;
    };
}

export class OllamaClient {
    private baseUrl: string;

    constructor(baseUrl: string = 'http://localhost:11434') {
        this.baseUrl = baseUrl;
    }

    async testConnection(): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}/api/tags`);
            return response.ok;
        } catch (error) {
            console.error('❌ Cannot connect to Ollama:', error);
            return false;
        }
    }

    async generateEmbedding(text: string, model?: string): Promise<number[]> {
        try {
            console.log('🔄 Generating embedding...');

            // Test connection first
            const isConnected = await this.testConnection();
            if (!isConnected) {
                throw new Error('Cannot connect to Ollama. Make sure Ollama is running on ' + this.baseUrl);
            }

            if (!model) {
                model = await this.findBestEmbeddingModel();
            }

            console.log(`🤖 Using model: ${model}`);

            const response = await fetch(`${this.baseUrl}/api/embeddings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model,
                    prompt: text,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Ollama embedding failed: ${response.status} ${response.statusText}. Details: ${errorText}`);
            }

            const data: OllamaEmbeddingResponse = await response.json();

            if (!data.embedding || !Array.isArray(data.embedding)) {
                throw new Error('Invalid embedding response from Ollama');
            }

            console.log(`📏 Generated embedding with ${data.embedding.length} dimensions`);
            return data.embedding;
        } catch (error) {
            console.error('❌ Error in generateEmbedding:', error);
            throw error;
        }
    }

    async generateResponse(prompt: string, model?: string): Promise<string> {
        try {
            if (!model) {
                model = await this.findBestGenerationModel();
            }

            console.log(`💭 Generating response with model: ${model}`);

            const response = await fetch(`${this.baseUrl}/api/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model,
                    prompt,
                    stream: false,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Ollama generation failed: ${response.status} ${response.statusText}. Details: ${errorText}`);
            }

            const data: OllamaResponse = await response.json();
            return data.response;
        } catch (error) {
            console.error('❌ Error in generateResponse:', error);
            throw error;
        }
    }

    async getAvailableModels(): Promise<OllamaModel[]> {
        try {
            const response = await fetch(`${this.baseUrl}/api/tags`);
            if (!response.ok) {
                throw new Error(`Failed to get models: ${response.statusText}`);
            }
            const data = await response.json();
            return data.models || [];
        } catch (error) {
            console.error('❌ Error getting available models:', error);
            return [];
        }
    }

    private async findBestEmbeddingModel(): Promise<string> {
        const models = await this.getAvailableModels();
        const modelNames = models.map(m => m.name);

        console.log(`🔍 Available models: ${modelNames.join(', ')}`);

        const embeddingModels = ['nomic-embed-text', 'all-minilm', 'mxbai-embed-large'];

        for (const preferredModel of embeddingModels) {
            const foundModel = modelNames.find(model => model.includes(preferredModel));
            if (foundModel) {
                console.log(`✅ Using embedding model: ${foundModel}`);
                return foundModel;
            }
        }

        // Fallback to generation models that can do embeddings
        const generationModels = ['llama3.2', 'llama3.1', 'llama3', 'llama2', 'phi3'];
        for (const preferredModel of generationModels) {
            const foundModel = modelNames.find(model => model.includes(preferredModel));
            if (foundModel) {
                console.log(`⚠️ Using generation model for embeddings: ${foundModel}`);
                return foundModel;
            }
        }

        if (modelNames.length > 0) {
            console.log(`⚠️ Using first available model: ${modelNames[0]}`);
            return modelNames[0];
        }

        throw new Error('No Ollama models available. Please run: ollama pull nomic-embed-text');
    }

    private async findBestGenerationModel(): Promise<string> {
        const models = await this.getAvailableModels();
        const modelNames = models.map(m => m.name);

        const generationModels = ['llama3.2', 'llama3.1', 'llama3', 'llama2', 'mistral', 'phi3'];

        for (const preferredModel of generationModels) {
            const foundModel = modelNames.find(model =>
                model.includes(preferredModel) &&
                !model.includes('embed')
            );
            if (foundModel) {
                return foundModel;
            }
        }

        const nonEmbeddingModel = modelNames.find(model => !model.includes('embed'));
        if (nonEmbeddingModel) {
            return nonEmbeddingModel;
        }

        throw new Error('No text generation models available. Please run: ollama pull llama3.2');
    }

    // Get embedding size for a specific model
    async getEmbeddingSize(model?: string): Promise<number> {
        try {
            if (!model) {
                model = await this.findBestEmbeddingModel();
            }

            // Test with a small text to get embedding size
            const testEmbedding = await this.generateEmbedding('test', model);
            return testEmbedding.length;
        } catch (error) {
            console.error('❌ Error getting embedding size:', error);
            throw error;
        }
    }
}