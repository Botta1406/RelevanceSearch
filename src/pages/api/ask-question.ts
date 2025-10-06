// import { NextApiRequest, NextApiResponse } from 'next';
// import { OllamaClient } from '@/lib/ollama';
// import { QdrantVectorDatabase } from '@/lib/vectordb';
//
// export default async function handler(
//     req: NextApiRequest,
//     res: NextApiResponse
// ) {
//     if (req.method !== 'POST') {
//         return res.status(405).json({ error: 'Method not allowed' });
//     }
//
//     try {
//         const { question } = req.body;
//
//         if (!question) {
//             return res.status(400).json({ error: 'Question is required' });
//         }
//
//         console.log(`🤔 Question received: "${question}"`);
//
//         const ollama = new OllamaClient();
//         const vectorDb = new QdrantVectorDatabase();
//
//         // Initialize without recreating collection
//         const embeddingSize = await ollama.getEmbeddingSize();
//         console.log(`📏 Using embedding size: ${embeddingSize}`);
//
//         // Don't recreate collection - just set the vector size
//         vectorDb['vectorSize'] = embeddingSize;
//
//         // Check how many documents are in the collection
//         const documentCount = await vectorDb.getDocumentCount();
//         console.log(`📊 Documents in collection: ${documentCount}`);
//
//         if (documentCount === 0) {
//             return res.status(200).json({
//                 answer: "I don't have any documents in my knowledge base. Please upload some documents first.",
//                 sources: [],
//                 question
//             });
//         }
//
//         // Generate embedding for the question
//         console.log('🧠 Generating question embedding...');
//         const questionEmbedding = await ollama.generateEmbedding(question);
//         console.log(`📏 Question embedding size: ${questionEmbedding.length}`);
//
//         // Search for relevant document chunks
//         console.log('🔍 Searching for relevant chunks...');
//         const searchResults = await vectorDb.searchSimilar(questionEmbedding, 10); // Get more results
//
//         console.log(`📊 Search results found: ${searchResults.documents[0]?.length || 0}`);
//
//         if (!searchResults.documents[0] || searchResults.documents[0].length === 0) {
//             console.log('❌ No search results found');
//             return res.status(200).json({
//                 answer: "No relevant documents found in the database. The search returned no results.",
//                 sources: [],
//                 question
//             });
//         }
//
//         // Log all search results for debugging
//         console.log('📋 All search results:');
//         searchResults.documents[0].forEach((doc, index) => {
//             const metadata = searchResults.metadatas[0][index];
//             const distance = searchResults.distances[0][index];
//             const similarity = 1 - distance;
//             console.log(`  ${index + 1}. Similarity: ${similarity.toFixed(3)} | Text: "${doc.substring(0, 100)}..." | Metadata:`, metadata);
//         });
//
//         // Prepare context from search results with lower threshold
//         const context = searchResults.documents[0]
//             .map((doc, index) => {
//                 const metadata = searchResults.metadatas[0][index];
//                 const similarity = 1 - searchResults.distances[0][index];
//
//                 // Use the correct metadata keys (we changed them in vectordb.ts)
//                 const documentTitle = metadata?.documentTitle ||
//                     metadata?.document_title ||
//                     metadata?.title ||
//                     'Unknown Document';
//
//                 return {
//                     text: doc,
//                     source: documentTitle,
//                     similarity: similarity.toFixed(3),
//                     rawSimilarity: similarity
//                 };
//             })
//             .filter(item => item.rawSimilarity > 0.1) // Much lower threshold
//             .slice(0, 5); // Take top 5 results
//
//         console.log(`📝 Context items after filtering: ${context.length}`);
//         context.forEach((item, index) => {
//             console.log(`  ${index + 1}. Source: "${item.source}" | Similarity: ${item.similarity} | Text: "${item.text.substring(0, 100)}..."`);
//         });
//
//         if (context.length === 0) {
//             console.log('❌ No context after filtering');
//             return res.status(200).json({
//                 answer: "I found some documents but they don't seem relevant to your question. Try asking about topics that might be in your uploaded documents.",
//                 sources: [],
//                 question
//             });
//         }
//
//         // Create prompt for answer generation
//         const prompt = `Based on the following context from uploaded documents, please answer the question accurately and concisely.
//
// Context:
// ${context.map((item, index) =>
//             `${index + 1}. From "${item.source}" (relevance: ${item.similarity}): ${item.text}`
//         ).join('\n\n')}
//
// Question: ${question}
//
// Instructions:
// - Answer based only on the provided context
// - If the context doesn't contain enough information, say so clearly
// - Be concise and accurate
// - Mention which document(s) your answer comes from
//
// Answer:`;
//
//         console.log('🤖 Generating AI response...');
//
//         // Generate answer using Ollama
//         const answer = await ollama.generateResponse(prompt);
//
//         console.log(`✅ Generated answer: "${answer.substring(0, 100)}..."`);
//
//         res.status(200).json({
//             answer: answer.trim(),
//             sources: context.map(item => ({
//                 document: item.source,
//                 similarity: item.similarity,
//                 snippet: item.text.substring(0, 200) + (item.text.length > 200 ? '...' : '')
//             })),
//             question
//         });
//
//     } catch (error) {
//         console.error('❌ Error generating answer:', error);
//         res.status(500).json({
//             error: 'Failed to generate answer',
//             details: error instanceof Error ? error.message : 'Unknown error'
//         });
//     }
// }
import { NextApiRequest, NextApiResponse } from 'next';
import { OllamaClient } from '@/lib/ollama';
import { GroqClient } from '@/lib/groqClient';
import { CohereClient } from '@/lib/cohereClient';
import { JinaClient } from '@/lib/jinaClient';
import { OpenAIClient } from '@/lib/openaiClient';
import { AIClient } from '@/lib/aiClient.interface';
import { QdrantVectorDatabase } from '@/lib/vectordb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { question, provider = 'ollama', apiKey, openaiApiKey, cohereApiKey } = req.body;

        if (!question) {
            return res.status(400).json({ error: 'Question required' });
        }

        console.log(`Provider: ${provider}`);

        let embeddingClient: AIClient;
        let chatClient: AIClient;
        let collectionName = 'cvs';
        let useHybridSearch = false;

        // Provider-specific setup
        if (provider === 'ollama') {
            embeddingClient = new OllamaClient();
            chatClient = new OllamaClient();
            collectionName = 'cvs';
        } else if (provider === 'groq') {
            const key = apiKey || process.env.GROQ_API_KEY;
            if (!key) {
                return res.status(400).json({
                    error: 'Groq API key required',
                    details: 'Enter your API key or add GROQ_API_KEY to .env'
                });
            }
            embeddingClient = new OllamaClient();
            chatClient = new GroqClient(key);
            collectionName = 'cvs';
        } else if (provider === 'cohere') {
            const key = apiKey || process.env.COHERE_API_KEY;
            if (!key) {
                return res.status(400).json({
                    error: 'Cohere API key required',
                    details: 'Enter your API key or add COHERE_API_KEY to .env'
                });
            }
            embeddingClient = new OllamaClient();
            chatClient = new CohereClient(key);
            collectionName = 'cvs';
        } else if (provider === 'jina') {
            const key = apiKey || process.env.JINA_API_KEY;
            if (!key) {
                return res.status(400).json({
                    error: 'Jina API key required',
                    details: 'Get free at https://jina.ai'
                });
            }
            embeddingClient = new JinaClient(key);
            chatClient = new GroqClient(process.env.GROQ_API_KEY || '');
            collectionName = 'cvs_jina';
        } else if (provider === 'openai-cohere') {
            const openaiKey = openaiApiKey || process.env.OPENAI_API_KEY;
            const cohereKey = cohereApiKey || process.env.COHERE_API_KEY;

            if (!openaiKey) {
                return res.status(400).json({
                    error: 'OpenAI API key required',
                    details: 'Get at https://platform.openai.com/api-keys'
                });
            }

            if (!cohereKey) {
                return res.status(400).json({
                    error: 'Cohere API key required',
                    details: 'Get at https://dashboard.cohere.com/api-keys'
                });
            }

            embeddingClient = new OpenAIClient(openaiKey);
            chatClient = new CohereClient(cohereKey);
            collectionName = 'cvs_openai';
            useHybridSearch = true;
        } else {
            return res.status(400).json({ error: 'Invalid provider' });
        }

        const vectorDb = new QdrantVectorDatabase();
        vectorDb['collectionName'] = collectionName;

        const embeddingSize = await embeddingClient.getEmbeddingSize();
        vectorDb['vectorSize'] = embeddingSize;

        const docCount = await vectorDb.getDocumentCount();
        console.log(`Collection: ${collectionName}, Documents: ${docCount}`);

        if (docCount === 0) {
            return res.status(200).json({
                answer: `No documents in ${collectionName}. Upload CVs with ${provider} first.`,
                sources: [],
                question
            });
        }

        // Stage 1: Vector search
        const questionEmbedding = await embeddingClient.generateEmbedding(question);
        const initialLimit = useHybridSearch ? 20 : 50;
        const results = await vectorDb.searchSimilar(questionEmbedding, initialLimit);

        if (!results.documents[0]?.length) {
            return res.status(200).json({
                answer: "No relevant documents found.",
                sources: [],
                question
            });
        }

        let topDocs;

        if (useHybridSearch) {
            // Stage 2: Cohere reranking for hybrid search
            console.log('🎯 Stage 2: Cohere reranking...');

            const candidates = results.documents[0].map((doc, idx) => {
                const meta = results.metadatas[0][idx];
                const embeddingScore = 1 - results.distances[0][idx];

                return {
                    text: doc,
                    title: meta?.documentTitle || 'Unknown',
                    embeddingScore,
                    metadata: meta
                };
            });

            // Rerank with Cohere
            const cohereKey = cohereApiKey || process.env.COHERE_API_KEY;
            const rerankResponse = await fetch('https://api.cohere.com/v1/rerank', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${cohereKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'rerank-english-v3.0',
                    query: question,
                    documents: candidates.map(c => c.text),
                    top_n: 5,
                    return_documents: false
                })
            });

            if (!rerankResponse.ok) {
                throw new Error(`Cohere rerank failed: ${rerankResponse.status}`);
            }

            const rerankData = await rerankResponse.json();

            topDocs = rerankData.results.map((result: any) => {
                const candidate = candidates[result.index];
                return {
                    text: candidate.text,
                    title: candidate.title,
                    score: result.relevance_score.toFixed(3),
                    rawScore: result.relevance_score,
                    embeddingScore: candidate.embeddingScore.toFixed(3),
                    snippet: candidate.text.substring(0, 200) + '...'
                };
            });

            console.log(`✅ Reranked to ${topDocs.length} results`);

        } else {
            // Standard search (no reranking)
            const docMap = new Map();
            results.documents[0].forEach((doc, i) => {
                const meta = results.metadatas[0][i];
                const score = 1 - results.distances[0][i];
                const title = meta?.documentTitle || 'Unknown';

                if (score > 0.01 && (!docMap.has(title) || docMap.get(title).score < score)) {
                    docMap.set(title, {
                        text: doc,
                        title,
                        score: score.toFixed(3),
                        rawScore: score,
                        snippet: doc.substring(0, 200) + '...'
                    });
                }
            });

            topDocs = Array.from(docMap.values())
                .sort((a, b) => b.rawScore - a.rawScore)
                .slice(0, 5);
        }

        if (topDocs.length === 0) {
            return res.status(200).json({
                answer: "No relevant matches.",
                sources: [],
                question
            });
        }
        const context = topDocs.map((d: any, i: number) =>
            `${i+1}. ${d.title}:\n${d.text}`
        ).join('\n\n');

        const prompt = `Answer based on ${topDocs.length} CVs.

Question: ${question}

CVs:
${context}

List candidates with key skills.`;

        const answer = await chatClient.generateResponse(prompt);

        const responseData: any = {
            answer: answer.trim(),
            sources: topDocs.map((d: any) => ({
                document: d.title,
                similarity: d.score,
                snippet: d.snippet
            })),
            question,
            provider
        };

        // Add hybrid search metadata
        if (useHybridSearch) {
            responseData.sources = topDocs.map((d: any) => ({
                document: d.title,
                similarity: d.embeddingScore,
                rerank_score: d.score,
                snippet: d.snippet
            }));
            responseData.stats = {
                initial: results.documents[0].length,
                reranked: topDocs.length,
                final: topDocs.length
            };
        }

        return res.status(200).json(responseData);

    } catch (error: any) {
        console.error('Error:', error);
        return res.status(500).json({
            error: 'Failed',
            details: error.message
        });
    }
}
