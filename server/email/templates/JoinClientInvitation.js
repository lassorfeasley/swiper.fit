import React from 'react';
import DefaultLayout from '../layouts/DefaultLayout.js';

export function subject({ inviterName }) {
  return `Join Swiper - ${inviterName} wants you to be their client`;
}

export default function JoinClientInvitation({ inviterName = 'John Smith', email = '' }) {
  const titleStyle = { color: '#000000', fontSize: 24, fontWeight: 700, fontFamily: 'Arial, sans-serif', margin: '0 0 16px 0' };
  const bodyStyle = { color: '#000000', fontSize: 14, fontWeight: 400, fontFamily: 'Arial, sans-serif', lineHeight: 1.6, margin: '0 0 16px 0' };
  const ctaStyle = { color: '#166534', fontSize: 14, fontWeight: 700, fontFamily: 'Arial, sans-serif', textDecoration: 'none' };
  const logoWrap = { marginBottom: 16 };
  const iconStyle = { width: 48, height: 40, marginBottom: 16 };

  const signupUrl = `https://www.swiper.fit/create-account?email=${encodeURIComponent(email)}&fromInvite=client`;

  return React.createElement(
    DefaultLayout,
    {
      title: '',
      preheader: `${inviterName} wants you to be their client on Swiper`,
      hideTitle: true,
    },
    // Green icon/logo
    React.createElement('div', { style: iconStyle },
      React.createElement('svg', { width: 48, height: 40, viewBox: '0 0 50 39', fill: 'none', xmlns: 'http://www.w3.org/2000/svg' },
        React.createElement('path', { d: 'M50 6.04677L17.2911 38.5927L0 22.8205L5.6506 16.5208L17.0402 26.9098L44.0862 0L50 6.04677Z', fill: '#22C55E' })
      )
    ),
    // Heading
    React.createElement('div', { style: titleStyle }, `${inviterName} wants you to be their client on Swiper`),
    // Body text
    React.createElement('div', { style: bodyStyle },
      'Swiper fit is the effortless way to log workouts and track progress at the gym.',
      React.createElement('br'),
      React.createElement('br'),
      'Create an account today to respond to John\'s request.'
    ),
    // CTA link
    React.createElement('div', { style: { marginTop: 16 } },
      React.createElement('a', { href: signupUrl, style: ctaStyle }, 'Create account →')
    )
  );
}
