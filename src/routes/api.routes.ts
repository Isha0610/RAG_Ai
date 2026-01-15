import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { config } from '../config';
import { processAndStoreDocument, queryKnowledgeBase, listDocuments } from '../services/rag.service';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.uploads.directory);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: config.uploads.maxFileSize,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
});

// POST /api/upload - Upload and process a PDF
router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, error: 'No file uploaded' });
      return;
    }

    const result = await processAndStoreDocument(
      req.file.path,
      req.file.originalname
    );

    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    });
  }
});

// POST /api/query - Query the knowledge base
router.post('/query', async (req: Request, res: Response) => {
  try {
    const { question } = req.body;

    if (!question || typeof question !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Question is required and must be a string',
      });
      return;
    }

    const result = await queryKnowledgeBase(question);

    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Query failed',
    });
  }
});

// GET /api/documents - List all uploaded documents
router.get('/documents', async (req: Request, res: Response) => {
  try {
    const documents = await listDocuments();
    res.json({ success: true, documents });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list documents',
    });
  }
});

// Health check endpoint
router.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
