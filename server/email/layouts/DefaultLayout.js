import React from 'react';
import { Html, Head, Preview, Body, Container, Section } from '@react-email/components';

export default function DefaultLayout({ title = 'Notification', preheader = '', children, footer }) {
  return React.createElement(
    Html,
    null,
    React.createElement(Head, null),
    React.createElement(Preview, null, preheader),
    React.createElement(
      Body,
      { style: { backgroundColor: '#f8fafc', margin: 0, padding: 0, fontFamily: 'system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,sans-serif', color: '#0f172a' } },
      React.createElement(
        Container,
        { style: { maxWidth: 560, margin: '0 auto', padding: 24 } },
        React.createElement(
          Section,
          { style: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20 } },
          React.createElement('h1', { style: { fontSize: 18, margin: '0 0 8px 0', color: '#111827' } }, title),
          children,
          footer ? React.createElement('div', null, footer) : null
        )
      )
    )
  );
}


