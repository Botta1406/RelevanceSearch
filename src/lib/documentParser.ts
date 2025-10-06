export interface ParsedDocument {
    text: string;
    title: string;
    type: string;
    chunks: DocumentChunk[];
}

export interface DocumentChunk {
    id: string;
    text: string;
    title: string;
    chunkIndex: number;
    metadata: Record<string, any>;
}

export class DocumentParser {
    static async parseFile(file: Buffer, filename: string, mimeType: string): Promise<ParsedDocument> {
        let text = '';
        let title = filename.replace(/\.[^/.]+$/, ""); // Remove extension

        console.log(`📄 Parsing file: ${filename} (${mimeType})`);
        console.log(`📊 File size: ${file.length} bytes`);

        try {
            if (mimeType === 'text/plain' || filename.endsWith('.txt')) {
                text = file.toString('utf-8');
                console.log('✅ Parsed as plain text');
            }
            else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || filename.endsWith('.docx')) {
                console.log('🔄 Parsing DOCX file...');
                try {
                    const mammoth = require('mammoth');
                    const result = await mammoth.extractRawText({ buffer: file });
                    text = result.value;
                    console.log('✅ DOCX parsed successfully');
                } catch (error) {
                    console.error('❌ DOCX parsing failed:', error);
                    throw new Error(`DOCX parsing failed: ${error}`);
                }
            }
            else if (mimeType === 'application/pdf' || filename.endsWith('.pdf')) {
                console.log('🔄 Parsing PDF file...');
                text = await this.parsePDF(file, filename);
                console.log('✅ PDF parsed successfully');
            }
            else {
                throw new Error(`Unsupported file type: ${mimeType}. Please upload PDF, DOCX, or TXT files.`);
            }

            console.log(`📝 Extracted text length: ${text.length} characters`);

            if (!text || text.trim().length < 10) {
                throw new Error(`Document appears to be empty or contains only images/scanned content. Extracted text: "${text.trim().substring(0, 100)}..."`);
            }

            const chunks = this.chunkDocument(text, title);
            console.log(`📦 Created ${chunks.length} chunks`);

            return {
                text,
                title,
                type: mimeType,
                chunks
            };
        } catch (error) {
            console.error(`❌ Error parsing ${filename}:`, error);
            throw new Error(`Failed to parse ${filename}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private static async parsePDF(file: Buffer, filename: string): Promise<string> {
        try {
            console.log('🔄 Initializing PDF parser...');

            // Dynamic import for pdf-parse
            let pdfParse;
            try {
                pdfParse = require('pdf-parse');
            } catch (error) {
                throw new Error('pdf-parse package not found. Please install it with: npm install pdf-parse');
            }

            console.log('📖 Extracting text from PDF...');

            const options = {
                // Normalize whitespace and combine text items
                pagerender: (pageData: any) => {
                    return pageData.getTextContent({
                        normalizeWhitespace: true,
                        disableCombineTextItems: false
                    }).then((textContent: any) => {
                        return textContent.items.map((item: any) => item.str).join(' ');
                    });
                }
            };

            let pdfData;
            try {
                // Try with custom options first
                pdfData = await pdfParse(file, options);
            } catch (error) {
                console.log('⚠️ Custom parsing failed, trying basic parsing...');
                // Fallback to basic parsing
                pdfData = await pdfParse(file);
            }

            let text = pdfData.text || '';

            console.log(`📊 PDF info: ${pdfData.numpages} pages, raw text length: ${text.length}`);
            console.log(`🔍 First 200 chars: "${text.substring(0, 200)}"`);

            // Clean up the text
            text = text
                .replace(/\s+/g, ' ') // Replace multiple spaces with single space
                .replace(/\n+/g, ' ') // Replace newlines with spaces
                .trim();

            if (text.length < 10) {
                throw new Error(`PDF appears to contain only images or scanned content. This might be a scanned document that requires OCR. Extracted: "${text}"`);
            }

            return text;
        } catch (error) {
            console.error('❌ PDF parsing error:', error);
            if (error instanceof Error && error.message.includes('pdf-parse')) {
                throw error;
            }
            throw new Error(`PDF parsing failed: ${error instanceof Error ? error.message : 'Unknown PDF error'}. The PDF might be password-protected, corrupted, or contain only images.`);
        }
    }

    private static chunkDocument(text: string, title: string, chunkSize: number = 500): DocumentChunk[] {
        console.log(`🔪 Chunking document: ${title} (${text.length} characters)`);

        // Clean the text
        const cleanText = text.replace(/\s+/g, ' ').trim();

        if (cleanText.length === 0) {
            console.warn('⚠️ Clean text is empty');
            return [];
        }

        // Try to split by sentences first
        let sentences = cleanText.split(/[.!?]+/).filter(s => s.trim().length > 20);

        if (sentences.length === 0) {
            // If no sentences, split by paragraphs
            sentences = cleanText.split(/\n\s*\n/).filter(s => s.trim().length > 20);
        }

        if (sentences.length === 0) {
            // Last resort: split by length
            return this.chunkByLength(cleanText, title, chunkSize);
        }

        console.log(`📝 Found ${sentences.length} text segments`);

        const chunks: DocumentChunk[] = [];
        let currentChunk = '';
        let chunkIndex = 0;

        for (const sentence of sentences) {
            const trimmedSentence = sentence.trim();
            if (trimmedSentence.length === 0) continue;

            if (currentChunk.length + trimmedSentence.length > chunkSize && currentChunk.length > 0) {
                chunks.push({
                    id: `${title}_chunk_${chunkIndex}`,
                    text: currentChunk.trim(),
                    title,
                    chunkIndex,
                    metadata: {
                        document: title,
                        chunkIndex,
                        length: currentChunk.length
                    }
                });
                chunkIndex++;
                currentChunk = trimmedSentence;
            } else {
                currentChunk += (currentChunk ? '. ' : '') + trimmedSentence;
            }
        }

        // Add the last chunk
        if (currentChunk.trim().length > 10) {
            chunks.push({
                id: `${title}_chunk_${chunkIndex}`,
                text: currentChunk.trim(),
                title,
                chunkIndex,
                metadata: {
                    document: title,
                    chunkIndex,
                    length: currentChunk.length
                }
            });
        }

        console.log(`✅ Created ${chunks.length} chunks`);
        return chunks;
    }

    private static chunkByLength(text: string, title: string, chunkSize: number): DocumentChunk[] {
        const chunks: DocumentChunk[] = [];
        let chunkIndex = 0;

        for (let i = 0; i < text.length; i += chunkSize) {
            const chunk = text.slice(i, i + chunkSize).trim();
            if (chunk.length > 10) {
                chunks.push({
                    id: `${title}_chunk_${chunkIndex}`,
                    text: chunk,
                    title,
                    chunkIndex,
                    metadata: {
                        document: title,
                        chunkIndex,
                        length: chunk.length
                    }
                });
                chunkIndex++;
            }
        }

        return chunks;
    }
}