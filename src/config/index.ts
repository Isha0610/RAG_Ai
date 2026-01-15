import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
  port: parseInt(process.env.SLACK_PORT || process.env.PORT || '3000', 10),

  ollama: {
    baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    model: process.env.OLLAMA_MODEL || 'llama3',
    embedModel: process.env.OLLAMA_EMBED_MODEL || 'nomic-embed-text',
  },

  slack: {
    botToken: process.env.SLACK_BOT_TOKEN || '',
    signingSecret: process.env.SLACK_SIGNING_SECRET || '',
    appToken: process.env.SLACK_APP_TOKEN || '',
  },

  chromadb: {
    path: process.env.CHROMA_DB_PATH || './chroma_data',
    collectionName: 'policy_documents',
  },

  chunking: {
    chunkSize: 500,
    chunkOverlap: 50,
  },

  uploads: {
    directory: path.join(process.cwd(), 'uploads'),
    maxFileSize: 10 * 1024 * 1024, // 10MB
  },
};

export function validateConfig(): void {
  // Check Ollama is accessible
  console.log(`Ollama URL: ${config.ollama.baseUrl}`);
  console.log(`LLM Model: ${config.ollama.model}`);
  console.log(`Embed Model: ${config.ollama.embedModel}`);
}
