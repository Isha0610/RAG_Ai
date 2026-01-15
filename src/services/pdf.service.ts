import fs from 'fs';
import pdf from 'pdf-parse';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';

export interface TextChunk {
  id: string;
  text: string;
  metadata: {
    documentId: string;
    documentName: string;
    chunkIndex: number;
    totalChunks: number;
  };
}

export interface ParsedDocument {
  id: string;
  name: string;
  totalPages: number;
  chunks: TextChunk[];
}

export async function parsePdf(filePath: string, fileName: string): Promise<ParsedDocument> {
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdf(dataBuffer);

  const documentId = uuidv4();
  const text = data.text;
  const chunks = splitIntoChunks(text, documentId, fileName);

  return {
    id: documentId,
    name: fileName,
    totalPages: data.numpages,
    chunks,
  };
}

function splitIntoChunks(
  text: string,
  documentId: string,
  documentName: string
): TextChunk[] {
  const { chunkSize, chunkOverlap } = config.chunking;
  const chunks: TextChunk[] = [];

  // Clean the text
  const cleanedText = text
    .replace(/\s+/g, ' ')
    .trim();

  // Split by sentences for better chunk boundaries
  const sentences = cleanedText.match(/[^.!?]+[.!?]+/g) || [cleanedText];

  let currentChunk = '';
  let chunkIndex = 0;

  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();

    // Estimate tokens (rough approximation: 1 token ≈ 4 characters)
    const currentTokens = Math.ceil(currentChunk.length / 4);
    const sentenceTokens = Math.ceil(trimmedSentence.length / 4);

    if (currentTokens + sentenceTokens > chunkSize && currentChunk) {
      // Save current chunk
      chunks.push({
        id: uuidv4(),
        text: currentChunk.trim(),
        metadata: {
          documentId,
          documentName,
          chunkIndex,
          totalChunks: 0, // Will be updated later
        },
      });

      // Start new chunk with overlap
      const overlapTokens = chunkOverlap * 4;
      currentChunk = currentChunk.slice(-overlapTokens) + ' ' + trimmedSentence;
      chunkIndex++;
    } else {
      currentChunk += ' ' + trimmedSentence;
    }
  }

  // Don't forget the last chunk
  if (currentChunk.trim()) {
    chunks.push({
      id: uuidv4(),
      text: currentChunk.trim(),
      metadata: {
        documentId,
        documentName,
        chunkIndex,
        totalChunks: 0,
      },
    });
  }

  // Update total chunks count
  const totalChunks = chunks.length;
  chunks.forEach(chunk => {
    chunk.metadata.totalChunks = totalChunks;
  });

  return chunks;
}

export function cleanupFile(filePath: string): void {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error('Error cleaning up file:', error);
  }
}
