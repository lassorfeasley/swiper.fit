export function postSlackEvent(event, data, contextExtras = {}) {
  try {
    const isLocal = typeof window !== 'undefined' && window.location.origin.includes('localhost');
    const base = isLocal ? 'https://www.swiper.fit' : '';
    const context = {
      env: (import.meta?.env?.MODE) || 'production',
      source: 'client',
      ...contextExtras,
    };
    if (import.meta?.env?.MODE === 'development') {
      // Minimal console signal in dev
      // eslint-disable-next-line no-console
      console.debug('[Slack] post', { event, data });
    }
    const url = `${base}/api/slack/notify`;
    const payload = JSON.stringify({ event, context, data });
    // Prefer Beacon to survive page navigations
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      try {
        const blob = new Blob([payload], { type: 'application/json' });
        const ok = navigator.sendBeacon(url, blob);
        if (ok) return;
      } catch (_) {}
    }
    // Fallback to keepalive fetch
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
    }).catch(() => {});
  } catch (_) {}
}


