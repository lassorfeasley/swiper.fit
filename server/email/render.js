import { render } from '@react-email/render';
import React from 'react';
import { EmailTemplates } from './templates/index.js';

export function renderEmail(event, data, context = {}) {
  const entry = EmailTemplates[event];
  if (!entry) return null;
  const props = typeof entry.mapData === 'function' ? entry.mapData(data) : (data || {});
  const html = render(React.createElement(entry.component, props), { pretty: true });
  const subject = typeof entry.subject === 'function' ? entry.subject(props, context) : 'Notification';
  return { subject, html };
}


