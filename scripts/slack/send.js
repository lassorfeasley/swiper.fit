#!/usr/bin/env node
// CLI to send a Slack message using the same server library
import { notifySlack } from '../../server/slack/index.js';

const args = process.argv.slice(2);

async function main() {
  const text = args.join(' ');
  if (!text) {
    console.error('Usage: npm run notify:slack -- "message"');
    process.exit(1);
  }
  await notifySlack('raw', { env: process.env.NODE_ENV || 'local' }, { text });
  console.log('Slack: sent');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


