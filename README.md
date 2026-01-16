# RAG AI - Multi-Channel Document Q&A System

A Retrieval-Augmented Generation (RAG) system that lets you upload PDF documents and query them using natural language through a web interface, REST API, or Slack.

## Features

- **PDF Document Processing** - Upload PDFs that are automatically parsed, chunked, and vectorized
- **AI-Powered Q&A** - Ask questions in natural language and get answers with source attribution
- **Multi-Channel Access** - Query via Web UI, REST API, or Slack bot
- **Local LLM** - Uses Ollama for privacy-focused, local inference (no cloud API required)
- **Vector Search** - Cosine similarity search for relevant document retrieval

## Prerequisites

- **Node.js** v18 or higher
- **Ollama** installed and running ([install guide](https://ollama.ai))
- **Slack App** credentials (optional, for Slack integration)

### Required Ollama Models

```bash
ollama pull llama3
ollama pull nomic-embed-text
```

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/RAG_Ai.git
   cd RAG_Ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your settings:
   ```
   PORT=3000
   SLACK_BOT_TOKEN=xoxb-your-bot-token
   SLACK_SIGNING_SECRET=your-signing-secret
   SLACK_APP_TOKEN=xapp-your-app-token
   ```

4. **Start Ollama**
   ```bash
   ollama serve
   ```

5. **Run the application**
   ```bash
   # Development mode (with hot reload)
   npm run dev

   # Production mode
   npm run build
   npm start
   ```

6. **Access the application**

   Open http://localhost:3000 in your browser

## Usage

### Web Interface

1. Navigate to http://localhost:3000
2. Upload PDF documents using the upload section
3. Ask questions in the Q&A section
4. View and manage uploaded documents

### REST API

#### Upload a Document
```bash
curl -X POST http://localhost:3000/api/upload \
  -F "file=@document.pdf"
```

#### Query the Knowledge Base
```bash
curl -X POST http://localhost:3000/api/query \
  -H "Content-Type: application/json" \
  -d '{"question": "What is the PTO policy?"}'
```

#### List Documents
```bash
curl http://localhost:3000/api/documents
```

#### Delete a Document
```bash
curl -X DELETE http://localhost:3000/api/documents/{document-id}
```

#### Health Check
```bash
curl http://localhost:3000/api/health
```

### Slack Bot

1. **Mention the bot in a channel:**
   ```
   @YourBot What is the vacation policy?
   ```

2. **Direct message the bot:**
   Simply DM your question to the bot

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload` | Upload and process a PDF file |
| POST | `/api/query` | Query the knowledge base |
| GET | `/api/documents` | List all uploaded documents |
| DELETE | `/api/documents/:id` | Delete a document by ID |
| GET | `/api/health` | Health check endpoint |

### Response Examples

**Query Response:**
```json
{
  "answer": "The PTO policy allows for 15 days of paid time off per year...",
  "sources": [
    {
      "documentName": "employee-handbook.pdf",
      "chunkIndex": 5,
      "similarity": 0.89
    }
  ]
}
```

## Project Structure

```
RAG_Ai/
├── src/
│   ├── config/
│   │   └── index.ts           # Configuration management
│   ├── services/
│   │   ├── pdf.service.ts     # PDF parsing and chunking
│   │   ├── embedding.service.ts # Vector embeddings via Ollama
│   │   ├── vectordb.service.ts  # Vector storage and search
│   │   └── rag.service.ts     # RAG orchestration
│   ├── routes/
│   │   └── api.routes.ts      # Express API endpoints
│   ├── slack/
│   │   └── bot.ts             # Slack bot implementation
│   ├── types/
│   │   └── pdf-parse.d.ts     # TypeScript definitions
│   └── index.ts               # Application entry point
├── public/
│   └── index.html             # Web interface
├── uploads/                   # Uploaded PDF storage
├── package.json
├── tsconfig.json
└── .env.example
```

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    User Interfaces                       │
│  ┌─────────┐    ┌─────────┐    ┌─────────────────────┐  │
│  │ Web UI  │    │   API   │    │     Slack Bot       │  │
│  └────┬────┘    └────┬────┘    └──────────┬──────────┘  │
└───────┼──────────────┼────────────────────┼─────────────┘
        │              │                    │
        └──────────────┼────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────┐
│                   Express Server                         │
│                   (Port 3000)                            │
└─────────────────────────┬───────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    RAG Service                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │ PDF Service │  │  Embedding  │  │   Vector DB     │  │
│  │  (parsing)  │  │   Service   │  │    Service      │  │
│  └─────────────┘  └─────────────┘  └─────────────────┘  │
└─────────────────────────┬───────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────┐
│                      Ollama                              │
│         (llama3 + nomic-embed-text models)              │
└─────────────────────────────────────────────────────────┘
```

### RAG Pipeline

1. **Document Ingestion:**
   - PDF uploaded → Text extracted → Split into chunks → Embeddings generated → Stored in vector DB

2. **Query Processing:**
   - Question received → Embedding generated → Similar chunks retrieved → Context + question sent to LLM → Answer returned

## Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3000 |
| `SLACK_BOT_TOKEN` | Slack bot OAuth token | - |
| `SLACK_SIGNING_SECRET` | Slack app signing secret | - |
| `SLACK_APP_TOKEN` | Slack app-level token (Socket Mode) | - |

## Tech Stack

- **Runtime:** Node.js with TypeScript
- **Web Framework:** Express.js
- **Slack SDK:** @slack/bolt
- **PDF Parsing:** pdf-parse
- **LLM/Embeddings:** Ollama (llama3, nomic-embed-text)
- **Vector Storage:** In-memory with JSON persistence

## License

MIT License
