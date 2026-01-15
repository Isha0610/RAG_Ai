import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { config, validateConfig } from './config';
import apiRoutes from './routes/api.routes';
import { startSlackBot } from './slack/bot';

async function main() {
  // Validate configuration
  validateConfig();

  // Ensure uploads directory exists
  if (!fs.existsSync(config.uploads.directory)) {
    fs.mkdirSync(config.uploads.directory, { recursive: true });
  }

  // Create Express app
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Serve static files from public folder
  app.use(express.static(path.join(process.cwd(), 'public')));

  // API Routes
  app.use('/api', apiRoutes);

  // Start Express server
  app.listen(config.port, () => {
    console.log(`RAG API server running on http://localhost:${config.port}`);
  });

  // Start Slack bot if credentials are configured
  if (config.slack.botToken && config.slack.appToken) {
    try {
      await startSlackBot();
      console.log('Slack bot started successfully');
    } catch (error) {
      console.error('Failed to start Slack bot:', error);
      console.log('API server will continue running without Slack integration');
    }
  } else {
    console.log('Slack credentials not configured. Running API-only mode.');
    console.log('Set SLACK_BOT_TOKEN, SLACK_SIGNING_SECRET, and SLACK_APP_TOKEN to enable Slack bot.');
  }
}

main().catch(console.error);
