const spotlightLinks = [
  {
    title: "Platform",
    items: [
      { label: "Issuer console", href: "/dashboard" },
      { label: "Templates", href: "/credentials" },
      { label: "Verification desk", href: "/verifications" },
    ],
  },
  {
    title: "Company",
    items: [
      { label: "Security brief", href: "#security" },
      { label: "Compliance", href: "#compliance" },
      { label: "Careers", href: "#careers" },
    ],
  },
  {
    title: "Resources",
    items: [
      { label: "API docs", href: "#resources" },
      { label: "Case studies", href: "#resources" },
      { label: "Status", href: "https://status.blockcertify.com" },
    ],
  },
];

export default function ExperienceFooter() {
  return (
    <footer className="mt-16 rounded-3xl border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8 text-white shadow-[0_10px_60px_rgba(15,23,42,0.55)]">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.5em] text-sky-300">BlockCertify</p>
          <h2 className="text-3xl font-semibold">Trust infrastructure for verified credentials.</h2>
          <p className="text-sm text-slate-300">
            Issue, monitor, and verify tamper-proof documents with live compliance evidence, revocation telemetry, and
            embedded analytics.
          </p>
          <div className="flex flex-wrap gap-4 text-sm text-slate-300">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-slate-500">SLA</p>
              <p className="text-lg font-semibold text-white">99.99%</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Active verifiers</p>
              <p className="text-lg font-semibold text-white">42k+</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Latency</p>
              <p className="text-lg font-semibold text-white">&lt; 2s avg</p>
            </div>
          </div>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-center">
          <p className="text-sm uppercase tracking-[0.4em] text-white/70">Need a guided tour?</p>
          <h3 className="mt-3 text-xl font-semibold">Book a zero-trust architecture review.</h3>
          <p className="mt-2 text-sm text-slate-200">Security team replies within 24h.</p>
          <a
            href="mailto:hello@blockcertify.com"
            className="mt-5 inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-400 px-6 py-2.5 text-sm font-semibold text-slate-900 shadow-lg shadow-blue-500/40 transition hover:from-blue-400 hover:to-cyan-300"
          >
            Talk to us
          </a>
        </div>
      </div>

      <div className="mt-10 grid gap-8 border-t border-white/10 pt-8 text-sm text-slate-300 sm:grid-cols-2 lg:grid-cols-4">
        {spotlightLinks.map((section) => (
          <div key={section.title}>
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-500">{section.title}</p>
            <ul className="mt-3 space-y-2">
              {section.items.map((item) => (
                <li key={item.label}>
                  <a href={item.href} className="transition hover:text-white">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-slate-200">
          <p className="text-[11px] uppercase tracking-[0.4em] text-white/70">Audit-ready</p>
          <p className="mt-2 text-slate-100">SOC 2 • ISO 27001 • GDPR • FERPA • HIPAA (BAA)</p>
          <p className="mt-3 text-[11px] text-slate-400">
            © {new Date().getFullYear()} BlockCertify Labs. Crafted across Mumbai, London, and Singapore.
          </p>
        </div>
      </div>
    </footer>
  );
}
