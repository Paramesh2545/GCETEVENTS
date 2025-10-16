import React, { useState, useEffect, useRef } from 'react';
import { confirmPasswordReset, verifyPasswordResetCode, applyActionCode, signInWithEmailAndPassword, reload, sendEmailVerification } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { otpApiService } from '../services/otpApiService';

interface OTPVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  onVerificationSuccess: (userData: any) => void;
  mode: 'email-verification' | 'password-reset';
  actionCode?: string;
  password?: string; // For email verification mode
}

const OTPVerificationModal: React.FC<OTPVerificationModalProps> = ({ 
  isOpen, 
  onClose, 
  email, 
  onVerificationSuccess, 
  mode,
  actionCode,
  password
}) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (isOpen) {
      setOtp(['', '', '', '', '', '']);
      setError('');
      setSuccess('');
      setResendCooldown(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return; // Prevent multiple characters
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = [...otp];
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtp(newOtp);
    
    // Focus the next empty input or the last one
    const nextEmptyIndex = newOtp.findIndex((digit, index) => !digit && index < 6);
    const focusIndex = nextEmptyIndex !== -1 ? nextEmptyIndex : 5;
    inputRefs.current[focusIndex]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otp.join('');
    
    if (otpCode.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (mode === 'email-verification') {
        // For OTP verification, verify the entered OTP
        const otpCode = otp.join('');
        const result = await otpApiService.verifyOTP(email, otpCode);
        
        if (result.success) {
          setSuccess('OTP verified successfully!');
          setTimeout(() => {
            onVerificationSuccess({ email, verified: true, userData: result.userData });
            onClose();
          }, 1500);
        } else {
          setError(result.message || 'Invalid OTP. Please try again.');
        }
      } else if (mode === 'password-reset' && actionCode) {
        // For password reset, verify the action code
        await verifyPasswordResetCode(auth, actionCode);
        setSuccess('Code verified! You can now reset your password.');
        setTimeout(() => {
          onVerificationSuccess({ email, actionCode });
          onClose();
        }, 1500);
      }
    } catch (err: any) {
      console.error('OTP verification error:', err);
      if (err.code === 'auth/invalid-action-code') {
        setError('Invalid or expired verification code');
      } else if (err.code === 'auth/expired-action-code') {
        setError('Verification code has expired. Please request a new one.');
      } else {
        setError(err.message || 'Verification failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    setError('');
    
    try {
      if (mode === 'email-verification') {
        // Resend OTP - we need the user data from the parent component
        // For now, we'll show an error since we don't have access to userData here
        setError('Please go back and try registering again to resend OTP.');
      } else {
        setError('Unable to resend verification email. Please try again.');
      }
      setResendCooldown(60); // 60 seconds cooldown
    } catch (err: any) {
      console.error('Resend verification error:', err);
      setError('Failed to resend verification email. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  const handleClose = () => {
    setOtp(['', '', '', '', '', '']);
    setError('');
    setSuccess('');
    setResendCooldown(0);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg shadow-xl max-w-md w-full p-6 border border-slate-700">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">
            {mode === 'email-verification' ? 'Verify Email' : 'Verify Code'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="text-center mb-6">
          <p className="text-gray-300 mb-2">
            {mode === 'email-verification' 
              ? 'We sent a 6-digit OTP to' 
              : 'Enter the verification code sent to'
            }
          </p>
          <p className="text-white font-semibold">{email}</p>
          {mode === 'email-verification' && (
            <p className="text-sm text-gray-400 mt-2">
              Please check your email and enter the OTP below.
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-center space-x-2">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                className="w-12 h-12 text-center text-xl font-bold bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                maxLength={1}
                disabled={loading}
              />
            ))}
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-400 px-4 py-3 rounded text-center">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-500/20 border border-green-500/50 text-green-400 px-4 py-3 rounded text-center">
              {success}
            </div>
          )}

          <div className="space-y-3">
            <button
              type="submit"
              disabled={loading || otp.join('').length !== 6}
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Verifying...' : mode === 'email-verification' ? 'Verify OTP' : 'Verify Code'}
            </button>

            <div className="text-center">
              <p className="text-sm text-gray-400 mb-2">
                {mode === 'email-verification' ? "Didn't receive the OTP?" : "Didn't receive the code?"}
              </p>
              <button
                type="button"
                onClick={handleResend}
                disabled={resendLoading || resendCooldown > 0}
                className="text-indigo-400 hover:text-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {resendLoading 
                  ? 'Sending...' 
                  : resendCooldown > 0 
                    ? `Resend in ${resendCooldown}s` 
                    : mode === 'email-verification' ? 'Resend OTP' : 'Resend Code'
                }
              </button>
            </div>
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-400">
            Wrong email?{' '}
            <button
              onClick={handleClose}
              className="text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Go back
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default OTPVerificationModal;
