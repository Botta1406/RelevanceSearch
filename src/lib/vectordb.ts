import { QdrantClient } from '@qdrant/js-client-rest';

export interface DocumentMetadata {
    documentTitle?: string;
    title?: string;
    documentType?: string;
    type?: string;
    uploadedAt?: string;
    timestamp?: string;
    chunkIndex?: number;
    length?: number;
    [key: string]: any;
}

export interface DocumentInfo {
    title: string;
    type: string;
    uploadedAt: string;
    chunksCount: number;
}

// Remove the unused Document interface since we're not using it

export class QdrantVectorDatabase {
    private client: QdrantClient;
    private collectionName: string;
    private vectorSize: number | null = null;

    constructor() {
        this.client = new QdrantClient({
            url: process.env.QDRANT_URL || 'http://localhost:6333',
        });
        this.collectionName = process.env.QDRANT_COLLECTION_NAME || 'cvs';
    }

    async initialize(embeddingSize?: number): Promise<void> {
        try {
            console.log('Initializing Qdrant connection...');

            const collections = await this.client.getCollections();
            console.log('Connected to Qdrant successfully');

            const collectionExists = collections.collections.some(
                (collection) => collection.name === this.collectionName
            );

            if (collectionExists) {
                console.log(`Collection "${this.collectionName}" exists`);
                // DON'T delete existing collection - just set vector size
                const vectorSize = embeddingSize || 768;
                this.vectorSize = vectorSize;
                return;
            }

            // Only create if doesn't exist
            const vectorSize = embeddingSize || 768;
            this.vectorSize = vectorSize;

            console.log(`Creating collection "${this.collectionName}" with vector size: ${vectorSize}`);
            await this.client.createCollection(this.collectionName, {
                vectors: {
                    size: vectorSize,
                    distance: 'Cosine',
                },
            });

            console.log('Collection created successfully');

        } catch (error) {
            console.error('Error initializing Qdrant:', error);
            throw new Error(`Failed to connect to Qdrant. Make sure Qdrant is running on ${process.env.QDRANT_URL || 'http://localhost:6333'}. Error: ${error}`);
        }
    }

    async addDocument(
        id: string,
        text: string,
        embedding: number[],
        metadata: DocumentMetadata = {}
    ): Promise<any> {
        try {
            console.log(`📝 Adding document with ID: ${id}`);
            console.log(`📏 Embedding size: ${embedding.length}`);
            console.log(`📄 Text length: ${text.length}`);

            // Validate inputs
            if (!id || typeof id !== 'string') {
                throw new Error('Document ID must be a non-empty string');
            }

            if (!text || typeof text !== 'string' || text.trim().length === 0) {
                throw new Error('Document text must be a non-empty string');
            }

            if (!Array.isArray(embedding) || embedding.length === 0) {
                throw new Error('Embedding must be a non-empty array');
            }

            // Validate embedding size
            if (this.vectorSize && embedding.length !== this.vectorSize) {
                throw new Error(`Embedding size mismatch: expected ${this.vectorSize}, got ${embedding.length}`);
            }

            // Validate embedding values
            const invalidValues = embedding.filter(val => !isFinite(val) || isNaN(val));
            if (invalidValues.length > 0) {
                throw new Error(`Embedding contains ${invalidValues.length} invalid values (NaN or Infinity)`);
            }

            // Generate a numeric ID for Qdrant (some versions prefer numeric IDs)
            const numericId = this.generateNumericId(id);

            // Clean metadata to ensure it's JSON serializable
            const cleanMetadata = this.cleanMetadata(metadata);

            // Create point with proper format for Qdrant
            const point = {
                id: numericId,
                vector: embedding,
                payload: {
                    original_id: id,
                    text: text.trim(),
                    document_title: cleanMetadata.documentTitle || cleanMetadata.title || 'Unknown',
                    document_type: cleanMetadata.documentType || cleanMetadata.type || 'text',
                    uploaded_at: cleanMetadata.uploadedAt || new Date().toISOString(),
                    chunk_index: cleanMetadata.chunkIndex || 0,
                    text_length: text.length,
                    timestamp: new Date().toISOString(),
                },
            };

            console.log(`🔄 Upserting point to collection "${this.collectionName}"...`);
            console.log(`📊 Point ID: ${numericId} (from ${id})`);

            try {
                const result = await this.client.upsert(this.collectionName, {
                    wait: true,
                    points: [point],
                });

                console.log(`✅ Successfully added document with ID: ${id} (numeric: ${numericId})`);
                return result;

            } catch (qdrantError: any) {
                console.error(`❌ Qdrant upsert failed:`, qdrantError);

                // Log detailed error information
                if (qdrantError.response) {
                    console.error(`📊 Response status: ${qdrantError.response.status}`);
                    console.error(`📊 Response data:`, qdrantError.response.data);
                }

                // Try to get more specific error info
                let errorDetails = 'Unknown Qdrant error';
                if (qdrantError.response?.data) {
                    if (typeof qdrantError.response.data === 'string') {
                        errorDetails = qdrantError.response.data;
                    } else if (qdrantError.response.data.message) {
                        errorDetails = qdrantError.response.data.message;
                    } else {
                        errorDetails = JSON.stringify(qdrantError.response.data);
                    }
                }

                throw new Error(`Qdrant upsert failed: ${errorDetails}`);
            }

        } catch (error) {
            console.error(`❌ Error adding document ${id}:`, error);
            throw error;
        }
    }

    private generateNumericId(stringId: string): number {
        // Generate a consistent numeric ID from string ID
        let hash = 0;
        for (let i = 0; i < stringId.length; i++) {
            const char = stringId.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        // Ensure positive number
        return Math.abs(hash);
    }

    private cleanMetadata(metadata: DocumentMetadata): Record<string, any> {
        const cleaned: Record<string, any> = {};

        for (const [key, value] of Object.entries(metadata)) {
            // Only include serializable values
            if (value !== undefined && value !== null) {
                if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
                    cleaned[key] = value;
                } else if (value instanceof Date) {
                    cleaned[key] = value.toISOString();
                } else {
                    // Try to serialize objects/arrays
                    try {
                        cleaned[key] = JSON.parse(JSON.stringify(value));
                    } catch {
                        // Skip non-serializable values
                        console.warn(`⚠️ Skipping non-serializable metadata key: ${key}`);
                    }
                }
            }
        }

        return cleaned;
    }

    async searchSimilar(queryEmbedding: number[], limit: number = 5): Promise<{
        documents: string[][];
        metadatas: Array<Array<Record<string, any>>>;
        distances: number[][];
        ids: string[][];
    }> {
        try {
            console.log(`🔍 Searching with embedding size: ${queryEmbedding.length}, limit: ${limit}`);

            // Validate embedding
            if (this.vectorSize && queryEmbedding.length !== this.vectorSize) {
                throw new Error(`Query embedding size mismatch: expected ${this.vectorSize}, got ${queryEmbedding.length}`);
            }

            const searchResult = await this.client.search(this.collectionName, {
                vector: queryEmbedding,
                limit: limit,
                with_payload: true,
            });

            console.log(`📊 Found ${searchResult.length} search results`);

            const documents = searchResult.map((result) => result.payload?.text as string || '');
            const metadatas = searchResult.map((result) => {
                const payload = result.payload || {};
                return {
                    documentTitle: payload.document_title as string,
                    title: payload.document_title as string,
                    documentType: payload.document_type as string,
                    type: payload.document_type as string,
                    uploadedAt: payload.uploaded_at as string,
                    chunkIndex: payload.chunk_index as number,
                    length: payload.text_length as number,
                };
            });
            const distances = searchResult.map((result) => 1 - (result.score || 0));
            const ids = searchResult.map((result) => (result.payload?.original_id as string) || result.id.toString());

            return {
                documents: [documents],
                metadatas: [metadatas],
                distances: [distances],
                ids: [ids],
            };
        } catch (error) {
            console.error('❌ Error searching in Qdrant:', error);
            throw error;
        }
    }

    async getAllDocuments(): Promise<DocumentInfo[]> {
        try {
            const scrollResult = await this.client.scroll(this.collectionName, {
                limit: 1000,
                with_payload: true,
            });

            const documentMap = new Map<string, DocumentInfo>();

            scrollResult.points.forEach((point) => {
                const payload = point.payload || {};
                const documentTitle = (payload.document_title as string) || 'Unknown Document';
                const documentType = (payload.document_type as string) || 'Unknown';
                const uploadedAt = (payload.uploaded_at as string) || new Date().toISOString();

                if (!documentMap.has(documentTitle)) {
                    documentMap.set(documentTitle, {
                        title: documentTitle,
                        type: documentType,
                        uploadedAt: uploadedAt,
                        chunksCount: 0
                    });
                }

                const doc = documentMap.get(documentTitle)!;
                doc.chunksCount++;
            });

            return Array.from(documentMap.values()).sort((a, b) =>
                new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
            );
        } catch (error) {
            console.error('❌ Error getting all documents:', error);
            return [];
        }
    }

    async removeDocumentByTitle(title: string): Promise<boolean> {
        try {
            const scrollResult = await this.client.scroll(this.collectionName, {
                limit: 1000,
                with_payload: true,
                filter: {
                    must: [
                        {
                            key: "document_title",
                            match: { value: title }
                        }
                    ]
                }
            });

            const pointIds = scrollResult.points.map(point => point.id);

            if (pointIds.length > 0) {
                await this.client.delete(this.collectionName, {
                    points: pointIds,
                    wait: true
                });
                console.log(`🗑️ Removed ${pointIds.length} chunks for document: ${title}`);
                return true;
            }

            return false;
        } catch (error) {
            console.error('❌ Error removing document:', error);
            return false;
        }
    }

    async getDocumentCount(): Promise<number> {
        try {
            const info = await this.client.getCollection(this.collectionName);
            return info.points_count || 0;
        } catch (error) {
            console.error('❌ Error getting document count:', error);
            return 0;
        }
    }

    async clearAll(): Promise<void> {
        try {
            await this.client.deleteCollection(this.collectionName);
            await this.initialize();
            console.log('🧹 Cleared all documents');
        } catch (error) {
            console.error('❌ Error clearing collection:', error);
            throw error;
        }
    }

    getVectorSize(): number | null {
        return this.vectorSize;
    }

    async testConnection(): Promise<boolean> {
        try {
            await this.client.getCollections();
            return true;
        } catch (error) {
            console.error('❌ Qdrant connection test failed:', error);
            return false;
        }
    }

    async resetCollection(): Promise<void> {
        try {
            console.log('🔄 Resetting collection...');

            try {
                await this.client.deleteCollection(this.collectionName);
                console.log('🗑️ Deleted existing collection');
            } catch (error) {
                console.log('⚠️ Collection might not exist, continuing...');
            }

            await new Promise(resolve => setTimeout(resolve, 2000));
            this.vectorSize = null; // Reset vector size

            console.log('✅ Collection reset complete');

        } catch (error) {
            console.error('❌ Error resetting collection:', error);
            throw error;
        }
    }
}
