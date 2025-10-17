import React from 'react';
import DefaultLayout from '../layouts/DefaultLayout.js';

export function subject({ inviterName }) {
  return `Join Swiper - ${inviterName} wants you to be their client`;
}

export default function JoinClientInvitation({ inviterName = 'John Smith', email = '' }) {
  const titleStyle = { color: '#000000', fontSize: 24, fontWeight: 700, fontFamily: 'Arial, sans-serif', margin: '0 0 8px 0' };
  const bodyStyle = { color: '#000000', fontSize: 14, fontWeight: 400, fontFamily: 'Arial, sans-serif', lineHeight: 1.6, margin: 0 };
  const ctaStyle = { color: '#166534', fontSize: 14, fontWeight: 700, fontFamily: 'Arial, sans-serif', textDecoration: 'none' };
  const logoWrap = { marginBottom: 16 };
  const buttonStyle = { 
    display: 'inline-block', 
    backgroundColor: '#059669', 
    color: 'white', 
    padding: '12px 24px', 
    borderRadius: '8px', 
    textDecoration: 'none', 
    fontWeight: 500, 
    marginTop: 16 
  };

  const signupUrl = `https://www.swiper.fit/create-account?email=${encodeURIComponent(email)}&fromInvite=client`;

  return React.createElement(
    DefaultLayout,
    {
      title: '',
      preheader: `${inviterName} has invited you to be their client on Swiper`,
      hideTitle: true,
    },
    // Logo checkmark
    React.createElement('div', { style: logoWrap },
      React.createElement('svg', { width: 50, height: 39, viewBox: '0 0 50 39', fill: 'none', xmlns: 'http://www.w3.org/2000/svg' },
        React.createElement('path', { d: 'M50 6.04677L17.2911 38.5927L0 22.8205L5.6506 16.5208L17.0402 26.9098L44.0862 0L50 6.04677Z', fill: '#22C55E' })
      )
    ),
    // Heading
    React.createElement('div', { style: titleStyle }, `${inviterName} wants you to be their client on Swiper`),
    // Body
    React.createElement('div', { style: { ...bodyStyle, marginTop: 4 } },
      `${inviterName} has invited you to be their client on Swiper. As their client, they'll be able to help you with your fitness journey.`
    ),
    React.createElement('div', { style: { ...bodyStyle, marginTop: 8 } },
      'Create your Swiper account to accept this invitation and start training.'
    ),
    // CTA button
    React.createElement('a', { href: signupUrl, style: buttonStyle }, 'Create Account & Accept'),
    // Expiration note
    React.createElement('div', { style: { ...bodyStyle, marginTop: 16, fontSize: 12, color: '#6b7280' } },
      'This invitation will expire in 14 days.'
    )
  );
}
