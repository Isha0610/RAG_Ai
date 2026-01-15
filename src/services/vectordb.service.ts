import { config } from '../config';
import { TextChunk } from './pdf.service';
import { generateEmbeddings, generateEmbedding } from './embedding.service';
import fs from 'fs';
import path from 'path';

interface StoredDocument {
  id: string;
  text: string;
  embedding: number[];
  metadata: {
    documentId: string;
    documentName: string;
    chunkIndex: number;
    totalChunks: number;
  };
}

// In-memory store with file persistence
let documents: StoredDocument[] = [];
const STORE_PATH = path.join(process.cwd(), 'vector_store.json');

// Load existing data on startup
function loadStore(): void {
  try {
    if (fs.existsSync(STORE_PATH)) {
      const data = fs.readFileSync(STORE_PATH, 'utf-8');
      documents = JSON.parse(data);
      console.log(`Loaded ${documents.length} documents from store`);
    }
  } catch (error) {
    console.error('Error loading vector store:', error);
    documents = [];
  }
}

function saveStore(): void {
  try {
    fs.writeFileSync(STORE_PATH, JSON.stringify(documents, null, 2));
  } catch (error) {
    console.error('Error saving vector store:', error);
  }
}

// Initialize store
loadStore();

function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function addDocuments(chunks: TextChunk[]): Promise<void> {
  const texts = chunks.map(chunk => chunk.text);
  const embeddings = await generateEmbeddings(texts);

  for (let i = 0; i < chunks.length; i++) {
    documents.push({
      id: chunks[i].id,
      text: chunks[i].text,
      embedding: embeddings[i],
      metadata: chunks[i].metadata,
    });
  }

  saveStore();
  console.log(`Added ${chunks.length} chunks to vector store`);
}

export interface SearchResult {
  id: string;
  text: string;
  score: number;
  metadata: {
    documentId: string;
    documentName: string;
    chunkIndex: number;
    totalChunks: number;
  };
}

export async function searchSimilar(
  query: string,
  topK: number = 3
): Promise<SearchResult[]> {
  if (documents.length === 0) {
    return [];
  }

  const queryEmbedding = await generateEmbedding(query);

  // Calculate similarity for all documents
  const scored = documents.map(doc => ({
    ...doc,
    score: cosineSimilarity(queryEmbedding, doc.embedding),
  }));

  // Sort by similarity (highest first) and take top K
  scored.sort((a, b) => b.score - a.score);
  const topResults = scored.slice(0, topK);

  return topResults.map(result => ({
    id: result.id,
    text: result.text,
    score: result.score,
    metadata: result.metadata,
  }));
}

export async function getDocumentList(): Promise<{ id: string; name: string }[]> {
  const documentMap = new Map<string, string>();

  for (const doc of documents) {
    documentMap.set(doc.metadata.documentId, doc.metadata.documentName);
  }

  return Array.from(documentMap.entries()).map(([id, name]) => ({ id, name }));
}

export async function deleteDocument(documentId: string): Promise<void> {
  documents = documents.filter(doc => doc.metadata.documentId !== documentId);
  saveStore();
}
