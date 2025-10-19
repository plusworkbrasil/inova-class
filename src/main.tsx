import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { supabase } from '@/integrations/supabase/client'

// Monitor de sessão - detecta tokens expirados
supabase.auth.onAuthStateChange((event, session) => {
  console.log('🔐 [Auth] Event:', event, 'Session:', session?.user?.email || 'none');
  
  if (event === 'TOKEN_REFRESHED') {
    console.log('✅ [Auth] Token refreshed successfully');
  }
  
  if (event === 'SIGNED_OUT') {
    console.warn('⚠️ [Auth] User signed out');
    if (window.location.pathname !== '/auth') {
      window.location.href = '/auth';
    }
  }
  
  if (!session && event !== 'INITIAL_SESSION' && window.location.pathname !== '/auth') {
    console.warn('⚠️ [Auth] Session expired, redirecting to login');
    window.location.href = '/auth';
  }
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
