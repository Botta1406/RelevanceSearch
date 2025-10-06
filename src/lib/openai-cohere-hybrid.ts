import { OpenAIClient } from './openaiClient';
import { QdrantVectorDatabase } from './vectordb';

interface HybridSearchResult {
    document: string;
    embeddingScore: number;
    rerankScore: number;
    finalScore: number;
    snippet: string;
}

export async function searchWithOpenAICohere(
    query: string,
    topK: number = 5,
    openaiKey?: string,
    cohereKey?: string
): Promise<HybridSearchResult[]> {

    const openai = new OpenAIClient(openaiKey);
    const cohereApiKey = cohereKey || process.env.COHERE_API_KEY;

    if (!cohereApiKey) {
        throw new Error('Cohere API key required for reranking');
    }

    // Stage 1: OpenAI embedding search (get 20 candidates)
    console.log('Stage 1: OpenAI embedding search...');
    const vectorDb = new QdrantVectorDatabase();
    vectorDb['collectionName'] = 'cvs_openai';
    vectorDb['vectorSize'] = 1536;

    const queryEmbedding = await openai.generateEmbedding(query);
    const searchResults = await vectorDb.searchSimilar(queryEmbedding, 20);

    if (!searchResults.documents[0]?.length) {
        return [];
    }

    // Prepare candidates for reranking
    const candidates = searchResults.documents[0].map((doc, idx) => ({
        text: doc,
        metadata: searchResults.metadatas[0][idx],
        embeddingScore: 1 - searchResults.distances[0][idx]
    }));

    // Stage 2: Cohere reranking
    console.log('Stage 2: Cohere reranking...');
    const response = await fetch('https://api.cohere.com/v1/rerank', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${cohereApiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'rerank-english-v3.0',
            query: query,
            documents: candidates.map(c => c.text),
            top_n: topK,
            return_documents: false
        })
    });

    if (!response.ok) {
        throw new Error(`Cohere rerank failed: ${response.status}`);
    }

    const data = await response.json();

    // Combine scores and return top results
    return data.results.map((result: any) => {
        const candidate = candidates[result.index];
        return {
            document: candidate.metadata?.documentTitle || 'Unknown',
            embeddingScore: candidate.embeddingScore,
            rerankScore: result.relevance_score,
            finalScore: (candidate.embeddingScore * 0.3 + result.relevance_score * 0.7),
            snippet: candidate.text.substring(0, 200) + '...'
        };
    });
}
