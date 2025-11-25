'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle2, FileDigit, FileText, Loader2, ShieldCheck, UploadCloud, XCircle } from 'lucide-react';
import { postFormData } from '@/lib/api';
import { getToken } from '@/lib/tokenStorage';

type VerificationChecks = {
  hashMatch: boolean;
  signatureValid: boolean;
  statusValid: boolean;
};

type VerificationLedger = {
  certificateId: string;
  issuedOn: string;
  hash: string;
  status: string;
  verificationUrl: string;
};

type PdfVerificationResponse = {
  verdict: 'AUTHENTIC' | 'COUNTERFEIT';
  reason?: string;
  checks: VerificationChecks;
  ledger?: VerificationLedger;
  certificate?: Record<string, unknown>;
};

const CHECK_LABELS: { key: keyof VerificationChecks; label: string; detail: string }[] = [
  {
    key: 'hashMatch',
    label: 'Hash matches ledger',
    detail: 'Canonical JSON hash equals on-chain record.',
  },
  {
    key: 'signatureValid',
    label: 'Digital signature valid',
    detail: 'Ed25519 verification against issuer public key.',
  },
  {
    key: 'statusValid',
    label: 'Ledger status = VALID',
    detail: 'Certificate must not be revoked or expired.',
  },
];

async function hashFileSha256(file: File) {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export default function VerificationPage() {
  const router = useRouter();
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfHash, setPdfHash] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [result, setResult] = useState<PdfVerificationResponse | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace('/issuer/login');
    }
  }, [router]);

  const handleFileChange = async (file: File) => {
    setPdfFile(file);
    setResult(null);
    setStatusMessage('Hashing PDF...');
    const hash = await hashFileSha256(file);
    setPdfHash(hash);
    setStatusMessage('Ready to verify.');
  };

  const handleVerify = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!pdfFile) {
      setStatusMessage('Upload a certificate PDF first.');
      return;
    }

    setIsVerifying(true);
    setStatusMessage('Contacting BlockCertify ledger...');

    try {
      const formData = new FormData();
      formData.append('pdf', pdfFile);
      const response = await postFormData<PdfVerificationResponse>('/certificates/verify/pdf', formData);
      setResult(response);
      setStatusMessage(
        response.verdict === 'AUTHENTIC'
          ? 'Certificate verified as authentic.'
          : response.reason || 'Verification failed integrity checks.'
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Verification failed. Try again.';
      setStatusMessage(message);
      setResult(null);
    } finally {
      setIsVerifying(false);
    }
  };

  const verdictStyles: Record<'AUTHENTIC' | 'COUNTERFEIT' | 'UNKNOWN', string> = {
    AUTHENTIC: 'from-emerald-500/40 to-emerald-800/40 text-emerald-100 border-emerald-400/40',
    COUNTERFEIT: 'from-rose-500/40 to-rose-800/40 text-rose-100 border-rose-400/40',
    UNKNOWN: 'from-slate-800/60 to-slate-900/80 text-white border-white/15',
  };

  const verdictIcon = result?.verdict === 'AUTHENTIC'
    ? <CheckCircle2 className="h-6 w-6 text-emerald-300" />
    : result?.verdict === 'COUNTERFEIT'
      ? <XCircle className="h-6 w-6 text-rose-300" />
      : <ShieldCheck className="h-6 w-6 text-slate-200" />;

  const certificateSummary = result?.certificate && typeof result.certificate === 'object'
    ? (result.certificate as Record<string, unknown>)
    : null;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_rgba(2,6,23,1))]" />
      <div className="relative z-10 mx-auto flex min-h-screen max-w-5xl flex-col gap-10 px-6 py-10">
        <header className="space-y-4">
          <p className="text-xs uppercase tracking-[0.5em] text-slate-400">Verification desk</p>
          <h1 className="text-3xl font-semibold text-white">Upload the BlockCertify-issued PDF. That’s it.</h1>
          <p className="text-sm text-slate-400">
            We extract the embedded payload, recompute hashes, verify signatures on-chain, and return a verdict with
            full audit context. No manual fields, no guessing.
          </p>
          <Link
            href="/issuer/issue"
            className="inline-flex items-center gap-2 text-sm font-semibold text-sky-300 hover:text-white"
          >
            Issue another credential ↗
          </Link>
        </header>

        <div className="grid gap-8 lg:grid-cols-2">
          <form onSubmit={handleVerify} className="space-y-6 rounded-3xl border border-slate-800 bg-slate-900/80 p-6 backdrop-blur">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-400">Step 1</p>
              <h2 className="mt-2 text-lg font-semibold text-white">Drop the PDF</h2>
              <p className="text-sm text-slate-400">Only the PDF issued by BlockCertify contains the embedded payload we need.</p>
              <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-black/30 px-6 py-10 text-center text-sm text-slate-300 transition hover:border-white/40">
                <UploadCloud className="mb-3 h-6 w-6 text-sky-300" />
                <span className="font-semibold">{pdfFile ? pdfFile.name : 'Browse or drop PDF'}</span>
                <span className="mt-1 text-xs text-slate-500">PDF is processed entirely client-side</span>
                <input
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleFileChange(file);
                  }}
                />
              </label>
              {pdfHash && (
                <p className="mt-3 break-all text-[11px] text-slate-400">SHA-256: {pdfHash}</p>
              )}
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-400">Step 2</p>
              <h2 className="mt-2 text-lg font-semibold text-white">Let BlockCertify verify</h2>
              <ul className="mt-3 space-y-2 text-sm text-slate-400">
                <li>• Extract embedded certificate JSON + signature.</li>
                <li>• Recompute canonical hash + verify Ed25519 signature.</li>
                <li>• Cross-check ledger status (VALID / revoked / expired).</li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={isVerifying}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-blue-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition disabled:opacity-50"
            >
              {isVerifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDigit className="h-4 w-4" />}
              {isVerifying ? 'Verifying PDF...' : 'Verify PDF'}
            </button>

            {statusMessage && (
              <p className="text-center text-xs text-amber-300">{statusMessage}</p>
            )}
          </form>

          <section className="space-y-6">
            <div className={`rounded-3xl border bg-gradient-to-br p-6 ${verdictStyles[result?.verdict ?? 'UNKNOWN']}`}>
              <div className="flex items-center gap-3">
                {verdictIcon}
                <div>
                  <p className="text-xs uppercase tracking-[0.4em] text-white/70">Verdict</p>
                  <h2 className="text-2xl font-semibold">
                    {result?.verdict === 'AUTHENTIC'
                      ? 'Certificate is AUTHENTIC'
                      : result?.verdict === 'COUNTERFEIT'
                        ? 'Certificate is COUNTERFEIT'
                        : 'Awaiting upload'}
                  </h2>
                </div>
              </div>
              {result?.reason && result.verdict === 'COUNTERFEIT' && (
                <p className="mt-3 text-sm text-white/80">Reason: {result.reason}</p>
              )}
              {result?.ledger && (
                <div className="mt-4 grid gap-3 text-xs text-white/80">
                  <div className="rounded-2xl border border-white/20 bg-black/30 p-3">
                    <p className="text-slate-400">Certificate ID</p>
                    <p className="font-semibold text-white">{result.ledger.certificateId}</p>
                  </div>
                  <div className="rounded-2xl border border-white/20 bg-black/30 p-3">
                    <p className="text-slate-400">Issued on</p>
                    <p className="font-semibold text-white">{result.ledger.issuedOn}</p>
                  </div>
                  <div className="rounded-2xl border border-white/20 bg-black/30 p-3">
                    <p className="text-slate-400">Ledger status</p>
                    <p className="font-semibold text-white">{result.ledger.status}</p>
                  </div>
                  <div className="rounded-2xl border border-white/20 bg-black/30 p-3">
                    <p className="text-slate-400">Hash</p>
                    <p className="break-all font-semibold text-white">{result.ledger.hash}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
              <div className="flex items-center gap-2 text-slate-200">
                <ShieldCheck className="h-5 w-5 text-emerald-300" />
                <span className="text-xs font-semibold uppercase tracking-[0.4em]">Integrity checks</span>
              </div>
              <div className="mt-4 grid gap-4">
                {CHECK_LABELS.map((check) => {
                  const passed = result ? result.checks?.[check.key] : false;
                  return (
                    <div key={check.key} className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm">
                      <div className="flex items-center gap-2">
                        {passed ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                        ) : (
                          <XCircle className="h-4 w-4 text-rose-300" />
                        )}
                        <span className="font-semibold">{check.label}</span>
                      </div>
                      <p className="mt-1 text-xs text-slate-400">{check.detail}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {certificateSummary && (
              <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
                <div className="flex items-center gap-2 text-slate-200">
                  <FileText className="h-5 w-5 text-sky-300" />
                  <span className="text-xs font-semibold uppercase tracking-[0.4em]">Extracted payload</span>
                </div>
                <pre className="mt-4 max-h-60 overflow-auto rounded-2xl border border-white/5 bg-black/40 p-4 text-xs text-slate-200">
                  {JSON.stringify(certificateSummary, null, 2)}
                </pre>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
