import { sendSlackMessage } from './client.js';
import { formatEvent } from './formatters.js';

export async function notifySlack(eventKey, context = {}, data = {}) {
  const payload = formatEvent(eventKey, context, data);
  if (context && context.channel) {
    payload.channel = context.channel;
  }
  return sendSlackMessage(payload);
}


