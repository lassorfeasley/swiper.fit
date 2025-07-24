import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { clearAuthTokens, forceAuthRefresh } from '@/lib/utils';

const AuthDebug = () => {
  const { session, user, clearInvalidTokens } = useAuth();

  const handleClearTokens = async () => {
    await clearInvalidTokens();
    alert('Tokens cleared. Please refresh the page.');
  };

  const handleForceRefresh = () => {
    forceAuthRefresh();
  };

  const handleManualClear = () => {
    clearAuthTokens();
    alert('Manual token clear completed. Please refresh the page.');
  };

  return (
    <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50 max-w-sm">
      <h3 className="font-bold mb-2">Auth Debug Panel</h3>
      <div className="text-xs mb-2">
        <p><strong>Session:</strong> {session ? 'Active' : 'None'}</p>
        <p><strong>User:</strong> {user ? user.email : 'None'}</p>
      </div>
      <div className="space-y-1">
        <button
          onClick={handleClearTokens}
          className="block w-full bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
        >
          Clear Tokens (Auth)
        </button>
        <button
          onClick={handleManualClear}
          className="block w-full bg-orange-500 text-white px-2 py-1 rounded text-xs hover:bg-orange-600"
        >
          Clear Tokens (Manual)
        </button>
        <button
          onClick={handleForceRefresh}
          className="block w-full bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600"
        >
          Force Refresh
        </button>
      </div>
    </div>
  );
};

export default AuthDebug; 