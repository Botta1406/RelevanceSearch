interface GeminiEmbeddingResponse {
    embedding: {
        values: number[];
    };
}

interface GeminiChatResponse {
    candidates: Array<{
        content: {
            parts: Array<{
                text: string;
            }>;
        };
    }>;
}

export class GeminiClient {
    private apiKey: string;

    constructor(apiKey?: string) {
        this.apiKey = apiKey || process.env.GEMINI_API_KEY || '';

        if (!this.apiKey) {
            console.error('❌ No Gemini API key found!');
            throw new Error('Gemini API key required. Get one at https://aistudio.google.com/app/apikey');
        }

        console.log('✅ Gemini API key loaded:', this.apiKey.substring(0, 15) + '...');
    }

    async testConnection(): Promise<boolean> {
        try {
            console.log('🔄 Testing Gemini connection...');
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${this.apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        content: { parts: [{ text: 'test' }] }
                    })
                }
            );

            console.log('🔍 Connection test status:', response.status);

            if (!response.ok) {
                const error = await response.text();
                console.error('❌ Connection test failed:', error);
                return false;
            }

            console.log('✅ Connection test successful');
            return true;
        } catch (error) {
            console.error('❌ Connection test error:', error);
            return false;
        }
    }

    async generateEmbedding(text: string): Promise<number[]> {
        console.log('🧠 Generating embedding...');

        const truncatedText = text.substring(0, 8000);

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${this.apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: { parts: [{ text: truncatedText }] },
                    taskType: 'RETRIEVAL_DOCUMENT'
                })
            }
        );

        if (!response.ok) {
            const error = await response.text();
            console.error('❌ Embedding failed:', error);
            throw new Error(`Gemini embedding error: ${error}`);
        }

        const data: GeminiEmbeddingResponse = await response.json();
        console.log('✅ Embedding generated:', data.embedding.values.length, 'dimensions');
        return data.embedding.values;
    }

    async generateResponse(prompt: string): Promise<string> {
        console.log('💭 Generating response...');

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                })
            }
        );

        if (!response.ok) {
            const error = await response.text();
            console.error('❌ Response generation failed:', error);
            throw new Error(`Gemini response error: ${error}`);
        }

        const data: GeminiChatResponse = await response.json();

        if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
            throw new Error('Invalid response from Gemini');
        }

        const answer = data.candidates[0].content.parts[0].text;
        console.log('✅ Response generated:', answer.substring(0, 100) + '...');
        return answer;
    }

    async getEmbeddingSize(): Promise<number> {
        return 768;
    }
}
