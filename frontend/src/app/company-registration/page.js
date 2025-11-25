'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';
import { useDownload } from '@/hooks/use-download';

const OTP_LENGTH = 6;
const OTP_RESEND_SECONDS = 45;
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function CompanyRegistration() {
  const router = useRouter();
  const { downloadText } = useDownload();
  const [formData, setFormData] = useState({
    companyName: '',

    domain: '',
    officialEmail: '',
    password: '',
  });

  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
  const [step, setStep] = useState(1); // 1 = company details, 2 = OTP verification
  const [countdown, setCountdown] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [referenceId, setReferenceId] = useState(null);
  const [verifiedEmail, setVerifiedEmail] = useState('');
  const [keyPair, setKeyPair] = useState(null);

  const officialEmail = useMemo(() => formData.officialEmail.trim(), [formData.officialEmail]);

  useEffect(() => {
    if (!countdown) return;
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const validateForm = () => {
    const nextErrors = {};

    if (!formData.companyName.trim()) {
      nextErrors.companyName = 'Company name is required';
    }

    if (!formData.domain.trim()) {
      nextErrors.domain = 'Domain is required';
    } else if (!/^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(formData.domain)) {
      nextErrors.domain = 'Please enter a valid domain (example: company.com)';
    }

    if (!officialEmail) {
      nextErrors.officialEmail = 'Official email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(officialEmail)) {
      nextErrors.officialEmail = 'Enter a valid company email address';
    } else {
      const [, emailDomain = ''] = officialEmail.split('@');
      if (formData.domain && emailDomain.toLowerCase() !== formData.domain.toLowerCase()) {
        nextErrors.officialEmail = 'Email domain must match the company domain';
      }
    }

    if (!formData.password) {
      nextErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      nextErrors.password = 'Password must be at least 8 characters long';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleOtpChange = (event, index) => {
    const { value } = event.target;
    if (!/^[0-9]*$/.test(value)) return;

    const nextOtp = [...otp];
    nextOtp[index] = value.slice(-1);
    setOtp(nextOtp);

    if (value && index < OTP_LENGTH - 1) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (event, index) => {
    if (event.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const handleOtpPaste = (event) => {
    event.preventDefault();
    const data = event.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(data)) {
      setOtp(data.split('').slice(0, OTP_LENGTH));
    }
  };

  const sendOtp = async () => {
    if (!validateForm()) return;
    setErrors(prev => ({ ...prev, submit: undefined }));
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/verification/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: formData.companyName.trim(),
          domain: formData.domain.trim(),
          officialEmail,
          password: formData.password,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Unable to send verification code');
      }

      setReferenceId(data.referenceId);
      setVerifiedEmail(officialEmail);
      setOtp(Array(OTP_LENGTH).fill(''));
      setStep(2);
      setCountdown(OTP_RESEND_SECONDS);
    } catch (error) {
      console.error('Send OTP failed:', error);
      setErrors(prev => ({ ...prev, submit: error.message || 'Unable to send verification code. Please try again.' }));
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== OTP_LENGTH) {
      setErrors(prev => ({ ...prev, otp: 'Enter the 6-digit code we emailed you' }));
      return;
    }

    if (!referenceId) {
      setErrors(prev => ({ ...prev, otp: 'Session expired. Please resend the verification code.' }));
      return;
    }

    setErrors(prev => ({ ...prev, otp: undefined, submit: undefined }));
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/verification/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referenceId, otp: otpCode }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Invalid code, please try again');
      }

      setReferenceId(null);
      if (data.keyPair) {
        setKeyPair(data.keyPair);
        const fileContent = `BlockCertify Private Key (keep offline)\nCompany: ${data.companyName || formData.companyName}\nEmail: ${data.officialEmail || verifiedEmail}\n\nPrivate Key Seed (base64):\n${data.keyPair.privateKeySeed}\n\nPrivate Key PEM:\n${data.keyPair.privateKeyPem}`;
        downloadText(`blockcertify-private-key-${Date.now()}.txt`, fileContent);
      }
      setRegistrationSuccess(true);
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Verify OTP failed:', error);
      setErrors(prev => ({ ...prev, submit: error.message || 'Invalid code. Please try again.' }));
    } finally {
      setIsLoading(false);
    }
  };

  const resendOtp = async () => {
    if (countdown > 0 || isLoading) return;
    await sendOtp();
  };

  const emailDisplay = verifiedEmail || officialEmail || 'hr@yourcompany.com';

  const applyEmailSuggestion = (prefix) => {
    if (!formData.domain) return;
    setFormData(prev => ({ ...prev, officialEmail: `${prefix}@${prev.domain}` }));
    setErrors(prev => ({ ...prev, officialEmail: undefined }));
  };

  if (registrationSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-10 text-center">
          <div className="flex justify-center mb-6">
            <CheckCircle2 className="h-16 w-16 text-emerald-500" />
          </div>
          <h2 className="text-3xl font-semibold text-gray-900 mb-2">You're all set!</h2>
          <p className="text-gray-600 mb-4">Your company profile has been verified successfully.</p>
          {keyPair && (
            <div className="mb-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-left text-sm text-emerald-900">
              <p className="font-semibold">Private key downloaded</p>
              <p className="mt-1">We've automatically downloaded a file containing your private key seed. Store it offline—anyone with this seed can issue credentials on your behalf.</p>
            </div>
          )}
          <p className="text-sm text-gray-500">Redirecting you to the dashboard...</p>
          <Loader2 className="mt-8 h-8 w-8 text-emerald-500 animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.15),_rgba(15,23,42,0.95))]" />
      <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-3xl rounded-3xl bg-white/95 shadow-2xl ring-1 ring-black/5 backdrop-blur-xl lg:flex">
          <div className="flex-1 border-b border-gray-100 px-8 py-10 lg:border-b-0 lg:border-r">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600 mb-2">Step {step} of 2</p>
            <h1 className="text-3xl font-semibold text-slate-900 mb-3">Company Registration</h1>
            <p className="text-base text-slate-600">
              Set up your organization's BlockCertify workspace and start issuing tamper-proof certificates with institutional trust.
            </p>

            <div className="mt-10 space-y-2 text-sm text-slate-500">
              <div className="flex items-center space-x-3">
                <span className="h-2 w-2 rounded-full bg-green-400" />
                <p>Enterprise-grade encryption and secure onboarding</p>
              </div>
              <div className="flex items-center space-x-3">
                <span className="h-2 w-2 rounded-full bg-blue-400" />
                <p>Domain verification keeps imposters out</p>
              </div>
              <div className="flex items-center space-x-3">
                <span className="h-2 w-2 rounded-full bg-indigo-400" />
                <p>24×7 dedicated customer success</p>
              </div>
            </div>
          </div>

          <div className="flex-1 px-8 py-10">
            <div className="mb-6 flex items-center justify-between text-xs font-medium uppercase tracking-[0.3em] text-slate-500">
              <span className="text-[11px] leading-5 normal-case tracking-normal text-slate-500">Already verified?</span>
              <Link
                href="/issuer/login"
                className="rounded-full border border-blue-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-blue-600 transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700"
              >
                Sign in
              </Link>
            </div>
            {step === 1 ? (
              <div className="space-y-6">
                {errors.submit && (
                  <div className="rounded-2xl border border-red-100 bg-red-50/80 px-4 py-3 text-sm text-red-700">
                    {errors.submit}
                  </div>
                )}

                <div>
                  <label htmlFor="companyName" className="mb-2 block text-sm font-medium text-slate-700">
                    Company name
                  </label>
                  <input
                    id="companyName"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    placeholder="Acme Global Pvt. Ltd."
                    className={`w-full rounded-2xl border px-4 py-3 text-base shadow-sm transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${errors.companyName ? 'border-red-300' : 'border-slate-200'}`}
                  />
                  {errors.companyName && <p className="mt-1 text-sm text-red-600">{errors.companyName}</p>}
                </div>

                <div>
                  <label htmlFor="domain" className="mb-2 block text-sm font-medium text-slate-700">
                    Company domain
                  </label>
                  <div className="flex rounded-2xl border border-slate-200 text-base shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20">
                    <span className="inline-flex items-center bg-slate-50 px-3 text-sm text-slate-500">https://</span>
                    <input
                      id="domain"
                      name="domain"
                      value={formData.domain}
                      onChange={handleInputChange}
                      placeholder="yourcompany.com"
                      className="flex-1 rounded-2xl border-0 bg-transparent px-3 py-3 focus:outline-none"
                    />
                  </div>
                  {errors.domain && <p className="mt-1 text-sm text-red-600">{errors.domain}</p>}
                </div>

                <div>
                  <label htmlFor="officialEmail" className="mb-2 block text-sm font-medium text-slate-700">
                    Official email
                  </label>
                  <input
                    id="officialEmail"
                    type="email"
                    name="officialEmail"
                    value={formData.officialEmail}
                    onChange={handleInputChange}
                    placeholder="people@yourcompany.com"
                    className={`w-full rounded-2xl border px-4 py-3 text-base shadow-sm transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${errors.officialEmail ? 'border-red-300' : 'border-slate-200'}`}
                  />
                  {errors.officialEmail && <p className="mt-1 text-sm text-red-600">{errors.officialEmail}</p>}
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span>Quick fill:</span>
                    {['hr', 'careers', 'info'].map(prefix => (
                      <button
                        key={prefix}
                        type="button"
                        onClick={() => applyEmailSuggestion(prefix)}
                        disabled={!formData.domain}
                        className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition ${formData.domain ? 'border-slate-200 hover:border-blue-400 hover:text-blue-500' : 'border-slate-100 text-slate-400'}`}
                      >
                        {prefix}@{formData.domain || 'domain.com'}
                      </button>
                    ))}
                  </div>
                  <p className="mt-1 text-xs text-slate-500">Use your official domain email to receive the verification code.</p>
                </div>

                <div>
                  <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="••••••••"
                    className={`w-full rounded-2xl border px-4 py-3 text-base shadow-sm transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${errors.password ? 'border-red-300' : 'border-slate-200'}`}
                  />
                  {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
                </div>

                <button
                  type="button"
                  disabled={isLoading}
                  onClick={sendOtp}
                  className="inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-base font-medium text-white shadow-lg shadow-blue-600/30 transition hover:from-blue-500 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Sending code
                    </>
                  ) : (
                    'Send verification code'
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="inline-flex items-center text-sm font-medium text-slate-500 transition hover:text-slate-700"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back to details
                </button>

                <div className="rounded-2xl bg-slate-50 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-500">Verification</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-900">Check your inbox</h2>
                  <p className="mt-2 text-sm text-slate-600">
                    We've sent a 6-digit security code to <span className="font-medium text-slate-900">{emailDisplay}</span>.
                  </p>
                </div>

                {errors.submit && (
                  <div className="rounded-2xl border border-red-100 bg-red-50/80 px-4 py-3 text-sm text-red-700">
                    {errors.submit}
                  </div>
                )}

                <div className="flex justify-between gap-2">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(event) => handleOtpChange(event, index)}
                      onKeyDown={(event) => handleOtpKeyDown(event, index)}
                      onPaste={index === 0 ? handleOtpPaste : undefined}
                      className="h-14 w-12 rounded-2xl border border-slate-200 text-center text-2xl font-semibold text-slate-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                  ))}
                </div>
                {errors.otp && <p className="text-center text-sm text-red-600">{errors.otp}</p>}

                <button
                  type="button"
                  disabled={isLoading}
                  onClick={verifyOtp}
                  className="inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 px-4 py-3 text-base font-medium text-white shadow-lg shadow-emerald-500/30 transition hover:from-emerald-400 hover:to-green-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Verifying
                    </>
                  ) : (
                    'Verify & create account'
                  )}
                </button>

                <div className="text-center text-sm text-slate-500">
                  Didn't receive the code?{' '}
                  <button
                    type="button"
                    onClick={resendOtp}
                    disabled={countdown > 0 || isLoading}
                    className="font-semibold text-blue-600 transition hover:text-blue-500 disabled:text-slate-400"
                  >
                    {countdown > 0 ? `Resend in ${countdown}s` : 'Resend code'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}