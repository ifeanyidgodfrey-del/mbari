import { prisma } from "@/lib/prisma";
import { fmtDual } from "@/lib/format";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const crew = await prisma.crewMember.findUnique({ where: { slug } });
  if (!crew) return { title: "Crew Not Found" };
  return {
    title: `${crew.name} — M'Bari`,
    description: crew.bio?.slice(0, 160) ?? `${crew.name} on M'Bari`,
  };
}

const D = {
  bgDeep: "#1a1812", bg: "#222018", bgCard: "#2a2720", bgElev: "#333028",
  border: "#4a4538", borderF: "#3a3530",
  hero: "#ede8dd", primary: "#c8c2b5", secondary: "#9a9488",
  muted: "#6a6560", dim: "#524e48",
  accent: "#b8985e", accentH: "#d4b870",
  green: "#5a7a5a", greenS: "rgba(90,122,90,0.14)",
};

const COUNTRY_NAME: Record<string, string> = {
  NG: "Nigeria", ZA: "South Africa", KE: "Kenya", GH: "Ghana",
  ET: "Ethiopia", CM: "Cameroon", TZ: "Tanzania", EG: "Egypt", MA: "Morocco",
};

function scoreColor(s: number) {
  return s >= 75 ? D.green : s >= 50 ? "#8a6a30" : "#7a3a3a";
}

export default async function CrewPage({ params }: Props) {
  const { slug } = await params;
  const crew = await prisma.crewMember.findUnique({
    where: { slug },
    include: {
      credits: { include: { film: true }, orderBy: { film: { year: "desc" } } },
    },
  });

  if (!crew) notFound();

  const totalFilms = crew.credits.length;
  const scores = crew.credits.map((c) => c.film.criticScore).filter((s): s is number => s != null);
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
  const combinedBox = crew.credits
    .map((c) => c.film.boxCumulative).filter((b): b is bigint => b != null)
    .reduce((a, b) => a + b, BigInt(0));

  // Group credits by role for column display
  const byRole: Record<string, typeof crew.credits> = {};
  for (const credit of crew.credits) {
    const role = credit.role;
    if (!byRole[role]) byRole[role] = [];
    byRole[role].push(credit);
  }
  // Sort films within each role by year desc
  for (const role of Object.keys(byRole)) {
    byRole[role].sort((a, b) => b.film.year - a.film.year);
  }
  // Role display order
  const ROLE_ORDER = ["Director","Writer","Screenplay","Producer","Executive Producer","Director of Photography","Cinematographer","Original Music Composer","Editor","Sound Designer","Costume Designer","Visual Effects Supervisor"];
  const roles = [
    ...ROLE_ORDER.filter((r) => byRole[r]),
    ...Object.keys(byRole).filter((r) => !ROLE_ORDER.includes(r)),
  ];
  // Also keep year span for hero
  const years = [...new Set(crew.credits.map((c) => c.film.year))].sort((a, b) => a - b);

  return (
    <div style={{ background: D.bgDeep, minHeight: "100vh", color: D.primary, fontFamily: "var(--font-sans, sans-serif)" }}>
      <style>{`
        .fg::after { content:''; position:fixed; inset:0; pointer-events:none; z-index:10000; opacity:0.25;
          background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)' opacity='0.08'/%3E%3C/svg%3E");
          background-size:200px 200px; }
      `}</style>
      <div className="fg">

      <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", minHeight: "72vh" }}>
        <div style={{ display:"flex", flexDirection:"column", justifyContent:"center", padding:"5rem 4rem 5rem 3rem", position:"relative" }}>
          <div style={{ position:"absolute", right:0, top:"12%", bottom:"12%", width:1, background:`linear-gradient(to bottom, transparent, ${D.border}, transparent)` }} />
          <Link href="/crew" style={{ display:"inline-flex", alignItems:"center", gap:"0.5rem", color:D.muted, fontSize:"0.62rem", letterSpacing:"0.14em", textTransform:"uppercase", textDecoration:"none", marginBottom:"3rem" }}>
            ← Crew Directory
          </Link>
          <div style={{ fontSize:"0.52rem", letterSpacing:"0.35em", textTransform:"uppercase", color:D.dim, marginBottom:"1.5rem" }}>
            M&apos;Bari · Crew Record
          </div>
          <div style={{ display:"flex", gap:"0.5rem", flexWrap:"wrap", marginBottom:"1rem" }}>
            {crew.roles.map((role) => (
              <span key={role} style={{ fontSize:"0.6rem", letterSpacing:"0.07em", textTransform:"uppercase", padding:"0.28rem 0.7rem", border:`1px solid ${D.accent}50`, color:D.accent, borderRadius:2 }}>{role}</span>
            ))}
            {crew.type === "craft" && (
              <span style={{ fontSize:"0.6rem", letterSpacing:"0.07em", textTransform:"uppercase", padding:"0.28rem 0.7rem", border:`1px solid ${D.green}`, color:D.green, background:D.greenS, borderRadius:2 }}>Craft Professional</span>
            )}
          </div>
          <h1 style={{ fontFamily:"var(--font-serif, Georgia, serif)", fontSize:"clamp(2.8rem, 5vw, 4.5rem)", fontWeight:400, lineHeight:1.02, color:D.hero, letterSpacing:"-0.01em", marginBottom:"0.7rem" }}>
            {crew.name}
          </h1>
          {years.length > 0 && (
            <div style={{ fontSize:"0.78rem", color:D.muted, fontStyle:"italic", fontFamily:"var(--font-serif, Georgia, serif)", marginBottom:"2rem" }}>
              Active {years[years.length - 1]}–{years[0]}
            </div>
          )}
          {crew.bio && (
            <p style={{ fontFamily:"var(--font-serif, Georgia, serif)", fontSize:"0.9rem", lineHeight:1.85, color:D.secondary, maxWidth:460, margin:0 }}>
              {crew.bio}
            </p>
          )}
          {crew.available && (
            <div style={{ marginTop:"2rem", display:"flex", alignItems:"center", gap:"0.7rem", border:`1px solid ${D.green}`, background:D.greenS, padding:"0.7rem 1.1rem", borderRadius:3 }}>
              <div style={{ width:7, height:7, borderRadius:"50%", background:D.green, boxShadow:`0 0 6px ${D.green}50` }} />
              <span style={{ fontSize:"0.75rem", color:D.primary }}><strong style={{ color:D.hero }}>Open to work</strong> — available for new projects</span>
            </div>
          )}
        </div>
        <div style={{ position:"relative", overflow:"hidden", background:D.bg }}>
          {crew.imageUrl ? (
            <>
              <Image src={crew.imageUrl} alt={crew.name} fill style={{ objectFit:"cover", objectPosition:"top" }} sizes="50vw" priority />
              <div style={{ position:"absolute", inset:0, background:`linear-gradient(to right, ${D.bgDeep} 0%, transparent 20%), linear-gradient(to top, ${D.bgDeep} 0%, transparent 25%)` }} />
            </>
          ) : (
            <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", textAlign:"center" }}>
              <div style={{ fontFamily:"var(--font-serif, Georgia, serif)", fontSize:"8rem", fontStyle:"italic", color:D.border, lineHeight:1 }}>{crew.name.charAt(0)}</div>
              <div style={{ fontSize:"0.55rem", letterSpacing:"0.25em", textTransform:"uppercase", color:D.dim, marginTop:"0.5rem" }}>Crew Profile</div>
            </div>
          )}
        </div>
      </section>

      <div style={{ display:"flex", borderTop:`1px solid ${D.borderF}`, borderBottom:`1px solid ${D.borderF}`, background:"#161614" }}>
        {[
          { label:"Films", value:String(totalFilms), sub:"total credits" },
          { label:"Avg Score", value:avgScore != null ? String(avgScore) : "—", sub:"critic consensus" },
          { label:"Combined Box Office", value:combinedBox > BigInt(0) ? fmtDual(combinedBox) : "—", sub:"career gross" },
        ].map(({ label, value, sub }, i) => (
          <div key={label} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"1.4rem 1rem", borderRight:i<2?`1px solid ${D.borderF}`:"none" }}>
            <div style={{ fontFamily:"var(--font-serif, Georgia, serif)", fontSize:i===2?"1rem":"1.35rem", color:D.hero, marginBottom:"0.15rem" }}>{value}</div>
            <div style={{ fontSize:"0.52rem", letterSpacing:"0.16em", textTransform:"uppercase", color:D.muted }}>{label}</div>
            <div style={{ fontSize:"0.48rem", color:D.dim, fontStyle:"italic", marginTop:"0.1rem" }}>{sub}</div>
          </div>
        ))}
      </div>

      {crew.awards.length > 0 && (
        <div style={{ maxWidth:940, margin:"3rem auto 0", padding:"0 3rem" }}>
          <div style={{ fontSize:"0.52rem", letterSpacing:"0.22em", textTransform:"uppercase", color:D.dim, marginBottom:"1rem" }}>Awards &amp; Recognition</div>
          <div style={{ display:"flex", flexDirection:"column", gap:1, background:D.borderF }}>
            {crew.awards.map((award, i) => (
              <div key={i} style={{ background:D.bgCard, padding:"0.9rem 1.4rem", fontFamily:"var(--font-serif, Georgia, serif)", fontSize:"0.88rem", color:D.secondary, borderLeft:`3px solid ${D.accent}` }}>{award}</div>
            ))}
          </div>
        </div>
      )}

      <div style={{ maxWidth:1100, margin:"3rem auto 0", padding:"0 3rem 5rem" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"2rem", paddingBottom:"1rem", borderBottom:`1px solid ${D.borderF}` }}>
          <h2 style={{ fontFamily:"var(--font-serif, Georgia, serif)", fontSize:"1.4rem", fontWeight:400, color:D.hero, margin:0 }}>Filmography</h2>
          <span style={{ fontSize:"0.62rem", letterSpacing:"0.1em", textTransform:"uppercase", color:D.muted }}>{totalFilms} {totalFilms===1?"credit":"credits"} · by role</span>
        </div>
        {/* Role columns */}
        <div style={{ display:"grid", gridTemplateColumns:`repeat(${Math.min(roles.length, 3)}, 1fr)`, gap:"2rem", alignItems:"start" }}>
          {roles.map((role) => (
            <div key={role}>
              {/* Role header */}
              <div style={{ fontSize:"0.52rem", letterSpacing:"0.22em", textTransform:"uppercase", color:D.accent, marginBottom:"1rem", paddingBottom:"0.5rem", borderBottom:`1px solid ${D.border}` }}>
                {role}
              </div>
              {/* Films in this role */}
              <div style={{ display:"flex", flexDirection:"column", gap:"0.1rem" }}>
                {byRole[role].map((credit) => (
                  <div key={credit.id} style={{ display:"flex", gap:"0.75rem", alignItems:"flex-start", padding:"0.75rem 0", borderBottom:`1px solid ${D.borderF}` }}>
                    <div style={{ width:36, height:52, flexShrink:0, background:D.bgElev, position:"relative", overflow:"hidden", border:`1px solid ${D.border}` }}>
                      {credit.film.posterUrl ? (
                        <Image src={credit.film.posterUrl} alt={credit.film.title} fill style={{ objectFit:"cover" }} sizes="36px" />
                      ) : (
                        <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center" }}>
                          <span style={{ fontFamily:"var(--font-serif, Georgia, serif)", fontSize:"1rem", color:D.muted }}>{credit.film.title.charAt(0)}</span>
                        </div>
                      )}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <Link href={`/film/${credit.film.slug}`} style={{ fontFamily:"var(--font-serif, Georgia, serif)", fontSize:"0.92rem", color:D.primary, textDecoration:"none", display:"block", lineHeight:1.25, marginBottom:"0.2rem" }}>{credit.film.title}</Link>
                      <div style={{ fontSize:"0.65rem", color:D.muted }}>
                        {credit.film.year}{credit.film.country && ` · ${COUNTRY_NAME[credit.film.country] ?? credit.film.country}`}
                      </div>
                      {credit.film.criticScore != null && (
                        <div style={{ marginTop:"0.3rem" }}>
                          <span style={{ background:scoreColor(credit.film.criticScore), color:"#fff", fontSize:"0.72rem", fontWeight:700, fontFamily:"var(--font-serif, Georgia, serif)", padding:"1px 6px" }}>{credit.film.criticScore}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <footer style={{ borderTop:`1px solid ${D.borderF}`, padding:"2.2rem 3rem", display:"flex", justifyContent:"space-between", alignItems:"center", maxWidth:940, margin:"0 auto" }}>
        <div style={{ fontSize:"0.58rem", letterSpacing:"0.14em", textTransform:"uppercase", color:D.dim }}>M&apos;Bari Film Archive — {new Date().getFullYear()}</div>
        <div style={{ display:"flex", gap:"1.4rem" }}>
          {[["Films","/films"],["Cast","/cast"],["Crew","/crew"],["Events","/events"]].map(([label, href]) => (
            <Link key={href} href={href} style={{ fontSize:"0.58rem", color:D.muted, textDecoration:"none", letterSpacing:"0.06em" }}>{label}</Link>
          ))}
        </div>
      </footer>

      </div>
    </div>
  );
}
