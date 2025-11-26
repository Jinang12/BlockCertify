"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield } from "lucide-react";
import LogoutButton from "@/components/LogoutButton";

const NAV_LINKS = [
  { href: "/dashboard", label: "Workspace" },
  { href: "/issuer/issue", label: "Issue" },
  { href: "/verifications", label: "Verify" },
  { href: "/revocations", label: "Revoke" },
  { href: "/settings", label: "Settings" },
];

function isActivePath(current: string, target: string) {
  if (current === target) return true;
  if (target === "/" || target === "") return current === target;
  return current.startsWith(`${target}/`);
}

export default function IssuerNav() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-40 border-b border-white/5 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-6 py-4">
        <Link href="/dashboard" className="flex items-center gap-2 text-white">
          <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-sky-500/20 text-sky-200">
            <Shield className="h-5 w-5" />
          </span>
          <div className="text-left">
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Issuer</p>
            <p className="text-sm font-semibold">BlockCertify Console</p>
          </div>
        </Link>

        <div className="flex flex-1 flex-wrap items-center justify-center gap-2 text-sm">
          {NAV_LINKS.map((link) => {
            const active = isActivePath(pathname ?? "", link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-2xl px-4 py-2 font-semibold transition ${
                  active
                    ? "bg-white/15 text-white shadow-inner shadow-white/20"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        <div className="ml-auto flex w-full justify-end sm:w-auto">
          <LogoutButton className="w-full justify-center sm:w-auto" label="Sign out" />
        </div>
      </div>
    </nav>
  );
}
