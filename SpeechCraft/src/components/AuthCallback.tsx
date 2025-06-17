import React, { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { supabase } from '../../utils/supabase/client'; 
import { useDispatch } from 'react-redux';
import { login as loginAction } from '../redux/slice/authSlice';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    const handleCallback = async () => {
      const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);

      if (error) {
        console.error('Error during session exchange:', error.message);
        alert('There was an error verifying your email. Please try logging in manually.');
        navigate({ to: '/auth/login' });
        return;
      }

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        alert('User not found after verification.');
        return;
      }

      const session = (await supabase.auth.getSession()).data.session;
      if (!session) {
        alert('Session not found after verification.');
        navigate({ to: '/auth/login' });
        return;
      }

      dispatch(loginAction({
        session,
        profile: {
          id: Number(userData.user.id),
          email: userData.user.email || '',
          firstName: userData.user.user_metadata?.first_name || '',
          lastName: userData.user.user_metadata?.last_name || '',
          created_at: userData.user.created_at || '',
          is_email_verified: true,
        }
      }));

      navigate({ to: '/app/transcribe' });
    };

    handleCallback();
  }, [navigate, dispatch]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <h1 className="text-xl font-semibold text-gray-700 mb-2">Verifying your email...</h1>
        <p className="text-gray-500">Please wait while we complete the verification process.</p>
      </div>
    </div>
  );
};

export default AuthCallback;
