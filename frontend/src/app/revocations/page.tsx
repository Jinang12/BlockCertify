"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Ban, CheckCircle2, Loader2, Shield, ShieldOff } from "lucide-react";
import IssuerNav from "@/components/IssuerNav";
import ExperienceFooter from "@/components/ExperienceFooter";
import { getToken } from "@/lib/tokenStorage";
import { getJson, postJson } from "@/lib/api";

interface CertificateEntry {
  certificateId: string;
  status: "VALID" | "REVOKED" | "EXPIRED" | string;
  issuedOn?: string | null;
  revokedAt?: string | null;
  revocationReason?: string | null;
  updatedAt?: string | null;
}

interface CertificatesResponse {
  certificates: CertificateEntry[];
}

export default function RevocationsPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [certificates, setCertificates] = useState<CertificateEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [formCertificateId, setFormCertificateId] = useState("");
  const [formReason, setFormReason] = useState("");
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const storedToken = getToken();
    if (!storedToken) {
      router.replace("/issuer/login");
      return;
    }
    setToken(storedToken);
    void loadCertificates(storedToken);
  }, [router]);

  const revokedCertificates = useMemo(
    () => certificates.filter((cert) => cert.status === "REVOKED"),
    [certificates],
  );

  const activeCertificates = useMemo(
    () => certificates.filter((cert) => cert.status === "VALID"),
    [certificates],
  );

  const stats = useMemo(
    () => ({
      total: certificates.length,
      revoked: revokedCertificates.length,
      active: activeCertificates.length,
    }),
    [certificates, revokedCertificates.length, activeCertificates.length],
  );

  async function loadCertificates(currentToken: string) {
    setLoading(true);
    try {
      const response = await getJson<CertificatesResponse>("/certificates/mine", currentToken);
      setCertificates(response.certificates ?? []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) {
      router.replace("/issuer/login");
      return;
    }
    if (!formCertificateId.trim()) {
      setFormError("Certificate ID is required.");
      setFormMessage(null);
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    setFormMessage(null);
    try {
      await postJson(`/certificates/${encodeURIComponent(formCertificateId.trim())}/revoke`, { reason: formReason.trim() || undefined }, token);
      setFormMessage("Certificate revoked. Ledger now reflects the new status.");
      setFormCertificateId("");
      setFormReason("");
      await loadCertificates(token);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Failed to revoke certificate");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <IssuerNav />
      <div className="relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(244,63,94,0.12),_rgba(2,6,23,0.95))]" />
        <div className="relative z-10 mx-auto flex min-h-screen max-w-5xl flex-col gap-10 px-6 pb-12 pt-16">
          <header className="space-y-4">
            <p className="text-xs uppercase tracking-[0.5em] text-rose-300">Revocation desk</p>
            <h1 className="text-3xl font-semibold">Quarantine compromised credentials in seconds.</h1>
            <p className="text-sm text-slate-300">
              Provide the credential ID, optionally include a reason, and we will mark the ledger entry as REVOKED. Verifiers
              will see the change instantly inside the verification feed.
            </p>
          </header>

          <section className="grid gap-6 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/40 lg:grid-cols-2">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="flex items-center gap-3 text-slate-200">
                <ShieldOff className="h-5 w-5 text-rose-300" />
                <div>
                  <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Manual revocation</p>
                  <p className="text-sm">Ledger status changes propagate within seconds.</p>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Certificate ID</label>
                <input
                  value={formCertificateId}
                  onChange={(e) => setFormCertificateId(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-rose-400 focus:ring-2 focus:ring-rose-400/30"
                  placeholder="CERT-2025-0001"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Reason (optional)</label>
                <textarea
                  value={formReason}
                  onChange={(e) => setFormReason(e.target.value)}
                  rows={3}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-rose-400 focus:ring-2 focus:ring-rose-400/30"
                  placeholder="Phishing attempt / policy breach"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-500/30 transition disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />}
                {isSubmitting ? "Revoking..." : "Revoke certificate"}
              </button>
              {formMessage && <p className="text-xs text-emerald-300">{formMessage}</p>}
              {formError && <p className="text-xs text-rose-300">{formError}</p>}
            </form>

            <div className="space-y-4 rounded-3xl border border-white/10 bg-black/30 p-5">
              <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Ledger snapshot</p>
              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                {[{
                  label: "Active",
                  value: stats.active,
                  icon: <CheckCircle2 className="h-4 w-4 text-emerald-300" />,
                }, {
                  label: "Revoked",
                  value: stats.revoked,
                  icon: <ShieldOff className="h-4 w-4 text-rose-300" />,
                }, {
                  label: "Total",
                  value: stats.total,
                  icon: <Shield className="h-4 w-4 text-sky-300" />,
                }].map((card) => (
                  <div key={card.label} className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-900/50 px-4 py-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{card.label}</p>
                      <p className="text-2xl font-semibold text-white">{card.value}</p>
                    </div>
                    {card.icon}
                  </div>
                ))}
              </div>
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
                <p className="font-semibold uppercase tracking-[0.3em] text-amber-300">Tip</p>
                <p className="mt-1">
                  Need forensic context? Export the CSV from Settings → Workspace controls, or open the Verification feed to see
                  revocation alerts in real time.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center gap-2 text-slate-200">
              <AlertTriangle className="h-5 w-5 text-rose-300" />
              <span className="text-xs font-semibold uppercase tracking-[0.4em]">Recently revoked</span>
            </div>
            {loading ? (
              <p className="mt-4 text-sm text-slate-400">Loading ledger entries…</p>
            ) : revokedCertificates.length === 0 ? (
              <p className="mt-4 text-sm text-slate-400">No revoked credentials yet.</p>
            ) : (
              <div className="mt-4 overflow-auto rounded-2xl border border-white/10">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white/5 text-xs uppercase tracking-[0.3em] text-slate-400">
                    <tr>
                      <th className="px-4 py-3">Certificate</th>
                      <th className="px-4 py-3">Revoked at</th>
                      <th className="px-4 py-3">Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {revokedCertificates.slice(0, 10).map((entry) => (
                      <tr key={entry.certificateId} className="border-t border-white/5 text-slate-200">
                        <td className="px-4 py-3 font-mono text-xs">{entry.certificateId}</td>
                        <td className="px-4 py-3 text-slate-400">{entry.revokedAt ? new Date(entry.revokedAt).toLocaleString() : "—"}</td>
                        <td className="px-4 py-3 text-slate-300">{entry.revocationReason || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
          <ExperienceFooter />
        </div>
      </div>
    </div>
  );
}
