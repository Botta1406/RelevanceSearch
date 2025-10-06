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
import { GeminiClient } from '@/lib/gemini';
import { QdrantVectorDatabase } from '@/lib/vectordb';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { question, provider = 'ollama', apiKey } = req.body;

        if (!question) {
            return res.status(400).json({ error: 'Question is required' });
        }

        console.log(`🤔 Question received: "${question}"`);
        console.log(`🤖 Using provider: ${provider}`);

        // Initialize AI client based on provider
        let aiClient: OllamaClient | GeminiClient;

        if (provider === 'gemini') {
            const geminiKey = apiKey || process.env.GEMINI_API_KEY;

            if (!geminiKey) {
                return res.status(400).json({
                    error: 'Gemini API key required',
                    details: 'Get a free key at https://aistudio.google.com/app/apikey'
                });
            }

            console.log('🔑 Using Gemini API key:', geminiKey.substring(0, 15) + '...');
            aiClient = new GeminiClient(geminiKey);
        } else {
            aiClient = new OllamaClient();
        }

        const vectorDb = new QdrantVectorDatabase();

        // Get embedding size and set it
        const embeddingSize = await aiClient.getEmbeddingSize();
        console.log(`📏 Using embedding size: ${embeddingSize} (${provider})`);

        // Don't recreate collection - just set the vector size
        vectorDb['vectorSize'] = embeddingSize;

        // Check how many documents are in the collection
        const documentCount = await vectorDb.getDocumentCount();
        console.log(`📊 Documents in collection: ${documentCount}`);

        if (documentCount === 0) {
            return res.status(200).json({
                answer: "I don't have any documents in my knowledge base. Please upload some documents first.",
                sources: [],
                question
            });
        }

        // Generate embedding for the question
        console.log(`🧠 Generating question embedding with ${provider}...`);
        const questionEmbedding = await aiClient.generateEmbedding(question);
        console.log(`📏 Question embedding size: ${questionEmbedding.length}`);

        // Search for relevant document chunks
        console.log('🔍 Searching for relevant chunks...');
        const searchResults = await vectorDb.searchSimilar(questionEmbedding, 10);

        console.log(`📊 Search results found: ${searchResults.documents[0]?.length || 0}`);

        if (!searchResults.documents[0] || searchResults.documents[0].length === 0) {
            console.log('❌ No search results found');
            return res.status(200).json({
                answer: "No relevant documents found in the database. The search returned no results.",
                sources: [],
                question
            });
        }

        // Log all search results for debugging
        console.log('📋 All search results:');
        searchResults.documents[0].forEach((doc, index) => {
            const metadata = searchResults.metadatas[0][index];
            const distance = searchResults.distances[0][index];
            const similarity = 1 - distance;
            console.log(`  ${index + 1}. Similarity: ${similarity.toFixed(3)} | Text: "${doc.substring(0, 100)}..." | Metadata:`, metadata);
        });

        // Prepare context from search results
        const context = searchResults.documents[0]
            .map((doc, index) => {
                const metadata = searchResults.metadatas[0][index];
                const similarity = 1 - searchResults.distances[0][index];

                const documentTitle = metadata?.documentTitle ||
                    metadata?.document_title ||
                    metadata?.title ||
                    'Unknown Document';

                return {
                    text: doc,
                    source: documentTitle,
                    similarity: similarity.toFixed(3),
                    rawSimilarity: similarity
                };
            })
            .filter(item => item.rawSimilarity > 0.1)
            .slice(0, 5);

        console.log(`📝 Context items after filtering: ${context.length}`);

        if (context.length === 0) {
            console.log('❌ No context after filtering');
            return res.status(200).json({
                answer: "I found some documents but they don't seem relevant to your question. Try asking about topics that might be in your uploaded documents.",
                sources: [],
                question
            });
        }

        // Create prompt for answer generation
        const prompt = `Based on the following context from uploaded documents, please answer the question accurately and concisely.

Context:
${context.map((item, index) =>
            `${index + 1}. From "${item.source}" (relevance: ${item.similarity}): ${item.text}`
        ).join('\n\n')}

Question: ${question}

Instructions:
- Answer based only on the provided context
- If the context doesn't contain enough information, say so clearly
- Be concise and accurate
- Mention which document(s) your answer comes from

Answer:`;

        console.log(`🤖 Generating AI response with ${provider}...`);
        const answer = await aiClient.generateResponse(prompt);

        console.log(`✅ Generated answer: "${answer.substring(0, 100)}..."`);

        res.status(200).json({
            answer: answer.trim(),
            sources: context.map(item => ({
                document: item.source,
                similarity: item.similarity,
                snippet: item.text.substring(0, 200) + (item.text.length > 200 ? '...' : '')
            })),
            question
        });

    } catch (error) {
        console.error('❌ Error generating answer:', error);
        res.status(500).json({
            error: 'Failed to generate answer',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}
