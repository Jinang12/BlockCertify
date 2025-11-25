"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDownToLine,
  BarChart3,
  Clock4,
  FileSpreadsheet,
  ShieldCheck,
  ShieldOff,
  UserCheck,
} from "lucide-react";
import { getJson, postJson, API_BASE_URL } from "@/lib/api";
import { getToken } from "@/lib/tokenStorage";
import LogoutButton from "@/components/LogoutButton";
import ExperienceFooter from "@/components/ExperienceFooter";

type CertificateEntry = {
  certificateId: string;
  status: "VALID" | "REVOKED" | "EXPIRED" | string;
  issuedOn?: string | null;
  revokedAt?: string | null;
  revocationReason?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  issuerKeyId?: string | null;
  certificate?: {
    studentName?: string;
    role?: string;
    issuer?: string;
  };
};

type CertificatesResponse = {
  certificates: CertificateEntry[];
};

type CurrentKeyResponse = {
  keyId: string;
  publicKey: string;
  keyType: string;
  createdAt: string;
};

type RotateKeyResponse = CurrentKeyResponse & { privateKey: string };

const DATE_FORMATTER = new Intl.DateTimeFormat("en", {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function formatDate(date?: string | null) {
  if (!date) return "—";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "—";
  return DATE_FORMATTER.format(parsed);
}

function formatKeySnippet(pem?: string) {
  if (!pem) return "—";
  const normalized = pem
    .replace(/-----BEGIN PUBLIC KEY-----/g, "")
    .replace(/-----END PUBLIC KEY-----/g, "")
    .replace(/\s+/g, "");
  if (normalized.length <= 20) return normalized;
  return `${normalized.slice(0, 12)}…${normalized.slice(-12)}`;
}

function downloadSecretFile(filename: string, contents: string) {
  const blob = new Blob([contents], { type: "text/plain" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export default function SettingsPage() {
  const router = useRouter();
  const [certificates, setCertificates] = useState<CertificateEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [currentKey, setCurrentKey] = useState<CurrentKeyResponse | null>(null);
  const [keyError, setKeyError] = useState<string | null>(null);
  const [showRotateModal, setShowRotateModal] = useState(false);
  const [rotateReason, setRotateReason] = useState("");
  const [isRotating, setIsRotating] = useState(false);
  const [rotationMessage, setRotationMessage] = useState<string | null>(null);
  const [rotationError, setRotationError] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = getToken();
    if (!storedToken) {
      router.replace("/issuer/login");
      return;
    }
    setToken(storedToken);

    async function loadCertificates(currentToken: string) {
      try {
        const response = await getJson<CertificatesResponse>("/certificates/mine", currentToken);
        setCertificates(response.certificates ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load settings data");
      } finally {
        setIsLoading(false);
      }
    }

    async function loadCurrentKey(currentToken: string) {
      try {
        const response = await getJson<CurrentKeyResponse>("/keys/current", currentToken);
        setCurrentKey(response);
        setKeyError(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unable to load active key";
        if (message.toLowerCase().includes("no active key")) {
          setCurrentKey(null);
          setKeyError(null);
        } else {
          setKeyError(message);
        }
      }
    }

    void loadCertificates(storedToken);
    void loadCurrentKey(storedToken);
  }, [router]);

  const stats = useMemo(() => {
    const total = certificates.length;
    const revoked = certificates.filter((cert) => cert.status === "REVOKED").length;
    const expired = certificates.filter((cert) => cert.status === "EXPIRED").length;
    const active = total - revoked - expired;
    return {
      total,
      revoked,
      expired,
      active,
    };
  }, [certificates]);

  const recentActivity = useMemo(() => {
    return [...certificates]
      .sort((a, b) => {
        const aDate = new Date(a.updatedAt || a.createdAt || a.issuedOn || 0).getTime();
        const bDate = new Date(b.updatedAt || b.createdAt || b.issuedOn || 0).getTime();
        return bDate - aDate;
      })
      .slice(0, 6);
  }, [certificates]);

  const activeCertificates = useMemo(
    () => certificates.filter((cert) => cert.status === "VALID"),
    [certificates],
  );

  const revokedCertificates = useMemo(
    () => certificates.filter((cert) => cert.status === "REVOKED"),
    [certificates],
  );

  const handleRotateClick = () => {
    setRotationError(null);
    setShowRotateModal(true);
  };

  const handleRotateConfirm = async () => {
    if (!token) {
      router.replace("/issuer/login");
      return;
    }

    setIsRotating(true);
    setRotationError(null);
    try {
      const response = await postJson<RotateKeyResponse>(
        "/keys/rotate",
        { reason: rotateReason.trim() || undefined },
        token,
      );
      const fileContent = `BlockCertify Issuer Private Key\nKey ID: ${response.keyId}\nGenerated: ${response.createdAt}\nKey Type: ${response.keyType}\n\nPrivate Key Seed (base64):\n${response.privateKey}\n`;
      downloadSecretFile(`blockcertify-ed25519-seed-${response.keyId}.txt`, fileContent);
      setRotationMessage("New signing key issued. The private key seed has been downloaded.");
      setCurrentKey({
        keyId: response.keyId,
        publicKey: response.publicKey,
        keyType: response.keyType,
        createdAt: response.createdAt,
      });
      setRotateReason("");
      setShowRotateModal(false);
    } catch (err) {
      setRotationError(err instanceof Error ? err.message : "Failed to rotate keys");
    } finally {
      setIsRotating(false);
    }
  };

  const handleDownloadCsv = async () => {
    if (!token) {
      router.replace("/issuer/login");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/certificates/mine/download`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to download CSV (${response.status})`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "blockcertify-certificates.csv";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to download CSV export");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.15),_rgba(2,6,23,1))]" />
      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col gap-10 px-6 py-10 lg:px-12">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-sky-300">Issuer settings</p>
            <h1 className="mt-1 text-3xl font-semibold">Workspace controls & telemetry</h1>
            <p className="mt-2 text-sm text-slate-300">
              Monitor issuance health, download audit logs, and keep your BlockCertify footprint compliant.
            </p>
          </div>

          <div className="flex flex-1 flex-col gap-3 sm:flex-none sm:flex-row sm:items-center sm:justify-end">
            <button
              type="button"
              onClick={handleDownloadCsv}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-blue-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:from-emerald-400 hover:to-blue-400"
            >
              <ArrowDownToLine className="h-4 w-4" /> Download CSV logs
            </button>
            <LogoutButton className="w-full justify-center sm:w-auto" label="Sign out" />
          </div>
        </header>

        {rotationMessage && (
          <div className="rounded-3xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm text-emerald-100">
            {rotationMessage}
          </div>
        )}

        {error && (
          <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>
        )}

        {keyError && (
          <div className="rounded-3xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
            {keyError}
          </div>
        )}

        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="h-32 animate-pulse rounded-3xl bg-white/5" />
            ))}
          </div>
        ) : (
          <>
            <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/80 to-slate-950/80 p-6 shadow-xl shadow-black/40">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-400">Active signing key</p>
                  {currentKey ? (
                    <>
                      <h2 className="mt-2 text-2xl font-semibold text-white">Key ID: {currentKey.keyId}</h2>
                      <p className="text-sm text-slate-300">Issued on {formatDate(currentKey.createdAt)}</p>
                      <p className="mt-3 text-xs font-mono text-slate-400">{formatKeySnippet(currentKey.publicKey)}</p>
                    </>
                  ) : (
                    <p className="mt-2 text-sm text-slate-300">
                      No active key yet. Rotate now to generate a fresh signing pair.
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={handleRotateClick}
                    disabled={isRotating}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-500/40 px-5 py-2.5 text-sm font-semibold text-rose-100 transition hover:bg-rose-500/10 disabled:opacity-50"
                  >
                    Rotate keys
                  </button>
                  <p className="text-xs text-slate-400">
                    Private keys are shown once. Store the downloaded seed offline before issuing new credentials.
                  </p>
                </div>
              </div>
            </section>

            <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  label: "Total issued",
                  value: stats.total,
                  icon: <FileSpreadsheet className="h-5 w-5 text-sky-300" />,
                  accent: "from-slate-800/60 to-slate-900/60",
                },
                {
                  label: "Active credentials",
                  value: stats.active,
                  icon: <ShieldCheck className="h-5 w-5 text-emerald-300" />,
                  accent: "from-emerald-500/20 to-emerald-900/30",
                },
                {
                  label: "Revoked",
                  value: stats.revoked,
                  icon: <ShieldOff className="h-5 w-5 text-rose-300" />,
                  accent: "from-rose-500/20 to-rose-900/30",
                },
                {
                  label: "Expired",
                  value: stats.expired,
                  icon: <Clock4 className="h-5 w-5 text-amber-300" />,
                  accent: "from-amber-500/20 to-amber-900/30",
                },
              ].map((card) => (
                <article
                  key={card.label}
                  className={`rounded-3xl border border-white/10 bg-gradient-to-br ${card.accent} p-5 shadow-xl shadow-black/30`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs uppercase tracking-[0.3em] text-white/60">{card.label}</p>
                    {card.icon}
                  </div>
                  <p className="mt-4 text-3xl font-semibold">{card.value}</p>
                </article>
              ))}
            </section>

            <section className="grid gap-6 lg:grid-cols-3">
              <article className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/30 lg:col-span-2">
                <div className="flex items-center gap-2 text-slate-300">
                  <BarChart3 className="h-5 w-5 text-sky-300" />
                  <span className="text-xs font-semibold uppercase tracking-[0.4em]">Inventory overview</span>
                </div>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/5 bg-slate-950/40 p-4">
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Active roster</p>
                    <p className="mt-2 text-2xl font-semibold text-white">{activeCertificates.length}</p>
                    <p className="text-xs text-slate-400">Ready for verification</p>
                  </div>
                  <div className="rounded-2xl border border-white/5 bg-slate-950/40 p-4">
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Revoked / blocked</p>
                    <p className="mt-2 text-2xl font-semibold text-white">{revokedCertificates.length}</p>
                    <p className="text-xs text-slate-400">Auto-syncs to verification fabric</p>
                  </div>
                </div>

                <div className="mt-8">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Recent activity</p>
                  <ul className="mt-4 divide-y divide-white/5 rounded-2xl border border-white/5">
                    {recentActivity.length === 0 && (
                      <li className="p-4 text-sm text-slate-400">No activity yet.</li>
                    )}
                    {recentActivity.map((entry) => (
                      <li key={entry.certificateId} className="flex items-center justify-between p-4 text-sm">
                        <div>
                          <p className="font-semibold text-white">
                            {entry.certificate?.studentName || entry.certificateId}
                          </p>
                          <p className="text-xs text-slate-400">
                            {entry.status === "REVOKED" ? "Revoked" : "Issued"} • {formatDate(entry.updatedAt || entry.issuedOn)}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] ${
                            entry.status === "REVOKED"
                              ? "bg-rose-500/20 text-rose-200"
                              : entry.status === "EXPIRED"
                                ? "bg-amber-500/20 text-amber-200"
                                : "bg-emerald-500/20 text-emerald-200"
                          }`}
                        >
                          {entry.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>

              <article className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/30">
                <div className="flex items-center gap-2 text-slate-300">
                  <UserCheck className="h-5 w-5 text-emerald-300" />
                  <span className="text-xs font-semibold uppercase tracking-[0.4em]">Policy reminders</span>
                </div>
                <ul className="space-y-3 text-sm text-slate-200">
                  <li className="rounded-2xl border border-white/5 bg-slate-950/40 p-4">Rotate issuer keys every 90 days and store seeds offline.</li>
                  <li className="rounded-2xl border border-white/5 bg-slate-950/40 p-4">Revoke compromised certificates immediately and notify verifiers.</li>
                  <li className="rounded-2xl border border-white/5 bg-slate-950/40 p-4">Export logs weekly for compliance and SOC 2 evidence.</li>
                </ul>
              </article>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-300">
                  <FileSpreadsheet className="h-5 w-5 text-sky-300" />
                  <span className="text-xs font-semibold uppercase tracking-[0.4em]">Certificate ledger</span>
                </div>
                <p className="text-xs text-slate-400">Showing last {Math.min(certificates.length, 8)} entries</p>
              </div>

              <div className="mt-4 overflow-auto rounded-2xl border border-white/5">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white/5 text-xs uppercase tracking-[0.3em] text-slate-400">
                    <tr>
                      <th className="px-4 py-3">Certificate</th>
                      <th className="px-4 py-3">Recipient</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Issued</th>
                      <th className="px-4 py-3">Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {certificates.slice(0, 8).map((entry) => (
                      <tr key={entry.certificateId} className="border-t border-white/5 text-slate-200">
                        <td className="px-4 py-3 font-mono text-xs">{entry.certificateId}</td>
                        <td className="px-4 py-3">{entry.certificate?.studentName || "—"}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] ${
                              entry.status === "REVOKED"
                                ? "bg-rose-500/20 text-rose-200"
                                : entry.status === "EXPIRED"
                                  ? "bg-amber-500/20 text-amber-200"
                                  : "bg-emerald-500/20 text-emerald-200"
                            }`}
                          >
                            {entry.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-400">{formatDate(entry.issuedOn)}</td>
                        <td className="px-4 py-3 text-slate-400">{formatDate(entry.updatedAt || entry.revokedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
            <ExperienceFooter />
          </>
        )}

        {showRotateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
            <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-slate-900 p-6 text-white shadow-2xl">
              <h3 className="text-2xl font-semibold">Rotate issuer keys</h3>
              <p className="mt-2 text-sm text-slate-300">
                Rotating keys revokes the old signing key for new issuances. Existing certificates stay verifiable with their
                historical keys. Download and store the new private seed securely.
              </p>
              <label className="mt-4 block text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                Reason (optional)
              </label>
              <textarea
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 p-3 text-sm text-white placeholder:text-slate-500 focus:border-rose-400 focus:ring-2 focus:ring-rose-400/30"
                rows={3}
                value={rotateReason}
                onChange={(e) => setRotateReason(e.target.value)}
                placeholder="Routine rotation, suspected compromise, etc."
              />
              {rotationError && (
                <p className="mt-3 text-sm text-rose-300">{rotationError}</p>
              )}
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowRotateModal(false);
                    setRotationError(null);
                  }}
                  className="rounded-2xl px-4 py-2 text-sm text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isRotating}
                  onClick={handleRotateConfirm}
                  className="rounded-2xl bg-gradient-to-r from-rose-500 to-purple-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-500/30 transition disabled:opacity-50"
                >
                  {isRotating ? "Rotating..." : "Confirm & download"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
