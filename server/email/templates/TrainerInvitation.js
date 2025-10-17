import React from 'react';
import DefaultLayout from '../layouts/DefaultLayout.js';

export function subject({ inviterName }) {
  return `Become ${inviterName}'s trainer on Swiper`;
}

export default function TrainerInvitation({ inviterName = 'John Smith' }) {
  const titleStyle = { color: '#000000', fontSize: 24, fontWeight: 700, fontFamily: 'Arial, sans-serif', margin: '0 0 8px 0' };
  const bodyStyle = { color: '#000000', fontSize: 14, fontWeight: 400, fontFamily: 'Arial, sans-serif', lineHeight: 1.6, margin: 0 };
  const ctaStyle = { color: '#166534', fontSize: 14, fontWeight: 700, fontFamily: 'Arial, sans-serif', textDecoration: 'none' };
  const logoWrap = { marginBottom: 16 };

  return React.createElement(
    DefaultLayout,
    {
      title: '',
      preheader: `${inviterName} wants you to be their trainer on Swiper`,
      hideTitle: true,
    },
    // Logo checkmark
    React.createElement('div', { style: logoWrap },
      React.createElement('svg', { width: 50, height: 39, viewBox: '0 0 50 39', fill: 'none', xmlns: 'http://www.w3.org/2000/svg' },
        React.createElement('path', { d: 'M50 6.04677L17.2911 38.5927L0 22.8205L5.6506 16.5208L17.0402 26.9098L44.0862 0L50 6.04677Z', fill: '#22C55E' })
      )
    ),
    // Heading
    React.createElement('div', { style: titleStyle }, `${inviterName} wants you to be his trainer on Swiper`),
    // Body
    React.createElement('div', { style: { ...bodyStyle, marginTop: 4 } },
      'Login to accept or decline John\'s request.'
    ),
    // CTA link
    React.createElement('div', { style: { marginTop: 16 } },
      React.createElement('a', { href: 'https://www.swiper.fit/trainers', style: ctaStyle }, 'Reply to request →')
    )
  );
}
