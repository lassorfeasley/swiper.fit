export function postSlackEvent(event, data, contextExtras = {}) {
  try {
    const isLocal = typeof window !== 'undefined' && window.location.origin.includes('localhost');
    const base = isLocal ? 'https://www.swiper.fit' : '';
    const context = {
      env: (typeof import !== 'undefined' && import.meta && import.meta.env && import.meta.env.MODE) || 'production',
      source: 'client',
      ...contextExtras,
    };
    fetch(`${base}/api/slack/notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, context, data }),
      keepalive: true,
    }).catch(() => {});
  } catch (_) {}
}


