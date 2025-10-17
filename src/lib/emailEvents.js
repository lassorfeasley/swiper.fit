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
    
    // Return a Promise that resolves when the email is sent
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
    }).then(response => {
      if (!response.ok) {
        throw new Error(`Email API error: ${response.status} ${response.statusText}`);
      }
      return response.json();
    });
  } catch (error) {
    console.error('postEmailEvent error:', error);
    throw error;
  }
}


