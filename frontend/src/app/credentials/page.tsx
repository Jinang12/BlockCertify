"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, FileCheck2, Layers3, Palette, PlusCircle } from "lucide-react";
import { getToken } from "@/lib/tokenStorage";
import LogoutButton from "@/components/LogoutButton";

const templates = [
  {
    name: "Executive Diploma",
    audience: "Post-grad cohort",
    status: "Published",
    color: "from-emerald-500/60 to-emerald-700/30",
  },
  {
    name: "Onboarding Badge",
    audience: "HR + Talent",
    status: "Draft",
    color: "from-blue-500/60 to-blue-800/30",
  },
  {
    name: "Vendor Compliance",
    audience: "Procurement",
    status: "Reviewed",
    color: "from-orange-500/60 to-rose-600/40",
  },
];

export default function CredentialsPage() {
  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/issuer/login");
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.15),_rgba(15,23,42,0.95))]" />
      <div className="relative z-10 mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-6 py-10 lg:px-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-400">Templates</p>
            <h1 className="mt-1 text-3xl font-semibold text-white">Design credentials with enterprise controls.</h1>
            <p className="mt-2 text-sm text-slate-300">
              Tailor issuer seals, metadata schemas, expiry rules, and animations.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/credentials/new"
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/30"
            >
              <PlusCircle className="h-4 w-4" /> New template
            </Link>
            <LogoutButton className="w-full justify-center sm:w-auto" label="Logout" />
          </div>
        </header>

        <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <article
              key={template.name}
              className={`rounded-3xl border border-white/10 bg-gradient-to-b ${template.color} p-5 text-white shadow-xl shadow-black/30`}
            >
              <div className="flex items-center gap-3">
                <Layers3 className="h-5 w-5" />
                <span className="text-xs uppercase tracking-[0.4em] text-white/70">{template.status}</span>
              </div>
              <h3 className="mt-4 text-xl font-semibold">{template.name}</h3>
              <p className="text-sm text-white/80">Audience: {template.audience}</p>
              <button className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-white/90 hover:text-white">
                Edit template <ArrowUpRight className="h-4 w-4" />
              </button>
            </article>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <article className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center gap-3 text-slate-200">
              <FileCheck2 className="h-5 w-5 text-emerald-400" />
              <span className="text-sm font-semibold uppercase tracking-[0.4em]">Workflow</span>
            </div>
            <ol className="mt-4 space-y-4 text-sm text-slate-200">
              <li>① Map required metadata + attach validations.</li>
              <li>② Drag in issuer branding, seals, micro-animations.</li>
              <li>③ Publish to ledger and distribute via API or dashboard.</li>
            </ol>
            <Link href="/verifications" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-sky-300">
              Preview verification journey <ArrowUpRight className="h-4 w-4" />
            </Link>
          </article>

          <article className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center gap-3 text-slate-200">
              <Palette className="h-5 w-5 text-pink-300" />
              <span className="text-sm font-semibold uppercase tracking-[0.4em]">Theme builder</span>
            </div>
            <p className="mt-4 text-sm text-slate-300">
              Auto-generate dark/light friendly certificates, embed variable QR codes, and export snapshots for compliance reviewers.
            </p>
            <div className="mt-6 grid gap-3 text-sm text-slate-200">
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">Advanced typography and layout grids.</div>
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">Animation timeline for reveal + validation states.</div>
            </div>
          </article>
        </section>
      </div>
    </div>
  );
}
