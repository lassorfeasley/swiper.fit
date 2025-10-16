import React from 'react';
import DefaultLayout from '../layouts/DefaultLayout.js';

export function subject({ name }) {
  return `Welcome to Swiper, ${name || 'there'}!`;
}

export default function AccountCreated({ name }) {
  return React.createElement(
    DefaultLayout,
    { title: 'Welcome to Swiper', preheader: 'Your account is ready' },
    React.createElement('p', { style: { fontSize: 14, lineHeight: 1.6 } }, `Hi ${name || 'there'},`),
    React.createElement(
      'p',
      { style: { fontSize: 14, lineHeight: 1.6 } },
      "Thanks for joining Swiper. Let’s get your first workout set up."
    )
  );
}


