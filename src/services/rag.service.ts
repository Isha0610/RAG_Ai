import { parsePdf, cleanupFile, ParsedDocument } from './pdf.service';
import { generateChatResponse } from './embedding.service';
import { addDocuments, searchSimilar, getDocumentList, SearchResult } from './vectordb.service';

export interface UploadResult {
  success: boolean;
  documentId?: string;
  documentName?: string;
  chunksCreated?: number;
  error?: string;
}

export async function processAndStoreDocument(
  filePath: string,
  fileName: string
): Promise<UploadResult> {
  try {
    // Parse PDF and create chunks
    const parsedDoc: ParsedDocument = await parsePdf(filePath, fileName);

    // Store chunks in vector database
    await addDocuments(parsedDoc.chunks);

    // Clean up uploaded file
    cleanupFile(filePath);

    return {
      success: true,
      documentId: parsedDoc.id,
      documentName: parsedDoc.name,
      chunksCreated: parsedDoc.chunks.length,
    };
  } catch (error) {
    // Clean up on error
    cleanupFile(filePath);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export interface QueryResult {
  success: boolean;
  answer?: string;
  sources?: Array<{
    documentName: string;
    chunkIndex: number;
    relevanceScore: number;
  }>;
  error?: string;
}

export async function queryKnowledgeBase(question: string): Promise<QueryResult> {
  try {
    // Search for relevant chunks
    const searchResults: SearchResult[] = await searchSimilar(question, 5);

    if (searchResults.length === 0) {
      return {
        success: true,
        answer: 'No relevant documents found to answer your question. Please upload some documents first.',
        sources: [],
      };
    }

    // Extract context from search results
    const context = searchResults.map(result => result.text);

    // Generate answer using LLM
    const answer = await generateChatResponse(question, context);

    // Format sources
    const sources = searchResults.map(result => ({
      documentName: result.metadata.documentName,
      chunkIndex: result.metadata.chunkIndex,
      relevanceScore: 1 - result.score, // ChromaDB returns distance, convert to similarity
    }));

    return {
      success: true,
      answer,
      sources,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export async function listDocuments(): Promise<{ id: string; name: string }[]> {
  return getDocumentList();
}
