export class GeminiClient {
    private apiKey: string;
    private baseUrl = 'https://generativelanguage.googleapis.com/v1'; // ✅ Changed to v1

    constructor(apiKey?: string) {
        this.apiKey = apiKey || process.env.GEMINI_API_KEY || '';
    }

    async testConnection(): Promise<boolean> {
        if (!this.apiKey) {
            console.error('No Gemini API key provided');
            return false;
        }

        try {
            // Test with a simple embedding request
            const response = await fetch(
                `${this.baseUrl}/models/text-embedding-004:embedContent?key=${this.apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        model: 'models/text-embedding-004',
                        content: { parts: [{ text: 'test' }] }
                    })
                }
            );

            return response.ok;
        } catch (error) {
            console.error('Gemini connection test failed:', error);
            return false;
        }
    }

    async generateEmbedding(text: string): Promise<number[]> {
        if (!this.apiKey) {
            throw new Error('Gemini API key is required');
        }

        try {
            const response = await fetch(
                `${this.baseUrl}/models/text-embedding-004:embedContent?key=${this.apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        model: 'models/text-embedding-004',
                        content: { parts: [{ text }] }
                    })
                }
            );

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Gemini API error: ${response.status} - ${error}`);
            }

            const data = await response.json();
            return data.embedding.values;
        } catch (error) {
            console.error('Gemini embedding error:', error);
            throw new Error(`Cannot connect to Gemini. Check your API key: ${error}`);
        }
    }

    async generateResponse(prompt: string): Promise<string> {
        if (!this.apiKey) {
            throw new Error('Gemini API key is required');
        }

        // Try different model names in order of preference
        const modelsToTry = [
            'gemini-1.5-flash',
            'gemini-1.5-pro',
            'gemini-pro'
        ];

        for (const modelName of modelsToTry) {
            try {
                console.log(`Trying model: ${modelName}`);
                const response = await fetch(
                    `${this.baseUrl}/models/${modelName}:generateContent?key=${this.apiKey}`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            contents: [{ parts: [{ text: prompt }] }]
                        })
                    }
                );

                if (response.ok) {
                    const data = await response.json();
                    console.log(`✅ Success with model: ${modelName}`);
                    return data.candidates[0].content.parts[0].text;
                }

                const errorText = await response.text();
                console.log(`❌ Model ${modelName} failed: ${response.status}`);

                // If it's a 404, try the next model
                if (response.status === 404) {
                    continue;
                }

                // For other errors, throw immediately
                throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
            } catch (error) {
                if (modelName === modelsToTry[modelsToTry.length - 1]) {
                    // Last model failed, throw the error
                    console.error('All models failed:', error);
                    throw new Error(`Gemini response generation failed: ${error}`);
                }
                // Otherwise continue to next model
                console.log(`Skipping to next model due to error`);
            }
        }

        throw new Error('All Gemini models failed. Please check your API key and available models.');
    }

    async getEmbeddingSize(): Promise<number> {
        return 768; // text-embedding-004 uses 768 dimensions
    }
}
