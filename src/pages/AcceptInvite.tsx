import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/shadcn/button';
import LoggedOutNav from '@/features/auth/components/LoggedOutNav';
import DeckWrapper from '@/components/shared/cards/wrappers/DeckWrapper';
import CardWrapper from '@/components/shared/cards/wrappers/CardWrapper';

type ViewState = 'idle' | 'processing' | 'success' | 'error' | 'missing';

export default function AcceptInvite() {
  const location = useLocation();
  const navigate = useNavigate();
  const { session } = useAuth();
  const [viewState, setViewState] = useState<ViewState>('idle');
  const [message, setMessage] = useState('');
  const [successDetails, setSuccessDetails] = useState({ title: 'Invitation accepted', body: 'You can manage this account immediately.' });
  const redirectRef = useRef(false);

  const token = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('token') || '';
  }, [location.search]);

  const acceptInvitation = useCallback(async (inviteToken: string) => {
    try {
      setViewState('processing');
      setMessage('Confirming invitation...');
      const { error } = await supabase.rpc('accept_invitation', {
        invite_token: inviteToken,
      });

      if (error) {
        throw error;
      }

      setViewState('success');
      setMessage('');
      setSuccessDetails({
        title: 'All set!',
        body: 'You now share access. Head to your dashboard to get started.',
      });
    } catch (error: any) {
      console.error('[AcceptInvite] Failed to accept invitation', error);
      setViewState('error');
      setMessage(error?.message || 'Failed to accept invitation. Please try again.');
    }
  }, []);

  useEffect(() => {
    if (!token) {
      setViewState('missing');
      setMessage('Invitation token missing. Please open the invite link from your email again.');
      return;
    }

    if (!session) {
      if (!redirectRef.current) {
        redirectRef.current = true;
        const params = new URLSearchParams();
        params.set('inviteToken', token);
        navigate(`/login?${params.toString()}`, { replace: true });
      }
      return;
    }

    acceptInvitation(token);
  }, [acceptInvitation, navigate, session, token]);

  const handleRetry = () => {
    if (token) {
      acceptInvitation(token);
    }
  };

  const goToDashboard = () => {
    navigate('/train');
  };

  return (
    <div className="w-full inline-flex flex-col justify-start items-start min-h-screen bg-stone-100 pt-20">
      {!session && <LoggedOutNav showAuthButtons />}

      <div className="self-stretch flex flex-col justify-center items-center flex-1 px-4 py-10">
        <DeckWrapper gap={0} className="flex-1 max-w-xl w-full">
          <CardWrapper>
            <div className="self-stretch p-6 bg-white rounded-lg border border-neutral-300 flex flex-col gap-4">
              <div className="text-2xl font-semibold text-neutral-900">Accept invitation</div>

              {viewState === 'processing' && (
                <div className="text-neutral-600 text-sm">
                  {message || 'Processing your invitation...'}
                </div>
              )}

              {viewState === 'missing' && (
                <>
                  <div className="text-red-600 text-sm">{message}</div>
                  <Button variant="outline" onClick={() => navigate('/')}>
                    Go home
                  </Button>
                </>
              )}

              {viewState === 'error' && (
                <>
                  <div className="text-red-600 text-sm">{message}</div>
                  <div className="flex flex-col gap-3">
                    <Button variant="affirmative" onClick={handleRetry}>
                      Try again
                    </Button>
                    <Button variant="ghost" onClick={() => navigate('/account')}>
                      Go to Account
                    </Button>
                  </div>
                </>
              )}

              {viewState === 'success' && (
                <>
                  <div className="text-neutral-900 text-lg font-medium">{successDetails.title}</div>
                  <div className="text-neutral-600 text-sm">{successDetails.body}</div>
                  <Button variant="affirmative" onClick={goToDashboard}>
                    Go to dashboard
                  </Button>
                </>
              )}

              {viewState === 'idle' && (
                <div className="text-neutral-600 text-sm">
                  {token ? 'Preparing your invitation...' : 'Missing invitation token.'}
                </div>
              )}
            </div>
          </CardWrapper>
        </DeckWrapper>
      </div>
    </div>
  );
}

