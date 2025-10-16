import { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/atoms/button';
import { postEmailEvent } from '@/lib/emailEvents';

export default function EmailTest() {
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState('');
  const defaultTo = 'feasley@lassor.com';

  const sendAccountCreated = async () => {
    try {
      setSending(true);
      setResult('');
      // Try beacon; it won't expose response, so optimistically show sent state
      postEmailEvent('account.created', defaultTo, { user_name: 'Lassor', email: defaultTo });
      setResult('Requested send ✔');
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


