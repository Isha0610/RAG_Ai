import { config } from '../config';

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch(`${config.ollama.baseUrl}/api/embeddings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.ollama.embedModel,
      prompt: text,
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama embedding failed: ${response.statusText}`);
  }

  const data = await response.json() as { embedding: number[] };
  return data.embedding;
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const embeddings: number[][] = [];

  // Process sequentially to avoid overwhelming Ollama
  for (const text of texts) {
    const embedding = await generateEmbedding(text);
    embeddings.push(embedding);
  }

  return embeddings;
}

export async function generateChatResponse(
  question: string,
  context: string[]
): Promise<string> {
  const contextText = context.join('\n\n---\n\n');

  const prompt = `You are a helpful assistant that answers questions about company policies and documents.
Use the provided context to answer the user's question.
If the answer cannot be found in the context, say so clearly.
Always be concise and professional.

Context:
${contextText}

Question: ${question}

Please provide a clear and concise answer based on the context above.`;

  const response = await fetch(`${config.ollama.baseUrl}/api/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.ollama.model,
      prompt,
      stream: false,
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama generate failed: ${response.statusText}`);
  }

  const data = await response.json() as { response: string };
  return data.response || 'Unable to generate response.';
}
