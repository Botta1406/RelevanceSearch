interface CohereEmbeddingResponse {
    embeddings: number[][];
    texts: string[];
    meta?: {
        billed_units?: {
            input_tokens: number;
        };
    };
}

interface GroqChatResponse {
    choices: Array<{
        message: {
            content: string;
            role: string;
        };
        finish_reason: string;
    }>;
    usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
        prompt_time: number;
        completion_time: number;
        total_time: number;
    };
}

export class GroqCohereClient {
    private groqApiKey: string;
    private cohereApiKey: string;
    private readonly CHAT_MODEL = 'llama-3.1-70b-versatile';
    private readonly EMBEDDING_MODEL = 'embed-english-v3.0';
    private readonly GROQ_URL = 'https://api.groq.com/openai/v1';
    private readonly COHERE_URL = 'https://api.cohere.com/v1';

    constructor(groqApiKey?: string, cohereApiKey?: string) {
        this.groqApiKey = groqApiKey || process.env.GROQ_API_KEY || '';
        this.cohereApiKey = cohereApiKey || process.env.COHERE_API_KEY || '';

        if (!this.groqApiKey) {
            throw new Error('Groq API key required. Get FREE at https://console.groq.com');
        }

        if (!this.cohereApiKey) {
            throw new Error('Cohere API key required. Get FREE at https://dashboard.cohere.com/api-keys');
        }

        console.log('✅ Groq + Cohere initialized (FREE)');
    }

    async testConnection(): Promise<boolean> {
        try {
            console.log('🔄 Testing connections...');

            const groqResponse = await fetch(`${this.GROQ_URL}/models`, {
                headers: {
                    'Authorization': `Bearer ${this.groqApiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            const cohereResponse = await fetch(`${this.COHERE_URL}/check-api-key`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.cohereApiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({})
            });

            const success = groqResponse.ok && cohereResponse.ok;
            console.log(success ? '✅ Connected' : '❌ Failed');
            return success;
        } catch (error) {
            console.error('❌ Error:', error);
            return false;
        }
    }

    async generateEmbedding(text: string): Promise<number[]> {
        console.log('🧠 Generating Cohere embedding...');

        const truncatedText = text.substring(0, 8000);

        const response = await fetch(`${this.COHERE_URL}/embed`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.cohereApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                texts: [truncatedText],
                model: this.EMBEDDING_MODEL,
                input_type: 'search_document',
                embedding_types: ['float']
            })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Embedding failed: ${error}`);
        }

        const data: CohereEmbeddingResponse = await response.json();
        console.log(`✅ Embedding: ${data.embeddings[0].length}D`);

        return data.embeddings[0];
    }

    async generateEmbeddingForQuery(text: string): Promise<number[]> {
        console.log('🔍 Query embedding...');

        const response = await fetch(`${this.COHERE_URL}/embed`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.cohereApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                texts: [text],
                model: this.EMBEDDING_MODEL,
                input_type: 'search_query',
                embedding_types: ['float']
            })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Query embedding failed: ${error}`);
        }

        const data: CohereEmbeddingResponse = await response.json();
        return data.embeddings[0];
    }

    async generateResponse(prompt: string): Promise<string> {
        console.log(`⚡ Groq generating response...`);

        const response = await fetch(`${this.GROQ_URL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.groqApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: this.CHAT_MODEL,
                messages: [
                    {
                        role: 'system',
                        content: 'You are a helpful assistant. Answer based on provided context. Cite sources.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 2000
            })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Response failed: ${error}`);
        }

        const data: GroqChatResponse = await response.json();

        if (!data.choices?.[0]?.message?.content) {
            throw new Error('Invalid response');
        }

        if (data.usage) {
            const tokensPerSec = data.usage.completion_tokens / data.usage.completion_time;
            console.log(`⚡ ${data.usage.total_tokens} tokens (${tokensPerSec.toFixed(0)} tok/s)`);
        }

        return data.choices[0].message.content;
    }

    async getEmbeddingSize(): Promise<number> {
        return 1024;
    }

    getModelInfo() {
        return {
            provider: 'Groq + Cohere',
            chat: 'Llama-3.1-70b (Groq)',
            embeddings: 'embed-english-v3.0 (Cohere)',
            free: 'Groq: 30 RPM, Cohere: 1000/month',
            cost: '100% FREE'
        };
    }
}
