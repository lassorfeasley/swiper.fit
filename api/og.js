export const config = { runtime: 'edge' };

import { ImageResponse } from '@vercel/og';

const font700 = 'https://cdn.jsdelivr.net/npm/@fontsource/be-vietnam-pro@5.2.6/files/be-vietnam-pro-latin-700-normal.woff2';
const font400 = 'https://cdn.jsdelivr.net/npm/@fontsource/be-vietnam-pro@5.2.6/files/be-vietnam-pro-latin-400-normal.woff2';
const font300 = 'https://cdn.jsdelivr.net/npm/@fontsource/be-vietnam-pro@5.2.6/files/be-vietnam-pro-latin-300-normal.woff2';

function toTitle(s, max = 72) {
  if (!s) return '';
  const clean = String(s).replace(/\s+/g, ' ').trim();
  return clean.length > max ? clean.slice(0, max - 1) + '…' : clean;
}

export default async function handler(req) {
  const { searchParams } = new URL(req.url);

  const category = (searchParams.get('category') || 'Chest and triceps').trim();
  const date = (searchParams.get('date') || 'May 10, 2025').trim();
  const title = toTitle(searchParams.get('title') || 'Workout title');
  const dur = (searchParams.get('duration') || '1h 20m').toUpperCase();
  const exercises = searchParams.get('exercises') || '20';
  const sets = searchParams.get('sets') || '60';

  const [w700, w400, w300] = await Promise.all([
    fetch(font700).then(r => r.arrayBuffer()).catch(() => null),
    fetch(font400).then(r => r.arrayBuffer()).catch(() => null),
    fetch(font300).then(r => r.arrayBuffer()).catch(() => null),
  ]);

  return new ImageResponse(
    (
      <div style={{ width: 1200, height: 630, position: 'relative', background: '#FFFFFF', overflow: 'hidden' }}>
        <div style={{ width: 1080, height: 510, left: 60, top: 60, position: 'absolute', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ color: '#737373', fontFamily: 'Be Vietnam Pro', fontWeight: 700, fontSize: 30, lineHeight: '30px', letterSpacing: 1.2, textTransform: 'uppercase' }}>{category}</div>
            <div style={{ color: '#737373', fontFamily: 'Be Vietnam Pro', fontWeight: 700, fontSize: 30, lineHeight: '30px', letterSpacing: 1.2, textTransform: 'uppercase' }}>{date.toUpperCase()}</div>
          </div>

          <div style={{ color: '#171717', fontFamily: 'Be Vietnam Pro', fontWeight: 700, fontSize: 80, lineHeight: '90px', maxWidth: 1080 }}>{title}</div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              {[{ label: dur }, { label: `${exercises} EXERCISES` }, { label: `${sets} SETS` }].map((pill, i) => (
                <div key={i} style={{ padding: 20, background: '#FAFAFA', borderRadius: 10, border: '1px solid #D4D4D4', display: 'flex', alignItems: 'center', height: 68 }}>
                  <div style={{ color: '#404040', fontFamily: 'Be Vietnam Pro', fontWeight: 300, fontSize: 30, lineHeight: '30px', letterSpacing: 1.2 }}>{pill.label}</div>
                </div>
              ))}
            </div>
            <svg width="320" height="251" viewBox="0 0 320 251" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M320 39.8487L110.663 251L0 148.673L36.1637 107.801L109.058 175.204L282.151 0.6185L320 39.8487Z" fill="#22C55E"/>
            </svg>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        w700 && { name: 'Be Vietnam Pro', data: w700, weight: 700, style: 'normal' },
        w400 && { name: 'Be Vietnam Pro', data: w400, weight: 400, style: 'normal' },
        w300 && { name: 'Be Vietnam Pro', data: w300, weight: 300, style: 'normal' },
      ].filter(Boolean),
    }
  );
}


