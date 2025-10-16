import { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/atoms/button';

export default function EmailTest() {
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState('');
  const defaultTo = 'feasley@lassor.com';

  const sendAccountCreated = async () => {
    try {
      setSending(true);
      setResult('');
      const isLocal = typeof window !== 'undefined' && window.location.origin.includes('localhost');
      const base = isLocal ? 'https://www.swiper.fit' : '';
      const resp = await fetch(`${base}/api/email/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: defaultTo,
          event: 'account.created',
          data: { user_name: 'Lassor', email: defaultTo },
          context: { env: (import.meta?.env?.MODE) || 'production' },
        }),
      });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json?.error || 'Failed');
      setResult(`Sent ✔ id=${json?.id || 'n/a'}`);
    } catch (e) {
      setResult(`Error: ${e.message}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <AppLayout>
      <div className="p-4">
        <div className="text-lg font-medium mb-4">Email Test</div>
        <div className="mb-2 text-sm text-neutral-600">Send an Account Created email to {defaultTo}</div>
        <Button onClick={sendAccountCreated} disabled={sending}>
          {sending ? 'Sending…' : 'Send Account Created'}
        </Button>
        {result && (
          <div className="mt-3 text-sm">
            {result}
          </div>
        )}
      </div>
    </AppLayout>
  );
}


