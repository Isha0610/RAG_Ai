import { App, LogLevel } from '@slack/bolt';
import { config } from '../config';

let app: App | null = null;

const API_BASE_URL = `http://localhost:${config.port}`;

interface QueryResponse {
  success: boolean;
  answer?: string;
  sources?: Array<{
    documentName: string;
    chunkIndex: number;
    relevanceScore: number;
  }>;
  error?: string;
}

async function queryApi(question: string): Promise<QueryResponse> {
  const response = await fetch(`${API_BASE_URL}/api/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ question }),
  });

  return response.json() as Promise<QueryResponse>;
}

function formatResponse(result: QueryResponse): string {
  if (result.success && result.answer) {
    let responseText = result.answer;

    // Add sources if available
    if (result.sources && result.sources.length > 0) {
      const uniqueSources = [...new Set(result.sources.map(s => s.documentName))];
      responseText += `\n\n:page_facing_up: *Sources:* ${uniqueSources.join(', ')}`;
    }

    return responseText;
  }

  return result.error || 'Sorry, I encountered an error while processing your question.';
}

export async function startSlackBot(): Promise<void> {
  app = new App({
    token: config.slack.botToken,
    signingSecret: config.slack.signingSecret,
    socketMode: true,
    appToken: config.slack.appToken,
    logLevel: LogLevel.INFO,
  });

  // Listen for app mentions
  app.event('app_mention', async ({ event, client }) => {
    try {
      // Extract the question from the mention (remove the bot mention)
      const question = event.text.replace(/<@[A-Z0-9]+>/gi, '').trim();

      if (!question) {
        await client.chat.postMessage({
          channel: event.channel,
          thread_ts: event.ts,
          text: "Hi! Please ask me a question about your policies and I'll help you find the answer.",
        });
        return;
      }

      // Send a "thinking" message in the thread
      const thinkingMessage = await client.chat.postMessage({
        channel: event.channel,
        thread_ts: event.ts,
        text: ':mag: Searching through documents...',
      });

      // Send POST request to the API endpoint
      const result = await queryApi(question);

      // Format and send the response
      const responseText = formatResponse(result);

      // Update the thinking message with the actual response
      await client.chat.update({
        channel: event.channel,
        ts: thinkingMessage.ts!,
        text: responseText,
      });
    } catch (error) {
      console.error('Error handling app mention:', error);

      // Reply with error in thread
      await client.chat.postMessage({
        channel: event.channel,
        thread_ts: event.ts,
        text: ':warning: Sorry, something went wrong while processing your question. Please try again.',
      });
    }
  });

  // Listen for direct messages
  app.event('message', async ({ event, client }) => {
    // Only handle DMs (not channel messages or bot messages)
    if (
      event.channel_type !== 'im' ||
      'bot_id' in event ||
      'subtype' in event
    ) {
      return;
    }

    try {
      const messageEvent = event as { text?: string; channel: string; ts: string };
      const question = messageEvent.text?.trim();

      if (!question) {
        return;
      }

      // Send a "thinking" message
      const thinkingMessage = await client.chat.postMessage({
        channel: messageEvent.channel,
        text: ':mag: Searching through documents...',
      });

      // Send POST request to the API endpoint
      const result = await queryApi(question);

      // Format and send the response
      const responseText = formatResponse(result);

      // Update the thinking message
      await client.chat.update({
        channel: messageEvent.channel,
        ts: thinkingMessage.ts!,
        text: responseText,
      });
    } catch (error) {
      console.error('Error handling DM:', error);
    }
  });

  // Start the app
  await app.start();
}

export async function stopSlackBot(): Promise<void> {
  if (app) {
    await app.stop();
    app = null;
  }
}
