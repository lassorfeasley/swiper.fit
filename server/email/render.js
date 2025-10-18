import { render } from '@react-email/render';
import React from 'react';
import { EmailTemplates } from './templates/index.js';

export function renderEmail(event, data, context = {}) {
  try {
    console.log(`[renderEmail] Rendering email for event: ${event}`);
    
    const entry = EmailTemplates[event];
    if (!entry) {
      console.error(`[renderEmail] No template found for event: ${event}`);
      return null;
    }
    
    const props = typeof entry.mapData === 'function' ? entry.mapData(data) : (data || {});
    console.log(`[renderEmail] Template props:`, props);
    
    const html = render(React.createElement(entry.component, props), { pretty: true });
    const subject = typeof entry.subject === 'function' ? entry.subject(props, context) : 'Notification';
    
    console.log(`[renderEmail] Email rendered successfully: ${event}`, { 
      subjectLength: subject?.length, 
      htmlLength: html?.length 
    });
    
    return { subject, html };
  } catch (error) {
    console.error(`[renderEmail] Failed to render email for event: ${event}`, error);
    return null;
  }
}


