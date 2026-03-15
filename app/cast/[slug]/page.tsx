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
  const actor = await prisma.actor.findUnique({ where: { slug } });
  if (!actor) return { title: "Actor Not Found" };
  return {
    title: `${actor.name} — M'Bari`,
    description: actor.bio?.slice(0, 160) ?? `${actor.name} on M'Bari`,
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

export default async function ActorPage({ params }: Props) {
  const { slug } = await params;
  const actor = await prisma.actor.findUnique({
    where: { slug },
    include: {
      credits: { include: { film: true }, orderBy: { film: { year: "desc" } } },
    },
  });

  if (!actor) notFound();

  const totalFilms = actor.credits.length;
  const scores = actor.credits.map((c) => c.film.criticScore).filter((s): s is number => s != null);
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
  const combinedBox = actor.credits
    .map((c) => c.film.boxCumulative).filter((b): b is bigint => b != null)
    .reduce((a, b) => a + b, BigInt(0));

  const byYear: Record<number, typeof actor.credits> = {};
  for (const credit of actor.credits) {
    const yr = credit.film.year;
    if (!byYear[yr]) byYear[yr] = [];
    byYear[yr].push(credit);
  }
  const years = Object.keys(byYear).map(Number).sort((a, b) => b - a);

  return (
    <div style={{ background: D.bgDeep, minHeight: "100vh", color: D.primary, fontFamily: "var(--font-sans, sans-serif)" }}>
      <style>{`
        .fg::after { content:''; position:fixed; inset:0; pointer-events:none; z-index:10000; opacity:0.25;
          background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)' opacity='0.08'/%3E%3C/svg%3E");
          background-size:200px 200px; }
      `}</style>
      <div className="fg">

      <section style={{ display:"grid", gridTemplateColumns:"1fr 1fr", minHeight:"72vh" }}>
        <div style={{ display:"flex", flexDirection:"column", justifyContent:"center", padding:"5rem 4rem 5rem 3rem", position:"relative" }}>
          <div style={{ position:"absolute", right:0, top:"12%", bottom:"12%", width:1, background:`linear-gradient(to bottom, transparent, ${D.border}, transparent)` }} />
          <Link href="/cast" style={{ display:"inline-flex", alignItems:"center", color:D.muted, fontSize:"0.62rem", letterSpacing:"0.14em", textTransform:"uppercase", textDecoration:"none", marginBottom:"3rem" }}>
            ← Cast Directory
          </Link>
          <div style={{ fontSize:"0.52rem", letterSpacing:"0.35em", textTransform:"uppercase", color:D.dim, marginBottom:"1.5rem" }}>M&apos;Bari · Cast Record</div>
          <div style={{ display:"flex", gap:"0.5rem", flexWrap:"wrap", marginBottom:"1rem" }}>
            <span style={{ fontSize:"0.6rem", letterSpacing:"0.07em", textTransform:"uppercase", padding:"0.28rem 0.7rem", border:`1px solid ${D.accent}50`, color:D.accent, borderRadius:2 }}>Actor</span>
            {actor.nationality && (
              <span style={{ fontSize:"0.6rem", letterSpacing:"0.07em", textTransform:"uppercase", padding:"0.28rem 0.7rem", border:`1px solid ${D.border}`, color:D.muted, borderRadius:2 }}>
                {COUNTRY_NAME[actor.nationality] ?? actor.nationality}
              </span>
            )}
          </div>
          <h1 style={{ fontFamily:"var(--font-serif, Georgia, serif)", fontSize:"clamp(2.8rem, 5vw, 4.5rem)", fontWeight:400, lineHeight:1.02, color:D.hero, letterSpacing:"-0.01em", marginBottom:"0.7rem" }}>
            {actor.name}
          </h1>
          {actor.born && (
            <div style={{ fontSize:"0.78rem", color:D.muted, fontStyle:"italic", fontFamily:"var(--font-serif, Georgia, serif)", marginBottom:"2rem" }}>Born {actor.born}</div>
          )}
          {actor.bio && (
            <p style={{ fontFamily:"var(--font-serif, Georgia, serif)", fontSize:"0.9rem", lineHeight:1.85, color:D.secondary, maxWidth:460, margin:0 }}>{actor.bio}</p>
          )}
        </div>
        <div style={{ position:"relative", overflow:"hidden", background:D.bg }}>
          {actor.imageUrl ? (
            <>
              <Image src={actor.imageUrl} alt={actor.name} fill style={{ objectFit:"cover", objectPosition:"top" }} sizes="50vw" priority />
              <div style={{ position:"absolute", inset:0, background:`linear-gradient(to right, ${D.bgDeep} 0%, transparent 20%), linear-gradient(to top, ${D.bgDeep} 0%, transparent 25%)` }} />
            </>
          ) : (
            <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", textAlign:"center" }}>
              <div style={{ fontFamily:"var(--font-serif, Georgia, serif)", fontSize:"8rem", fontStyle:"italic", color:D.border, lineHeight:1 }}>{actor.name.charAt(0)}</div>
              <div style={{ fontSize:"0.55rem", letterSpacing:"0.25em", textTransform:"uppercase", color:D.dim, marginTop:"0.5rem" }}>Cast Profile</div>
            </div>
          )}
        </div>
      </section>

      <div style={{ display:"flex", borderTop:`1px solid ${D.borderF}`, borderBottom:`1px solid ${D.borderF}`, background:"#161614" }}>
        {[
          { label:"Films", value:String(totalFilms), sub:"total appearances" },
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

      {actor.awards.length > 0 && (
        <div style={{ maxWidth:940, margin:"3rem auto 0", padding:"0 3rem" }}>
          <div style={{ fontSize:"0.52rem", letterSpacing:"0.22em", textTransform:"uppercase", color:D.dim, marginBottom:"1rem" }}>Awards &amp; Recognition</div>
          <div style={{ display:"flex", flexDirection:"column", gap:1, background:D.borderF }}>
            {actor.awards.map((award, i) => (
              <div key={i} style={{ background:D.bgCard, padding:"0.9rem 1.4rem", fontFamily:"var(--font-serif, Georgia, serif)", fontSize:"0.88rem", color:D.secondary, borderLeft:`3px solid ${D.accent}` }}>{award}</div>
            ))}
          </div>
        </div>
      )}

      <div style={{ maxWidth:940, margin:"3rem auto 0", padding:"0 3rem 5rem" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"2rem", paddingBottom:"1rem", borderBottom:`1px solid ${D.borderF}` }}>
          <h2 style={{ fontFamily:"var(--font-serif, Georgia, serif)", fontSize:"1.4rem", fontWeight:400, color:D.hero, margin:0 }}>Filmography</h2>
          <span style={{ fontSize:"0.62rem", letterSpacing:"0.1em", textTransform:"uppercase", color:D.muted }}>{totalFilms} {totalFilms===1?"credit":"credits"} · chronological</span>
        </div>
        {years.map((year) => (
          <div key={year} style={{ display:"flex", gap:0, marginBottom:"2.5rem" }}>
            <div style={{ width:72, flexShrink:0, paddingTop:"1.1rem" }}>
              <div style={{ fontFamily:"var(--font-serif, Georgia, serif)", fontSize:"1.1rem", color:D.accent }}>{year}</div>
            </div>
            <div style={{ flex:1, borderLeft:`1px solid ${D.border}`, paddingLeft:"1.5rem" }}>
              {byYear[year].map((credit, i) => (
                <div key={credit.id} style={{ display:"flex", gap:"1rem", alignItems:"flex-start", padding:"1rem 0", borderBottom:i<byYear[year].length-1?`1px solid ${D.borderF}`:"none" }}>
                  <div style={{ width:44, height:64, flexShrink:0, background:D.bgElev, position:"relative", overflow:"hidden", border:`1px solid ${D.border}` }}>
                    {credit.film.posterUrl ? (
                      <Image src={credit.film.posterUrl} alt={credit.film.title} fill style={{ objectFit:"cover" }} sizes="44px" />
                    ) : (
                      <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center" }}>
                        <span style={{ fontFamily:"var(--font-serif, Georgia, serif)", fontSize:"1.1rem", color:D.muted }}>{credit.film.title.charAt(0)}</span>
                      </div>
                    )}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <Link href={`/film/${credit.film.slug}`} style={{ fontFamily:"var(--font-serif, Georgia, serif)", fontSize:"1rem", color:D.primary, textDecoration:"none", display:"block", marginBottom:"0.25rem", lineHeight:1.2 }}>{credit.film.title}</Link>
                    <div style={{ fontSize:"0.7rem", color:D.muted, marginBottom:"0.4rem" }}>
                      {credit.character ? <>as <em style={{ fontStyle:"italic", color:D.accent }}>{credit.character}</em></> : "Actor"}
                      {credit.film.country && <span style={{ marginLeft:8 }}>· {COUNTRY_NAME[credit.film.country] ?? credit.film.country}</span>}
                    </div>
                    {credit.film.genres.length > 0 && (
                      <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                        {credit.film.genres.slice(0,2).map((g) => (
                          <span key={g} style={{ fontSize:"0.58rem", color:D.muted, border:`1px solid ${D.border}`, padding:"1px 6px", letterSpacing:"0.06em", borderRadius:2 }}>{g}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div style={{ flexShrink:0, textAlign:"right", display:"flex", flexDirection:"column", gap:6, alignItems:"flex-end" }}>
                    {credit.film.criticScore != null && (
                      <span style={{ background:scoreColor(credit.film.criticScore), color:"#fff", fontSize:"0.85rem", fontWeight:700, fontFamily:"var(--font-serif, Georgia, serif)", padding:"3px 9px" }}>{credit.film.criticScore}</span>
                    )}
                    {credit.film.boxCumulative != null && (
                      <div style={{ fontSize:"0.68rem", color:D.accent, fontWeight:500 }}>{fmtDual(credit.film.boxCumulative, credit.film.country)}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
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
