import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { SparklesIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import { Button, Input, Card } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { getDevOTP } from '@/services/cognito';

export default function LoginPage() {
  const { sendOTP, verifyOTPCode, isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      await sendOTP(email);
      setOtpSent(true);
      // Auto-fill OTP in dev mode (SES sandbox)
      const devCode = getDevOTP();
      if (devCode) {
        setOtp(devCode);
      }
    } catch (err) {
      setError((err as Error).message || 'Failed to send OTP');
    }
    setLoading(false);
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!otp || otp.length < 4) {
      setError('Please enter a valid OTP code');
      return;
    }

    setLoading(true);
    try {
      await verifyOTPCode(otp);
    } catch (err) {
      setError((err as Error).message || 'Invalid OTP. Try again.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-purple-50 dark:from-surface-950 dark:via-surface-900 dark:to-surface-950 p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 rounded-full bg-primary-200/20 dark:bg-primary-900/10 blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-purple-200/20 dark:bg-purple-900/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-xl shadow-primary-500/25 mb-4"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <SparklesIcon className="h-8 w-8 text-white" />
          </motion.div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">
            AI FocusFlow
          </h1>
          <p className="text-sm text-surface-500 mt-1">
            {otpSent ? 'Enter the code sent to your email' : 'Enter your email to get started'}
          </p>
        </div>

        <Card padding="lg" className="backdrop-blur-xl bg-white/80 dark:bg-surface-800/80">
          <AnimatePresence mode="wait">
            {!otpSent ? (
              <motion.form
                key="email"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleSendOTP}
                className="space-y-5"
              >
                <div className="text-center mb-2">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary-50 dark:bg-primary-900/20 mb-3">
                    <EnvelopeIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                  </div>
                  <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-100">
                    Sign in with Email
                  </h2>
                </div>

                <Input
                  label="Email Address"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={error}
                />

                <Button type="submit" className="w-full" loading={loading}>
                  Send OTP Code
                </Button>
              </motion.form>
            ) : (
              <motion.form
                key="otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleVerifyOTP}
                className="space-y-5"
              >
                <div className="text-center mb-2">
                  <motion.div
                    className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-50 dark:bg-green-900/20 mb-3"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400 }}
                  >
                    <span className="text-2xl">✉️</span>
                  </motion.div>
                  <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-100">
                    {otp ? 'Code ready' : 'Check your inbox'}
                  </h2>
                  <p className="text-xs text-surface-500 mt-1">
                    {otp
                      ? 'Code auto-filled (dev mode). Click verify to continue.'
                      : <>We sent a code to <span className="font-medium text-surface-700 dark:text-surface-300">{email}</span></>
                    }
                  </p>
                </div>

                <Input
                  label="OTP Code"
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  error={error}
                  className="text-center text-lg tracking-widest"
                />

                <Button type="submit" className="w-full" loading={loading}>
                  Verify & Sign In
                </Button>

                <button
                  type="button"
                  onClick={() => { setOtpSent(false); setOtp(''); setError(''); }}
                  className="w-full text-sm text-surface-500 hover:text-primary-600 transition-colors"
                >
                  Use a different email
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </Card>

        <p className="text-center text-xs text-surface-400 mt-6">
          No password needed. We'll send a one-time code to your email.
        </p>
      </div>
    </div>
  );
}
