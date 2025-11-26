"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  BadgeCheck,
  ChartBarStacked,
  ShieldCheck,
  Zap,
} from "lucide-react";
import LogoutButton from "@/components/LogoutButton";
import ExperienceFooter from "@/components/ExperienceFooter";
import { getToken } from "@/lib/tokenStorage";
import IssuerNav from "@/components/IssuerNav";

const unlockedFeatures = [
  {
    icon: <BadgeCheck className="h-5 w-5 text-emerald-400" />,
    title: "Instant credential issuance",
    description:
      "Spin up issuer templates, automate approvals, and mint to the ledger with audit trails by default.",
    href: "/credentials",
  },
  {
    icon: <ShieldCheck className="h-5 w-5 text-blue-400" />,
    title: "Live verification fabric",
    description:
      "Share branded verification widgets, monitor anomaly alerts, and revoke compromised docs in seconds.",
    href: "/verifications",
  },
  {
    icon: <ChartBarStacked className="h-5 w-5 text-indigo-400" />,
    title: "Network intelligence",
    description:
      "See credential adoption heatmaps, SLA attainment, and fraud scores across every channel.",
    href: "/analytics",
  },
];

const stats = [
  { label: "Issuer seats", value: "25", meta: "+3 new" },
  { label: "Credentials ready", value: "128", meta: "4 templates" },
  { label: "Verification SLA", value: "1.7s", meta: "100% uptime" },
  { label: "Trust score", value: "99.4", meta: "+1.2 this week" },
];

export default function DashboardPage() {
  const router = useRouter();
  const [headline, setHeadline] = useState("");
  const headlineText = "Welcome back, your workspace is unlocked.";

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/issuer/login");
    }
  }, [router]);

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      setHeadline(headlineText.slice(0, index + 1));
      index += 1;
      if (index >= headlineText.length) {
        clearInterval(interval);
      }
    }, 35);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950">
      <IssuerNav />
      <div className="relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.18),_rgba(2,6,23,0.95))]" />
        <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col gap-10 px-6 pb-10 pt-20 lg:px-12">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-blue-400">Dashboard</p>
            <h1 className="mt-1 text-3xl font-semibold text-white typewriter">
              {headline}
              <span className="typewriter-caret" />
            </h1>
            <p className="mt-2 text-sm text-slate-300">
              Use the quick actions below to start issuing tamper-proof credentials and monitor verification health.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/issuer/issue"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:border-white"
            >
              Issue credential <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Link
              href="/verifications"
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/30"
            >
              Verify PDF feed
            </Link>
            <Link
              href="/revocations"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-4 py-2 text-sm font-semibold text-white/80 transition hover:border-white"
            >
              Revoke access
            </Link>
            <LogoutButton />
          </div>
        </header>

        <section className="grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 text-white shadow-xl shadow-black/40 lg:grid-cols-3">
          <article className="rounded-2xl border border-white/10 bg-black/20 p-4 lg:col-span-2">
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Unlocked workspace</p>
            <h2 className="mt-2 text-2xl font-semibold">Your credential fabric is live.</h2>
            <p className="mt-2 text-sm text-slate-300">
              Jump to issuance, verification, or revocation flows without digging through menus. These quick actions stay
              pinned for every issuer once authenticated.
            </p>
          </article>
          <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
            {[
              { label: "Launch Issuer", href: "/issuer/issue" },
              { label: "Verify PDFs", href: "/verifications" },
              { label: "Manage Revocations", href: "/revocations" },
            ].map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-semibold text-white/90 transition hover:bg-white/20"
              >
                {action.label}
              </Link>
            ))}
          </div>
        </section>

        <section className="grid gap-5 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl sm:grid-cols-2 lg:grid-cols-4 moving-border">
          {stats.map((stat) => (
            <article key={stat.label} className="rounded-2xl border border-white/5 bg-black/10 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{stat.label}</p>
              <p className="mt-2 text-3xl font-semibold text-white">{stat.value}</p>
              <p className="text-xs text-slate-400">{stat.meta}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          {unlockedFeatures.map((feature) => (
            <article key={feature.title} className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/30 moving-border">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-black/40 p-3">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-white">{feature.title}</h3>
              </div>
              <p className="mt-4 text-sm text-slate-300">{feature.description}</p>
              <Link
                href={feature.href}
                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-sky-300 transition hover:text-white"
              >
                Go to workspace <ArrowUpRight className="h-4 w-4" />
              </Link>
            </article>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <article className="rounded-3xl border border-white/10 bg-gradient-to-br from-blue-600/30 to-indigo-700/30 p-6 moving-border">
            <div className="flex items-center gap-3 text-white">
              <Zap className="h-5 w-5" />
              <span className="text-sm font-semibold uppercase tracking-[0.4em]">Next steps</span>
            </div>
            <h3 className="mt-4 text-2xl font-semibold text-white">Finish onboarding in under 10 minutes.</h3>
            <ol className="mt-4 space-y-3 text-sm text-slate-100">
              <li>① Invite issuer teammates & assign roles.</li>
              <li>② Upload your first credential template.</li>
              <li>③ Connect HRIS or SIS webhook for automated issuance.</li>
            </ol>
            <Link
              href="/settings"
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-white/90 hover:text-white"
            >
              Open workspace settings <ArrowUpRight className="h-4 w-4" />
            </Link>
          </article>

          <article className="rounded-3xl border border-white/10 bg-white/5 p-6 moving-border">
            <div className="flex items-center justify-between text-sm text-slate-400">
              <span>Live verification queue</span>
              <span>Updated just now</span>
            </div>
            <div className="mt-6 space-y-4 text-sm text-slate-200">
              {[
                { region: "APAC University", status: "248 credentials auto-verified" },
                { region: "Northwind Finance", status: "62 onboarding badges issued" },
                { region: "GovCloud", status: "0 anomalies flagged" },
              ].map((item) => (
                <div key={item.region} className="rounded-2xl border border-white/5 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.4em] text-slate-400">{item.region}</p>
                  <p className="text-base text-white">{item.status}</p>
                </div>
              ))}
            </div>
          </article>
        </section>
        <ExperienceFooter />
        </div>
      </div>
    </div>
  );
}
