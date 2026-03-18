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

const ROLE_ORDER = [
  "Director","Writer","Screenplay","Producer","Executive Producer",
  "Director of Photography","Cinematographer","Original Music Composer",
  "Editor","Sound Designer","Costume Designer","Visual Effects Supervisor",
];

// Brief one-line descriptions per skill/role
const ROLE_DESC: Record<string, string> = {
  "Director":                    "Visual storytelling & shot composition",
  "Writer":                      "Screenplay & narrative development",
  "Screenplay":                  "Script & dialogue craft",
  "Producer":                    "Production oversight & financing",
  "Executive Producer":          "Strategic production leadership",
  "Director of Photography":     "Cinematography & lighting design",
  "Cinematographer":             "Camera operation & visual language",
  "Original Music Composer":     "Score composition & sound design",
  "Editor":                      "Post-production & pacing",
  "Sound Designer":              "Audio design & mixing",
  "Costume Designer":            "Wardrobe & character aesthetics",
  "Visual Effects Supervisor":   "VFX pipeline & compositing",
};

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

  // Group credits by role
  const byRole: Record<string, typeof crew.credits> = {};
  for (const credit of crew.credits) {
    if (!byRole[credit.role]) byRole[credit.role] = [];
    byRole[credit.role].push(credit);
  }
  for (const role of Object.keys(byRole)) {
    byRole[role].sort((a, b) => b.film.year - a.film.year);
  }
  const roles = [
    ...ROLE_ORDER.filter((r) => byRole[r]),
    ...Object.keys(byRole).filter((r) => !ROLE_ORDER.includes(r)),
  ];

  const yearSpan = [...new Set(crew.credits.map((c) => c.film.year))].sort((a, b) => a - b);

  // Skills = unique roles (the person's specialisations)
  const skills = crew.roles.length > 0 ? crew.roles : roles;

  return (
    <div style={{ background: D.bgDeep, minHeight: "100vh", color: D.primary, fontFamily: "var(--font-sans, sans-serif)" }}>
      <style>{`
        .fg::after { content:''; position:fixed; inset:0; pointer-events:none; z-index:10000; opacity:0.25;
          background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)' opacity='0.08'/%3E%3C/svg%3E");
          background-size:200px 200px; }
        details > summary { list-style: none; }
        details > summary::-webkit-details-marker { display: none; }
        details[open] .chevron { transform: rotate(90deg); }
        .chevron { display: inline-block; transition: transform 0.18s ease; margin-left: 8px; opacity: 0.5; }
        details > summary:hover .role-header-label { color: ${D.accentH}; }
      `}</style>
      <div className="fg">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", minHeight: "72vh" }}>
        <div style={{ display:"flex", flexDirection:"column", justifyContent:"center", padding:"5rem 4rem 5rem 3rem", position:"relative" }}>
          <div style={{ position:"absolute", right:0, top:"12%", bottom:"12%", width:1, background:`linear-gradient(to bottom, transparent, ${D.border}, transparent)` }} />
          <Link href="/crew" style={{ display:"inline-flex", alignItems:"center", gap:"0.5rem", color:D.muted, fontSize:"0.62rem", letterSpacing:"0.14em", textTransform:"uppercase", textDecoration:"none", marginBottom:"3rem" }}>
            ← Crew Directory
          </Link>
          <div style={{ fontSize:"0.52rem", letterSpacing:"0.35em", textTransform:"uppercase", color:D.dim, marginBottom:"1.5rem" }}>
            M&apos;Bari · Crew Record
          </div>
          <h1 style={{ fontFamily:"var(--font-serif, Georgia, serif)", fontSize:"clamp(2.8rem, 5vw, 4.5rem)", fontWeight:400, lineHeight:1.02, color:D.hero, letterSpacing:"-0.01em", marginBottom:"0.7rem" }}>
            {crew.name}
          </h1>
          {yearSpan.length > 0 && (
            <div style={{ fontSize:"0.78rem", color:D.muted, fontStyle:"italic", fontFamily:"var(--font-serif, Georgia, serif)", marginBottom:"2rem" }}>
              Active {yearSpan[0]}–{yearSpan[yearSpan.length - 1]}
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

      {/* ── Stats bar ─────────────────────────────────────────────────────── */}
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

      <div style={{ maxWidth:1100, margin:"0 auto", padding:"0 3rem" }}>

        {/* ── Skills columns ────────────────────────────────────────────────── */}
        <div style={{ paddingTop:"3rem", marginBottom:"3rem" }}>
          <div style={{ fontSize:"0.52rem", letterSpacing:"0.22em", textTransform:"uppercase", color:D.dim, marginBottom:"1.5rem" }}>
            Skills &amp; Specialisations
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: `repeat(${Math.min(skills.length, 4)}, 1fr)`,
            gap: 1,
            background: D.borderF,
          }}>
            {skills.map((skill) => (
              <div key={skill} style={{
                background: D.bgCard,
                padding: "1.4rem 1.6rem",
                borderLeft: `3px solid ${D.accent}`,
              }}>
                <div style={{
                  fontFamily: "var(--font-serif, Georgia, serif)",
                  fontSize: "0.9rem",
                  color: D.hero,
                  marginBottom: "0.45rem",
                  fontWeight: 400,
                }}>
                  {skill}
                </div>
                <div style={{ fontSize: "0.68rem", color: D.muted, lineHeight: 1.55 }}>
                  {ROLE_DESC[skill] ?? "Film production"}
                </div>
                {byRole[skill] && (
                  <div style={{ fontSize: "0.58rem", color: D.accent, marginTop: "0.6rem", letterSpacing: "0.06em" }}>
                    {byRole[skill].length} {byRole[skill].length === 1 ? "credit" : "credits"}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Awards ────────────────────────────────────────────────────────── */}
        {crew.awards.length > 0 && (
          <div style={{ marginBottom:"3rem" }}>
            <div style={{ fontSize:"0.52rem", letterSpacing:"0.22em", textTransform:"uppercase", color:D.dim, marginBottom:"1rem" }}>Awards &amp; Recognition</div>
            <div style={{ display:"flex", flexDirection:"column", gap:1, background:D.borderF }}>
              {crew.awards.map((award, i) => (
                <div key={i} style={{ background:D.bgCard, padding:"0.9rem 1.4rem", fontFamily:"var(--font-serif, Georgia, serif)", fontSize:"0.88rem", color:D.secondary, borderLeft:`3px solid ${D.accent}` }}>{award}</div>
              ))}
            </div>
          </div>
        )}

        {/* ── Filmography ── accordion rows per role ────────────────────────── */}
        <div style={{ paddingBottom: "5rem" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"1.5rem", paddingBottom:"1rem", borderBottom:`1px solid ${D.borderF}` }}>
            <h2 style={{ fontFamily:"var(--font-serif, Georgia, serif)", fontSize:"1.4rem", fontWeight:400, color:D.hero, margin:0 }}>Filmography</h2>
            <span style={{ fontSize:"0.62rem", letterSpacing:"0.1em", textTransform:"uppercase", color:D.muted }}>{totalFilms} {totalFilms===1?"credit":"credits"} · click role to expand</span>
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:1, background:D.borderF }}>
            {roles.map((role, ri) => (
              <details key={role} open={ri === 0}>
                {/* Role header — clickable */}
                <summary style={{
                  background: D.bgCard,
                  padding: "1rem 1.4rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  userSelect: "none",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <span className="role-header-label" style={{
                      fontFamily: "var(--font-serif, Georgia, serif)",
                      fontSize: "0.95rem",
                      color: D.accent,
                      transition: "color 0.15s",
                    }}>
                      {role}
                    </span>
                    <span style={{ fontSize:"0.58rem", letterSpacing:"0.1em", textTransform:"uppercase", color:D.muted }}>
                      {byRole[role].length} {byRole[role].length === 1 ? "film" : "films"}
                    </span>
                  </div>
                  <span className="chevron" style={{ fontSize: "0.75rem", color: D.accent }}>▶</span>
                </summary>

                {/* Films in this role — rows */}
                <div style={{ background: D.bg }}>
                  {byRole[role].map((credit, i) => (
                    <div key={credit.id} style={{
                      display:"flex", gap:"1rem", alignItems:"center",
                      padding:"0.9rem 1.4rem",
                      borderBottom: i < byRole[role].length - 1 ? `1px solid ${D.borderF}` : "none",
                    }}>
                      {/* Poster thumbnail */}
                      <div style={{ width:36, height:52, flexShrink:0, background:D.bgElev, position:"relative", overflow:"hidden", border:`1px solid ${D.border}` }}>
                        {credit.film.posterUrl ? (
                          <Image src={credit.film.posterUrl} alt={credit.film.title} fill style={{ objectFit:"cover" }} sizes="36px" />
                        ) : (
                          <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center" }}>
                            <span style={{ fontFamily:"var(--font-serif, Georgia, serif)", fontSize:"1rem", color:D.muted }}>{credit.film.title.charAt(0)}</span>
                          </div>
                        )}
                      </div>
                      {/* Year */}
                      <div style={{ width:48, flexShrink:0, fontFamily:"var(--font-serif, Georgia, serif)", fontSize:"0.82rem", color:D.accent }}>{credit.film.year}</div>
                      {/* Title + country */}
                      <div style={{ flex:1, minWidth:0 }}>
                        <Link href={`/film/${credit.film.slug}`} style={{ fontFamily:"var(--font-serif, Georgia, serif)", fontSize:"0.92rem", color:D.primary, textDecoration:"none", display:"block", lineHeight:1.25, marginBottom:"0.2rem" }}>
                          {credit.film.title}
                        </Link>
                        <div style={{ fontSize:"0.65rem", color:D.muted }}>
                          {COUNTRY_NAME[credit.film.country] ?? credit.film.country}
                          {credit.film.genres.length > 0 && (
                            <span style={{ marginLeft:8 }}>
                              {credit.film.genres.slice(0,2).map((g, i) => (
                                <span key={g}>
                                  {i > 0 && <span style={{ margin:"0 4px", opacity:0.4 }}>·</span>}
                                  {g}
                                </span>
                              ))}
                            </span>
                          )}
                        </div>
                      </div>
                      {/* Score + box */}
                      <div style={{ flexShrink:0, textAlign:"right", display:"flex", flexDirection:"column", gap:4, alignItems:"flex-end" }}>
                        {credit.film.criticScore != null && (
                          <span style={{ background:scoreColor(credit.film.criticScore), color:"#fff", fontSize:"0.78rem", fontWeight:700, fontFamily:"var(--font-serif, Georgia, serif)", padding:"2px 8px" }}>
                            {credit.film.criticScore}
                          </span>
                        )}
                        {credit.film.boxCumulative != null && (
                          <div style={{ fontSize:"0.65rem", color:D.accent }}>{fmtDual(credit.film.boxCumulative, credit.film.country)}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            ))}
          </div>
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
