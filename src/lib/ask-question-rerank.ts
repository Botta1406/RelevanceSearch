import { NextApiRequest, NextApiResponse } from 'next';
import { CohereRerankClient } from '@/lib/cohereRerankClient';
import { QdrantVectorDatabase } from '@/lib/vectordb';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { question } = req.body;

        if (!question) {
            return res.status(400).json({ error: 'Question is required' });
        }

        console.log(`\n🎯 [RERANK] Question: "${question}"`);

        const aiClient = new CohereRerankClient();
        const vectorDb = new QdrantVectorDatabase();

        const embeddingSize = await aiClient.getEmbeddingSize();
        vectorDb['vectorSize'] = embeddingSize;

        const documentCount = await vectorDb.getDocumentCount();
        console.log(`📊 Documents: ${documentCount}`);

        if (documentCount === 0) {
            return res.status(200).json({
                answer: "No documents uploaded.",
                sources: [],
                question
            });
        }

        // STAGE 1: Vector Search
        console.log('🔍 Stage 1: Vector search (20 candidates)...');
        const questionEmbedding = await aiClient.generateEmbeddingForQuery(question);
        const searchResults = await vectorDb.searchSimilar(questionEmbedding, 20);

        if (!searchResults.documents[0]?.length) {
            return res.status(200).json({
                answer: "No relevant information found.",
                sources: [],
                question
            });
        }

        console.log(`📊 Found ${searchResults.documents[0].length} candidates`);

        const candidates = searchResults.documents[0].map((doc, index) => {
            const metadata = searchResults.metadatas[0][index];
            const vectorSimilarity = 1 - searchResults.distances[0][index];

            return {
                text: doc,
                metadata: {
                    ...metadata,
                    vectorSimilarity: vectorSimilarity.toFixed(3),
                    documentTitle: metadata?.documentTitle || 'Unknown'
                }
            };
        });

        // STAGE 2: Rerank
        console.log('🎯 Stage 2: Reranking...');
        const reranked = await aiClient.rerankDocuments(question, candidates, 5);

        console.log('📊 Comparison:');
        reranked.forEach((r, i) => {
            console.log(`  ${i + 1}. Rerank: ${r.relevance_score.toFixed(3)} | Vector: ${r.metadata.vectorSimilarity}`);
        });

        const finalContext = reranked
            .filter(r => r.relevance_score > 0.3)
            .slice(0, 5);

        if (finalContext.length === 0) {
            return res.status(200).json({
                answer: "No highly relevant documents after reranking.",
                sources: [],
                question
            });
        }

        const documents = finalContext.map(item => ({
            text: item.text,
            title: item.metadata.documentTitle
        }));

        const prompt = `Question: ${question}

Answer based ONLY on provided documents. Be concise. Cite sources.`;

        const answer = await aiClient.generateResponse(prompt, documents);

        res.status(200).json({
            answer: answer.trim(),
            sources: finalContext.map(item => ({
                document: item.metadata.documentTitle,
                rerank_score: item.relevance_score.toFixed(3),
                vector_score: item.metadata.vectorSimilarity,
                snippet: item.text.substring(0, 200) + '...'
            })),
            question,
            provider: 'Cohere Embed + Rerank (FREE)',
            stats: {
                initial: searchResults.documents[0].length,
                reranked: reranked.length,
                final: finalContext.length
            }
        });

    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({
            error: 'Failed',
            details: error instanceof Error ? error.message : 'Unknown'
        });
    }
}
