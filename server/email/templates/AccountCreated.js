import React from 'react';
import DefaultLayout from '../layouts/DefaultLayout.js';

export function subject() {
  return 'You created an account on Swiper';
}

export default function AccountCreated({ name }) {
  const baseUrl = process.env.EMAIL_WEB_BASE_URL || 'https://www.swiper.fit';
  const redirectPath = encodeURIComponent('/routines');
  const routinesUrl = `${baseUrl}/login?redirect=${redirectPath}`;

  const titleStyle = { color: '#000000', fontSize: 24, fontWeight: 700, fontFamily: 'Arial, sans-serif', margin: '0 0 8px 0' };
  const bodyStyle = { color: '#000000', fontSize: 14, fontWeight: 400, fontFamily: 'Arial, sans-serif', lineHeight: 1.6, margin: 0 };
  const ctaStyle  = { color: '#065F46', fontSize: 14, fontWeight: 700, fontFamily: 'Arial, sans-serif', textDecoration: 'none' };
  const logoWrap  = { marginBottom: 16 };

  return React.createElement(
    DefaultLayout,
    {
      title: '',
      preheader: 'It\u2019s time to create an exercise routine and start a workout.',
      hideTitle: true,
    },
    // Logo checkmark
    React.createElement('div', { style: logoWrap },
      React.createElement('svg', { width: 50, height: 39, viewBox: '0 0 50 39', fill: 'none', xmlns: 'http://www.w3.org/2000/svg' },
        React.createElement('path', { d: 'M50 6.04677L17.2911 38.5927L0 22.8205L5.6506 16.5208L17.0402 26.9098L44.0862 0L50 6.04677Z', fill: '#22C55E' })
      )
    ),
    // Heading
    React.createElement('div', { style: titleStyle }, 'You created a Swiper account.'),
    // Body
    React.createElement('div', { style: { ...bodyStyle, marginTop: 4 } },
      'Swiper is the effortless way to log workouts at the gym.',
      React.createElement('br'),
      React.createElement('br'),
      'It\u2019s time to create an exercise routine and start a workout.'
    ),
    // CTA link (text style per design)
    React.createElement('div', { style: { marginTop: 16 } },
      React.createElement('a', { href: routinesUrl, style: ctaStyle }, 'Create a routine \u2192')
    )
  );
}


