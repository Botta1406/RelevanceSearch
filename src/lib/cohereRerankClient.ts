interface CohereEmbeddingResponse {
    embeddings: number[][];
}

interface CohereRerankResponse {
    results: Array<{
        index: number;
        relevance_score: number;
    }>;
    meta?: {
        billed_units?: {
            search_units: number;
        };
    };
}

interface CohereChatResponse {
    text: string;
    meta?: {
        billed_units?: {
            input_tokens: number;
            output_tokens: number;
        };
    };
}

export class CohereRerankClient {
    private cohereApiKey: string;
    private readonly EMBEDDING_MODEL = 'embed-english-v3.0';
    private readonly RERANK_MODEL = 'rerank-english-v3.0';
    private readonly CHAT_MODEL = 'command-r';
    private readonly BASE_URL = 'https://api.cohere.com/v1';

    constructor(cohereApiKey?: string) {
        this.cohereApiKey = cohereApiKey || process.env.COHERE_API_KEY || '';

        if (!this.cohereApiKey) {
            throw new Error('Cohere API key required. Get FREE at https://dashboard.cohere.com/api-keys');
        }

        console.log('✅ Cohere Rerank initialized (FREE)');
    }

    async testConnection(): Promise<boolean> {
        try {
            const response = await fetch(`${this.BASE_URL}/check-api-key`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.cohereApiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({})
            });

            console.log(response.ok ? '✅ Connected' : '❌ Failed');
            return response.ok;
        } catch (error) {
            console.error('❌ Error:', error);
            return false;
        }
    }

    async generateEmbedding(text: string): Promise<number[]> {
        console.log('🧠 Cohere embedding...');

        const response = await fetch(`${this.BASE_URL}/embed`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.cohereApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                texts: [text.substring(0, 8000)],
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
        console.log(`✅ ${data.embeddings[0].length}D`);
        return data.embeddings[0];
    }

    async generateEmbeddingForQuery(text: string): Promise<number[]> {
        console.log('🔍 Query embedding...');

        const response = await fetch(`${this.BASE_URL}/embed`, {
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

    async rerankDocuments(
        query: string,
        documents: Array<{ text: string; metadata?: any }>,
        topN: number = 5
    ): Promise<Array<{ index: number; relevance_score: number; text: string; metadata?: any }>> {
        console.log(`🎯 Reranking ${documents.length} docs...`);

        const response = await fetch(`${this.BASE_URL}/rerank`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.cohereApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: this.RERANK_MODEL,
                query: query,
                documents: documents.map(doc => doc.text),
                top_n: topN,
                return_documents: false
            })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Rerank failed: ${error}`);
        }

        const data: CohereRerankResponse = await response.json();
        console.log(`✅ Reranked to ${data.results.length}`);

        return data.results.map(result => ({
            index: result.index,
            relevance_score: result.relevance_score,
            text: documents[result.index].text,
            metadata: documents[result.index].metadata
        }));
    }

    async generateResponse(prompt: string, documents?: Array<{ text: string; title: string }>): Promise<string> {
        console.log('💭 Generating response...');

        const requestBody: any = {
            model: this.CHAT_MODEL,
            message: prompt,
            temperature: 0.7,
            max_tokens: 2000
        };

        if (documents && documents.length > 0) {
            requestBody.documents = documents.map((doc, i) => ({
                id: `doc_${i}`,
                title: doc.title,
                snippet: doc.text
            }));
        }

        const response = await fetch(`${this.BASE_URL}/chat`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.cohereApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Chat failed: ${error}`);
        }

        const data: CohereChatResponse = await response.json();

        if (!data.text) {
            throw new Error('Invalid response');
        }

        if (data.meta?.billed_units) {
            console.log(`💰 ${data.meta.billed_units.input_tokens} in / ${data.meta.billed_units.output_tokens} out`);
        }

        return data.text;
    }

    async getEmbeddingSize(): Promise<number> {
        return 1024;
    }

    getModelInfo() {
        return {
            provider: 'Cohere Only',
            embeddings: 'embed-english-v3.0',
            rerank: 'rerank-english-v3.0',
            chat: 'command-r',
            approach: '2-Stage: Embed → Rerank',
            free: '1000 API calls/month',
            cost: '100% FREE'
        };
    }
}
