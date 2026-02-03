'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, User, Lock, Mail, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/components/AuthContext';
import api from '@/lib/api';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');
  const [mounted, setMounted] = useState(false);

  // Profile state
  const [name, setName] = useState(user?.name || '');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  // Security state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securityLoading, setSecurityLoading] = useState(false);
  const [securityMessage, setSecurityMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  // Resend verification state
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  useEffect(() => {
    setMounted(true);
    if (user) {
      setName(user.name);
    }
  }, [user]);

  if (!mounted || !isOpen || !user) return null;

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMessage(null);

    try {
      const response = await api.put('/auth/profile', { name });

      setProfileMessage({ type: 'success', text: 'Profile updated successfully' });
      // Ideally we should update the user context here, but a page refresh will do for now
    } catch (error: any) {
      setProfileMessage({
        type: 'error',
        text: error.response?.data?.detail || 'Failed to update profile'
      });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setSecurityMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (newPassword.length < 6) {
      setSecurityMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }

    setSecurityLoading(true);
    setSecurityMessage(null);

    try {
      await api.put('/auth/profile/password', {
        current_password: currentPassword,
        new_password: newPassword
      });

      setSecurityMessage({ type: 'success', text: 'Password changed successfully' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      setSecurityMessage({
        type: 'error',
        text: error.response?.data?.detail || 'Failed to change password'
      });
    } finally {
      setSecurityLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (user.email_verified) return;

    setResendLoading(true);
    setResendMessage(null);

    try {
      await api.post('/auth/resend-verification', { email: user.email });
      setResendMessage({ type: 'success', text: 'Verification email sent' });
    } catch (error: any) {
       setResendMessage({
        type: 'error',
        text: error.response?.data?.detail || 'Failed to send verification email'
      });
    } finally {
      setResendLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">Account Settings</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'profile'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`flex-1 py-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'security'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Security
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {profileMessage && (
                <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${
                  profileMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}>
                  {profileMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  {profileMessage.text}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Verification</label>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">{user.email}</span>
                    </div>
                    {user.email_verified ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle2 className="w-3 h-3" />
                        Verified
                      </span>
                    ) : (
                      <button
                        onClick={handleResendVerification}
                        disabled={resendLoading}
                        className="text-primary-600 text-xs font-medium hover:text-primary-700 disabled:opacity-50"
                      >
                        {resendLoading ? 'Sending...' : 'Resend Verification'}
                      </button>
                    )}
                  </div>
                  {resendMessage && (
                    <p className={`mt-1 text-xs ${resendMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                      {resendMessage.text}
                    </p>
                  )}
                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        id="fullName"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                        placeholder="Your Name"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={profileLoading}
                      className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 transition-colors"
                    >
                      {profileLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              {securityMessage && (
                <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${
                  securityMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}>
                  {securityMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  {securityMessage.text}
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      id="currentPassword"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                <hr className="border-gray-100 my-4" />

                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                      placeholder="••••••••"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                      placeholder="••••••••"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={securityLoading}
                    className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 transition-colors"
                  >
                    {securityLoading ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
