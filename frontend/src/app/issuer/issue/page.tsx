'use client';

type CertificatePayload = {
  certificateId: string;
  issuer: string;
  studentName: string;
  role: string;
  startDate: string;
  endDate: string;
  issuedOn: string;
  metadata: Record<string, unknown>;
};



import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Loader2, FileDigit, UploadCloud, Download } from 'lucide-react';
import { toCanonicalJson } from '@/lib/canonicalJson';
import type { JsonValue } from '@/lib/canonicalJson';
import { postFormData, postJson } from '@/lib/api';
import { getToken } from '@/lib/tokenStorage';
import LogoutButton from '@/components/LogoutButton';
import IssuerNav from '@/components/IssuerNav';
import ExperienceFooter from '@/components/ExperienceFooter';

const defaultCertificate = {
  certificateId: '',
  issuer: '',
  studentName: '',
  role: '',
  startDate: '',
  endDate: '',
  issuedOn: '',
  metadata: '{}',
  privateKeySeed: '',
};

const textEncoder = new TextEncoder();

function base64ToUint8Array(value: string) {
  const normalized = value.trim().replace(/\s+/g, '');
  const binary = typeof window === 'undefined' ? Buffer.from(normalized, 'base64').toString('binary') : atob(normalized);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function uint8ToBase64(bytes: Uint8Array) {
  if (typeof window === 'undefined') {
    return Buffer.from(bytes).toString('base64');
  }
  let binary = '';
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary);
}

function downloadPdf(base64: string, filename: string) {
  const link = document.createElement('a');
  link.href = `data:application/pdf;base64,${base64}`;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

type Mode = 'template' | 'upload';

export default function IssueCertificatePage() {
  const router = useRouter();
  const [form, setForm] = useState(defaultCertificate);
  const [mode, setMode] = useState<Mode>('template');
  const [status, setStatus] = useState<string | null>(null);
  const [isIssuing, setIsIssuing] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace('/issuer/login');
    }
  }, [router]);

  const metadataPreview = useMemo(() => {
    try {
      return JSON.stringify(JSON.parse(form.metadata || '{}'), null, 2);
    } catch {
      return null;
    }
  }, [form.metadata]);

  const signCertificate = async (certificateJson: CertificatePayload) => {
    const canonical = toCanonicalJson(certificateJson as JsonValue);
    const seedBytes = base64ToUint8Array(form.privateKeySeed.trim());
    if (seedBytes.length !== 32) {
      throw new Error('Private key seed must be 32 bytes (base64)');
    }
    const { default: nacl } = await import('tweetnacl');
    const keyPair = nacl.sign.keyPair.fromSeed(seedBytes);
    const signatureBytes = nacl.sign.detached(textEncoder.encode(canonical), keyPair.secretKey);
    const signature = uint8ToBase64(signatureBytes);
    return { canonical, signature };
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsIssuing(true);
    setStatus(null);

    try {
      const metadata: Record<string, unknown> = form.metadata?.trim() ? JSON.parse(form.metadata) : {};
      const certificateJson: CertificatePayload = {
        certificateId: form.certificateId,
        issuer: form.issuer,
        studentName: form.studentName,
        role: form.role,
        startDate: form.startDate,
        endDate: form.endDate,
        issuedOn: form.issuedOn,
        metadata,
      };

      const { signature } = await signCertificate(certificateJson);
      const token = getToken();
      if (!token) {
        throw new Error('Session expired. Please sign in again.');
      }

      let response: { pdfBase64: string; certificateId: string; verificationUrl: string };

      if (mode === 'template') {
        response = await postJson('/certificates/issue/template', { certificateJson, signature }, token);
      } else {
        if (!pdfFile) {
          throw new Error('Upload a PDF to enhance.');
        }
        const formData = new FormData();
        formData.append('certificateJson', JSON.stringify(certificateJson));
        formData.append('signature', signature);
        formData.append('pdf', pdfFile);
        response = await postFormData('/certificates/issue/upload', formData, token);
      }

      downloadPdf(response.pdfBase64, `${response.certificateId}.pdf`);
      setStatus('Certificate PDF generated. Redirecting to dashboard...');
      setForm(defaultCertificate);
      setPdfFile(null);
      setTimeout(() => router.push('/dashboard'), 2000);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Failed to issue certificate');
    } finally {
      setIsIssuing(false);
    }
  };

  return (
    <div className="issuer-console min-h-screen bg-slate-950">
      <IssuerNav />
      <div className="relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_rgba(2,6,23,1))]" />
        <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-6 pb-12 pt-16">
        <header className="flex flex-wrap items-center justify-between gap-4 text-white">
          <div className="flex items-center gap-4">
            <Shield className="h-8 w-8 text-emerald-300" />
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Issuer console</p>
              <h1 className="text-3xl font-semibold">Generate a BlockCertify PDF</h1>
              <p className="text-sm text-slate-300">
                Sign your credential locally, and we’ll return a PDF with watermark, QR payload, and verification link.
              </p>
            </div>
          </div>
          <LogoutButton className="w-full justify-center sm:w-auto" />
        </header>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-4 text-white">
          <div className="flex flex-col gap-4 text-sm md:flex-row md:items-center md:justify-between">
            {(['template', 'upload'] as Mode[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setMode(option)}
                className={`rounded-2xl px-4 py-2 font-semibold transition ${mode === option ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white' : 'border border-white/10 text-slate-300'}`}
              >
                {option === 'template' ? 'Generate from template' : 'Enhance existing PDF'}
              </button>
            ))}
            <p className="text-xs text-slate-400">
              {mode === 'template'
                ? 'We will generate a fresh PDF using your metadata and embed the verification payload.'
                : 'Upload an existing PDF and we will preserve its contents while layering BlockCertify verification elements.'}
            </p>
          </div>
        </div>

        <form onSubmit={handleFormSubmit} className="grid gap-6 rounded-3xl border border-slate-800 bg-slate-950/70 p-6 backdrop-blur-xl lg:grid-cols-2">
          <div className="space-y-4">
            {['certificateId', 'issuer', 'studentName', 'role', 'startDate', 'endDate', 'issuedOn'].map((field) => (
              <div key={field}>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                  {field}
                </label>
                <input
                  name={field}
                  value={(form as Record<string, string>)[field]}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30"
                  placeholder={field === 'issuer' ? 'Acme University' : ''}
                  required
                />
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Metadata (JSON)</label>
              <textarea
                name="metadata"
                value={form.metadata}
                onChange={handleChange}
                rows={6}
                className="w-full rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30"
                placeholder='{"program":"MBA"}'
              />
              {metadataPreview && (
                <pre className="mt-2 rounded-2xl border border-slate-800 bg-black/60 p-3 text-[11px] text-slate-200">{metadataPreview}</pre>
              )}
            </div>

            {mode === 'upload' && (
              <div>
                <label className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                  Upload original PDF
                </label>
                <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-dashed border-slate-700 bg-slate-900/60 px-4 py-4 text-sm text-white">
                  <span>{pdfFile?.name || 'Drop PDF or click to browse'}</span>
                  <input type="file" accept="application/pdf" onChange={(e) => setPdfFile(e.target.files?.[0] || null)} className="hidden" />
                  <UploadCloud className="h-4 w-4" />
                </label>
                <p className="mt-2 text-xs text-slate-500">We will merge your original layout with BlockCertify watermark, QR, and verification footer.</p>
              </div>
            )}

            <div>
              <label className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                Private key seed (base64)
                <span className="text-[10px] text-slate-500">Never stored</span>
              </label>
              <textarea
                name="privateKeySeed"
                value={form.privateKeySeed}
                onChange={handleChange}
                rows={3}
                className="w-full rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-red-400 focus:ring-2 focus:ring-red-400/30"
                placeholder="Base64 seed provided after verification"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isIssuing}
              className="flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition disabled:opacity-50"
            >
              {isIssuing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating PDF...
                </>
              ) : (
                <>
                  <FileDigit className="mr-2 h-4 w-4" /> Issue certificate
                </>
              )}
            </button>
          </div>
        </form>

        {status && (
          <div className="flex items-center justify-between rounded-3xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-white">
            <p>{status}</p>
            <Download className="h-4 w-4 text-sky-300" />
          </div>
        )}
        <ExperienceFooter />
        </div>
      </div>
    </div>
  );
}
