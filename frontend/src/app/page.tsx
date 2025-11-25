import Link from "next/link";

const navLinks = [
  { label: "Platform", href: "#platform" },
  { label: "Solutions", href: "#solutions" },
  { label: "Security", href: "#security" },
  { label: "Resources", href: "#resources" },
];

const stats = [
  { label: "Credentials issued", value: "12M+" },
  { label: "Trusted issuers", value: "1,200+" },
  { label: "Verification SLA", value: "< 2s" },
];

const features = [
  {
    badge: "01",
    title: "Immutable credentialing",
    description:
      "Anchor every certificate on-chain with quantum-safe signatures, revocation controls, and issuer attestation layers.",
  },
  {
    badge: "02",
    title: "Adaptive verification",
    description:
      "API-first verification widgets embed into any portal, auto-detect anomalies, and trigger smart compliance workflows.",
  },
  {
    badge: "03",
    title: "Intelligent identity graph",
    description:
      "Correlate graduate, employee, and vendor credentials into a private knowledge graph that surfaces fraud risk in real-time.",
  },
];

const testimonials = [
  {
    quote:
      "BlockCertify helped us issue 40,000 verified diplomas in under a week while maintaining airtight compliance across five geographies.",
    name: "Meera R., Chief Digital Officer",
    company: "GlobalEd Alliance",
  },
  {
    quote:
      "Verification dropped from days to seconds. Our HR stack now trusts a single source of truth for every credentialed hire.",
    name: "Derrick Chu, VP Talent",
    company: "Northstar Finance",
  },
];

const workflow = [
  {
    title: "Register & verify domain",
    description: "Authenticate your institution via official email or DNS TXT, then configure issuer policies.",
  },
  {
    title: "Design credential templates",
    description: "Drag-and-drop issuer seals, metadata schemas, micro-animations, and smart expiry rules.",
  },
  {
    title: "Issue & monitor",
    description: "Stream credentials via dashboard or API, watch live verification heatmaps, and revoke with one click.",
  },
];

const resources = [
  { title: "Security brief", href: "#" },
  { title: "Zero-trust architecture", href: "#" },
  { title: "API documentation", href: "#" },
  { title: "Case studies", href: "#" },
];

export default function Home() {
  return (
    <div className="relative min-h-screen bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/2 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-blue-500/20 blur-[160px]" />
        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-indigo-500/10 blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-8 lg:px-12">
        <header className="flex flex-col gap-6 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 text-xl font-bold">
              BC
            </div>
            <div>
              <p className="text-base font-semibold tracking-wide text-white">BlockCertify</p>
              <p className="text-sm text-slate-300">Enterprise Credential Cloud</p>
            </div>
          </div>

          <nav className="flex flex-wrap items-center gap-4 text-sm text-slate-200">
            {navLinks.map(link => (
              <a key={link.label} href={link.href} className="transition hover:text-white">
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/company-registration"
              className="rounded-2xl border border-white/30 px-4 py-2 text-sm font-semibold text-white transition hover:border-white hover:bg-white/10"
            >
              Sign in
            </Link>
            <Link
              href="/company-registration"
              className="rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-400 px-5 py-2.5 text-sm font-semibold text-slate-900 shadow-lg shadow-blue-500/30 transition hover:from-blue-400 hover:to-cyan-300"
            >
              Book a live demo
            </Link>
          </div>
        </header>

        <main className="mt-12 flex flex-1 flex-col gap-24 pb-16">
          <section className="grid gap-12 rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl lg:grid-cols-2" id="platform">
            <div className="space-y-8">
              <p className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-200">
                Web3 native credentials
              </p>
              <div>
                <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl">
                  Ship verifiable credentials in minutes, not months.
                </h1>
                <p className="mt-4 text-lg text-slate-200">
                  BlockCertify unifies issuance, verification, and lifecycle governance so universities, enterprises, and governments can deliver tamper-proof trust in a single workspace.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/company-registration"
                  className="rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 px-6 py-3 font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:from-blue-400 hover:to-indigo-400"
                >
                  Create an issuer account
                </Link>
                <a
                  href="#resources"
                  className="rounded-2xl border border-white/20 px-6 py-3 font-semibold text-white transition hover:border-white"
                >
                  Explore documentation
                </a>
              </div>

              <dl className="grid gap-6 sm:grid-cols-3">
                {stats.map(stat => (
                  <div key={stat.label} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-center">
                    <dd className="text-3xl font-semibold text-white">{stat.value}</dd>
                    <dt className="mt-1 text-xs uppercase tracking-widest text-slate-400">{stat.label}</dt>
                  </div>
                ))}
              </dl>
            </div>

            <div className="relative h-full rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 p-8">
              <div className="absolute inset-4 rounded-3xl border border-dashed border-white/20" />
              <div className="relative z-10 space-y-6">
                <p className="text-sm uppercase tracking-[0.5em] text-slate-500">Live network</p>
                <div className="space-y-4">
                  {stats.map(stat => (
                    <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs text-slate-400">{stat.label}</p>
                      <p className="text-2xl font-semibold text-white">{stat.value}</p>
                    </div>
                  ))}
                </div>
                <div className="rounded-2xl border border-emerald-400/40 bg-emerald-400/10 p-4">
                  <p className="text-sm text-emerald-200">Realtime verification feed</p>
                  <ul className="mt-3 space-y-2 text-sm text-emerald-100">
                    <li>• 248 diplomas validated (APAC)</li>
                    <li>• 62 partner badges activated</li>
                    <li>• 0 fraudulent attempts detected</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          <section id="solutions" className="space-y-10">
            <div className="flex flex-col gap-4">
              <p className="text-sm font-semibold uppercase tracking-[0.4em] text-blue-300">Solutions</p>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <h2 className="text-3xl font-semibold">Designed for regulated issuers</h2>
                <p className="max-w-2xl text-slate-300">
                  Whether you manage alumni diplomas, workforce certifications, or vendor compliance badges, BlockCertify brings signature-grade security with flexible UX.
                </p>
              </div>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {features.map(feature => (
                <article key={feature.title} className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/30">
                  <span className="text-sm font-semibold text-blue-300">{feature.badge}</span>
                  <h3 className="mt-3 text-xl font-semibold text-white">{feature.title}</h3>
                  <p className="mt-3 text-sm text-slate-300">{feature.description}</p>
                </article>
              ))}
            </div>
          </section>

          <section id="security" className="grid gap-8 rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 p-8 lg:grid-cols-2">
            <div className="space-y-4">
              <p className="text-sm font-semibold uppercase tracking-[0.4em] text-emerald-300">Workflow</p>
              <h2 className="text-3xl font-semibold">From verification to issuance in three steps</h2>
              <p className="text-slate-300">
                Every stage is hardened with role-based access, ledger proofs, and automated compliance evidence you can export anytime.
              </p>
            </div>
            <div className="space-y-5">
              {workflow.map((step, index) => (
                <div key={step.title} className="flex gap-4 rounded-2xl border border-white/10 bg-white/5 p-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-b from-blue-500 to-indigo-500 text-lg font-semibold text-white">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{step.title}</h3>
                    <p className="text-sm text-slate-300">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-6" id="resources">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.4em] text-cyan-300">Customer proof</p>
                <h2 className="text-3xl font-semibold">Loved by digital trust teams</h2>
              </div>
              <div className="flex gap-3">
                {resources.map(resource => (
                  <a key={resource.title} href={resource.href} className="rounded-2xl border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:border-white">
                    {resource.title}
                  </a>
                ))}
              </div>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {testimonials.map(testimonial => (
                <figure key={testimonial.name} className="rounded-3xl border border-white/10 bg-white/5 p-6">
                  <blockquote className="text-lg text-slate-100">
                    “{testimonial.quote}”
                  </blockquote>
                  <figcaption className="mt-4 text-sm text-slate-300">
                    {testimonial.name} · {testimonial.company}
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-gradient-to-r from-blue-600 via-indigo-600 to-slate-900 p-8 text-center shadow-xl">
            <p className="text-sm uppercase tracking-[0.5em] text-white/70">Get started</p>
            <h2 className="mt-3 text-3xl font-semibold text-white">Verify your organization in under 5 minutes.</h2>
            <p className="mt-3 text-slate-100">
              Join the fastest-growing network of credential issuers. Your first 1,000 verifications are on us.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-4">
              <Link
                href="/company-registration"
                className="rounded-2xl bg-white px-6 py-3 text-base font-semibold text-slate-900 shadow-lg shadow-white/30 transition hover:bg-slate-100"
              >
                Launch console
              </Link>
              <a
                href="mailto:hello@blockcertify.com"
                className="rounded-2xl border border-white/40 px-6 py-3 text-base font-semibold text-white transition hover:border-white"
              >
                Talk to security team
              </a>
            </div>
          </section>
        </main>

        <footer className="mt-auto border-t border-white/10 pt-6 text-xs text-slate-400">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <p>© {new Date().getFullYear()} BlockCertify Labs. All rights reserved.</p>
            <div className="flex gap-4">
              <a href="#privacy" className="hover:text-white">
                Privacy
              </a>
              <a href="#terms" className="hover:text-white">
                Terms
              </a>
              <a href="#security" className="hover:text-white">
                Security
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
