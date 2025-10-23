import { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/shadcn/button';
import { postEmailEvent } from '@/lib/emailEvents';

export default function EmailTest() {
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState('');
  const defaultTo = 'feasley@lassor.com';

  const sendEmail = async (event, data = {}) => {
    try {
      setSending(true);
      setResult('');
      postEmailEvent(event, defaultTo, data);
      setResult(`Requested send ${event} ✔`);
    } catch (e) {
      setResult(`Error: ${e.message}`);
    } finally {
      setSending(false);
    }
  };

  const sendAccountCreated = () => sendEmail('account.created', { user_name: 'Lassor', email: defaultTo });
  const sendTrainerInvitation = () => sendEmail('trainer.invitation', { inviter_name: 'John Smith' });
  const sendClientInvitation = () => sendEmail('client.invitation', { inviter_name: 'John Smith' });
  const sendJoinTrainerInvitation = () => sendEmail('join.trainer-invitation', { inviter_name: 'John Smith', email: defaultTo });
  const sendJoinClientInvitation = () => sendEmail('join.client-invitation', { inviter_name: 'John Smith', email: defaultTo });

  return (
    <AppLayout>
      <div className="p-4">
        <div className="text-lg font-medium mb-4">Email Test</div>
        <div className="mb-4 text-sm text-neutral-600">Send test emails to {defaultTo}</div>
        
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Button onClick={sendAccountCreated} disabled={sending}>
              {sending ? 'Sending…' : 'Send Account Created'}
            </Button>
            <span className="text-sm text-neutral-500">Welcome email for new users</span>
          </div>
          
          <div className="flex items-center gap-3">
            <Button onClick={sendTrainerInvitation} disabled={sending}>
              {sending ? 'Sending…' : 'Send Trainer Invitation'}
            </Button>
            <span className="text-sm text-neutral-500">Email when someone invites you as their trainer</span>
          </div>
          
          <div className="flex items-center gap-3">
            <Button onClick={sendClientInvitation} disabled={sending}>
              {sending ? 'Sending…' : 'Send Client Invitation'}
            </Button>
            <span className="text-sm text-neutral-500">Email when someone invites you as their client</span>
          </div>
          
          <div className="flex items-center gap-3">
            <Button onClick={sendJoinTrainerInvitation} disabled={sending}>
              {sending ? 'Sending…' : 'Send Join Trainer Invitation'}
            </Button>
            <span className="text-sm text-neutral-500">Email when non-member is invited to be a trainer</span>
          </div>
          
          <div className="flex items-center gap-3">
            <Button onClick={sendJoinClientInvitation} disabled={sending}>
              {sending ? 'Sending…' : 'Send Join Client Invitation'}
            </Button>
            <span className="text-sm text-neutral-500">Email when non-member is invited to be a client</span>
          </div>
        </div>
        
        {result && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded text-sm text-green-800">
            {result}
          </div>
        )}
        
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
          <h3 className="font-medium text-blue-900 mb-2">Email Testing URL</h3>
          <p className="text-sm text-blue-700 mb-2">
            Use this page to test all email templates. Emails will be sent to the configured email address.
          </p>
          <p className="text-sm text-blue-600">
            <strong>URL:</strong> <code>/email-test</code>
          </p>
        </div>
      </div>
    </AppLayout>
  );
}


