"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { clearSession } from "@/lib/tokenStorage";

interface LogoutButtonProps {
  label?: string;
  className?: string;
}

export default function LogoutButton({ label = "Logout", className = "" }: LogoutButtonProps) {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleLogout = () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    clearSession();
    setTimeout(() => {
      router.replace("/issuer/login");
    }, 150);
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isSigningOut}
      className={`inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-rose-500 to-purple-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-rose-500/30 transition hover:from-rose-400 hover:to-purple-400 disabled:opacity-50 ${className}`}
    >
      <LogOut className="h-4 w-4" />
      {isSigningOut ? "Signing out..." : label}
    </button>
  );
}
