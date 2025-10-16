// Client helper to post email events to server endpoint
export function postEmailEvent(event, to, data = {}, contextExtras = {}) {
  try {
    const isLocal = typeof window !== 'undefined' && window.location.origin.includes('localhost');
    const base = isLocal ? 'https://www.swiper.fit' : '';
    const context = {
      env: (import.meta?.env?.MODE) || 'production',
      source: 'client',
      ...contextExtras,
    };
    const url = `${base}/api/email/notify`;
    const payload = JSON.stringify({ event, to, data, context });
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      try {
        const blob = new Blob([payload], { type: 'application/json' });
        const ok = navigator.sendBeacon(url, blob);
        if (ok) return;
      } catch (_) {}
    }
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
    }).catch(() => {});
  } catch (_) {}
}


