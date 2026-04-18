import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Zap, Chrome } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { loginWithGoogle } from '../lib/auth';

interface LoginProps {
  user: any;
}

export default function Login({ user }: LoginProps) {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError('');
    try {
      await loginWithGoogle();
      // user check in useEffect will navigate
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-20 px-4 flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="max-w-md w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-900 rounded-[40px] shadow-2xl shadow-blue-500/10 border border-gray-100 dark:border-gray-800 overflow-hidden"
        >
          <div className="p-10 text-center">
            <div className="flex justify-center mb-10">
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-500/30">
                <Zap size={32} fill="currentColor" />
              </div>
            </div>

            <div className="text-center mb-10">
              <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-3">
                Welcome to Lumina
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                Sign in with your Google account to start sharing your stories with the world.
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-sm rounded-2xl border border-red-100 dark:border-red-900 flex items-center text-left">
                <span className="font-bold mr-2">!</span> {error}
              </div>
            )}

            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full py-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-2xl font-bold flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-750 transition-all active:scale-95 disabled:opacity-50 shadow-sm"
            >
              <Chrome size={20} className="mr-3" />
              <span>{isLoading ? 'Connecting...' : 'Continue with Google'}</span>
            </button>
          </div>

          <div className="p-8 bg-gray-50 dark:bg-gray-800/30 border-t border-gray-100 dark:border-gray-800 text-center">
            <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">
              Secure Authentication by Firebase
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
