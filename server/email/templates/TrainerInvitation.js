import React from 'react';
import { Html, Head, Body, Container, Section } from '@react-email/components';

export function subject({ inviterName }) {
  return `Become ${inviterName}'s trainer on Swiper`;
}

export default function TrainerInvitation({ inviterName = 'John Smith' }) {
  return React.createElement(
    Html,
    null,
    React.createElement(Head, null),
    React.createElement(
      Body,
      { style: { backgroundColor: '#ffffff', margin: 0, padding: 0, fontFamily: 'Arial, sans-serif' } },
      React.createElement(
        Container,
        { style: { maxWidth: 288, margin: '0 auto', padding: 20 } },
        React.createElement(
          'div',
          { style: { width: 288, padding: 20, backgroundColor: '#ffffff', display: 'inline-flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: 10 } },
          React.createElement(
            'div',
            { style: { alignSelf: 'stretch', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: 16 } },
            React.createElement(
              'div',
              { style: { display: 'flex', alignItems: 'center', justifyContent: 'center' } },
              React.createElement('svg', {
                width: 50,
                height: 39,
                viewBox: '0 0 50 39',
                fill: 'none',
                xmlns: 'http://www.w3.org/2000/svg'
              },
                React.createElement('path', {
                  d: 'M50 6.04677L17.2911 38.5927L0 22.8205L5.6506 16.5208L17.0402 26.9098L44.0862 0L50 6.04677Z',
                  fill: '#22C55E'
                })
              )
            ),
            React.createElement(
              'div',
              { style: { alignSelf: 'stretch', justifyContent: 'flex-start', color: '#000000', fontSize: 24, fontWeight: 'bold', fontFamily: 'Arial', lineHeight: '1.2' } },
              `${inviterName} wants you to be his trainer on Swiper`
            ),
            React.createElement(
              'div',
              { style: { alignSelf: 'stretch', justifyContent: 'flex-start', color: '#000000', fontSize: 14, fontWeight: 'normal', fontFamily: 'Arial', lineHeight: '1.4' } },
              'Login to accept or decline John\'s request.'
            ),
            React.createElement(
              'div',
              { style: { alignSelf: 'stretch', justifyContent: 'flex-start', color: '#166534', fontSize: 14, fontWeight: 'bold', fontFamily: 'Arial', lineHeight: '1.4' } },
              'Reply to request →'
            )
          )
        )
      )
    )
  );
}
