import React from 'react';
import DefaultLayout from '../layouts/DefaultLayout.js';

export function subject() {
  return 'You created an account on Swiper';
}

export default function AccountCreated({ name }) {
  const baseUrl = process.env.EMAIL_WEB_BASE_URL || 'https://www.swiper.fit';
  const routinesUrl = `${baseUrl}/routines`;

  const buttonStyle = {
    display: 'inline-block',
    backgroundColor: '#111827',
    color: '#ffffff',
    textDecoration: 'none',
    padding: '12px 16px',
    borderRadius: '8px',
    fontSize: 14,
    lineHeight: 1.4,
  };

  const linkStyle = {
    color: '#111827',
    textDecoration: 'underline',
  };

  return React.createElement(
    DefaultLayout,
    {
      title: 'Welcome to Swiper',
      preheader: 'It\u2019s time to create an exercise routine and start a workout.',
    },
    React.createElement('p', { style: { fontSize: 14, lineHeight: 1.6 } }, `Hi ${name || 'there'},`),
    React.createElement(
      'p',
      { style: { fontSize: 14, lineHeight: 1.6 } },
      'Your account is ready. Create a routine to get started, then jump into your first workout.'
    ),
    React.createElement(
      'p',
      { style: { margin: '16px 0 8px' } },
      React.createElement('a', { href: routinesUrl, style: buttonStyle }, 'Create a routine\u2192')
    ),
    React.createElement(
      'p',
      { style: { fontSize: 12, lineHeight: 1.6, color: '#6b7280', marginTop: 16 } },
      'Having trouble with the button? ',
      React.createElement('a', { href: routinesUrl, style: linkStyle }, routinesUrl)
    )
  );
}


