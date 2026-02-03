'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Missing verification token');
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/auth/verify-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (response.ok) {
          setStatus('success');
          setMessage('Your email has been successfully verified.');
        } else {
          setStatus('error');
          setMessage(data.detail || 'Failed to verify email');
        }
      } catch (error) {
        setStatus('error');
        setMessage('An error occurred during verification');
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Link href="/" className="flex items-center gap-2">
             <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-xl">D</span>
             </div>
             <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-indigo-600">
                DocuQuery
             </span>
          </Link>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
          {status === 'loading' && (
            <div className="flex flex-col items-center">
              <Loader2 className="w-12 h-12 text-primary-600 animate-spin mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Verifying your email...</h2>
              <p className="text-gray-600">Please wait while we verify your account.</p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center">
              <CheckCircle2 className="w-12 h-12 text-green-500 mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Email Verified!</h2>
              <p className="text-gray-600 mb-6">{message}</p>
              <button
                onClick={() => router.push('/login')}
                className="w-full bg-primary-600 hover:bg-primary-700 py-2 px-4 rounded-lg text-white font-medium"
              >
                Go to Login
              </button>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center">
              <XCircle className="w-12 h-12 text-red-500 mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Verification Failed</h2>
              <p className="text-gray-600 mb-6">{message}</p>
              <button
                onClick={() => router.push('/login')}
                className="w-full bg-gray-600 hover:bg-gray-700 py-2 px-4 rounded-lg text-white font-medium"
              >
                Back to Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
