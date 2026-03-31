import { prisma } from "@/lib/prisma";
import { fmtDual } from "@/lib/format";
import Link from "next/link";
import FlipHero from "@/components/flip-hero";
import BoxOfficeTable from "@/components/box-office-table";
import EventsGrid from "@/components/events-grid";
import NewsletterSignup from "@/components/newsletter-signup";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "M'Bari — African Cinema Box Office, Scores & Film Archive",
  description:
    "Live box office rankings for Nigerian, South African, Kenyan, Ghanaian, Ethiopian and Egyptian cinema. Track scores, cast, crew and what's playing across Africa.",
  keywords: [
    "Nigerian box office",
    "Nollywood box office",
    "African cinema",
    "Nollywood scores",
    "South African films",
    "Ethiopian cinema",
    "Egyptian films",
    "African film ratings",
    "box office Africa 2025",
    "what's on in Lagos Nairobi Accra Johannesburg Addis Ababa Cairo",
  ],
  openGraph: {
    title: "M'Bari — African Cinema Box Office & Film Archive",
    description:
      "Live African box office rankings, film scores, and cinema data from Nigeria, South Africa, Kenya, Ghana, Ethiopia and Egypt.",
    url: "https://mbari.art",
    siteName: "M'Bari",
    locale: "en_NG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "M'Bari — African Cinema Box Office & Film Archive",
    description:
      "Live African box office rankings, film scores, and cinema data from Nigeria, South Africa, Kenya, Ghana, Ethiopia and Egypt.",
  },
};

export default async function HomePage() {
  const [films, events, upcomingFilms] = await Promise.all([
    prisma.film.findMany({
      where: { boxLive: true },
      orderBy: [{ country: "asc" }, { boxCumulative: "desc" }],
      include: {
        languages: { include: { language: true } },
        crew: { include: { crewMember: true }, take: 1 },
      },
    }),
    prisma.event.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.film.findMany({
      where: { upcoming: true },
      orderBy: { year: "asc" },
      take: 8,
    }),
  ]);

  const sidebarFilms = films.slice(1, 4);

  // Map display names → ISO codes stored in DB
  const COUNTRY_ISO: Record<string, string[]> = {
    "Nigeria":      ["NG", "Nigeria"],
    "South Africa": ["ZA"],
    "Kenya":        ["KE"],
    "Ghana":        ["GH"],
    "Ethiopia":     ["ET"],
    "Egypt":        ["EG"],
  };
  const liveCountryCodes = new Set(films.map((f) => f.country));
  const hasLiveFilms = (displayName: string) =>
    (COUNTRY_ISO[displayName] ?? []).some((iso) => liveCountryCodes.has(iso));

  const today = new Date().toLocaleDateString("en-NG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Nigerian Box Office — M'Bari",
    description:
      "Live Nigerian box office rankings, Nollywood film scores, and African cinema data.",
    url: "https://mbari.art",
    mainEntity: {
      "@type": "ItemList",
      name: "Nigerian Box Office Chart",
      itemListElement: films.slice(0, 10).map((film, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "Movie",
          name: film.title,
          dateCreated: String(film.year),
          description: film.synopsis?.slice(0, 160),
          url: `https://mbari.art/film/${film.slug}`,
        },
      })),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    <div style={{ background: "var(--parch)", minHeight: "100vh" }}>

      {/* ─── MASTHEAD ─────────────────────────────────────────────── */}
      <header style={{
        borderBottom: "3px solid var(--ink)",
        padding: "20px 20px 14px",
        textAlign: "center",
        background: "var(--parch-light)",
      }}>
        <h1 style={{
          fontFamily: "var(--font-serif, Georgia, serif)",
          fontSize: "clamp(56px, 10vw, 96px)",
          fontWeight: 700,
          color: "var(--ink)",
          margin: "0 0 6px",
          lineHeight: 1,
          letterSpacing: "-0.02em",
        }}>
          M&apos;Bari
        </h1>

        {/* Positioning line */}
        <div style={{
          fontFamily: "var(--font-sans, sans-serif)",
          fontSize: 11,
          color: "var(--gold)",
          letterSpacing: "0.22em",
          fontVariant: "small-caps",
          fontWeight: 700,
          marginBottom: 6,
        }}>
          The African Cinema Record
        </div>

        <div style={{
          fontSize: 10,
          fontFamily: "var(--font-sans, sans-serif)",
          color: "var(--ink-faint)",
          letterSpacing: "0.12em",
          marginBottom: 12,
        }}>
          {today}
        </div>

        {/* Country coverage strip — active = gold filled pills */}
        <div className="mbari-country-strip" style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          flexWrap: "wrap",
        }}>
          {["Nigeria","South Africa","Kenya","Ghana","Ethiopia","Egypt"].map((c) => {
            const active = hasLiveFilms(c);
            return (
              <span key={c} style={{
                display: "inline-flex",
                alignItems: "center",
                padding: active ? "4px 14px" : "3px 10px",
                background: active ? "var(--gold)" : "transparent",
                border: active ? "none" : "1px solid var(--border)",
                borderRadius: 20,
                fontFamily: "var(--font-sans, sans-serif)",
                fontSize: active ? 11 : 9,
                color: active ? "#fff" : "var(--border)",
                fontWeight: active ? 700 : 400,
                letterSpacing: "0.07em",
              }}>
                {c}
              </span>
            );
          })}
          {["Morocco","Cameroon","Tanzania","Senegal","Côte d'Ivoire"].map((c) => (
            <span key={c} style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "2px 8px",
              border: "1px solid var(--border)",
              borderRadius: 20,
              fontFamily: "var(--font-sans, sans-serif)",
              fontSize: 8,
              color: "var(--border)",
              letterSpacing: "0.06em",
              opacity: 0.6,
            }}>
              {c}
            </span>
          ))}
        </div>

        <div style={{ borderTop: "0.5px solid var(--border)", marginTop: 12 }} />
      </header>

      {/* ─── BROADSHEET GRID ──────────────────────────────────────── */}
      <section className="mbari-broadsheet">
        {/* Hero — dark ink container for cinematic weight */}
        <div style={{
          background: "var(--hero-bg)",
          boxShadow: "0 4px 32px rgba(0,0,0,0.25)",
        }}>
          <FlipHero films={films.slice(0, 5)} />
        </div>

        {/* Sidebar */}
        <aside className="mbari-sidebar" style={{ borderLeft: "1px solid var(--border)", paddingLeft: 16 }}>
          <div style={{
            fontSize: 10,
            fontFamily: "var(--font-sans, sans-serif)",
            color: "var(--gold)",
            letterSpacing: "0.18em",
            marginBottom: 12,
            borderBottom: "2px solid var(--ink)",
            paddingBottom: 7,
            fontWeight: 700,
          }}>
            ALSO TRENDING
          </div>
          {sidebarFilms.map((film, i) => (
            <Link key={film.id} href={`/film/${film.slug}`} style={{ textDecoration: "none" }}>
              <div style={{
                borderBottom: "0.5px solid var(--border-light)",
                paddingBottom: 12,
                marginBottom: 12,
              }}>
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span style={{
                    fontSize: 24,
                    fontFamily: "var(--font-serif, Georgia, serif)",
                    color: "var(--gold)",
                    lineHeight: 1,
                    fontWeight: 700,
                    opacity: 0.5,
                  }}>
                    {i + 2}
                  </span>
                  <div>
                    <div style={{
                      fontFamily: "var(--font-serif, Georgia, serif)",
                      fontSize: 14,
                      fontWeight: 700,
                      color: "var(--ink)",
                      lineHeight: 1.2,
                    }}>
                      {film.title}
                    </div>
                    <div style={{
                      fontFamily: "var(--font-sans, sans-serif)",
                      fontSize: 10,
                      color: "var(--ink-faint)",
                      marginTop: 2,
                    }}>
                      {film.year} · {film.country}
                      {film.boxCumulative != null ? ` · ${fmtDual(film.boxCumulative, film.country)}` : ""}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}

          {/* Condensed box office top 3 */}
          <div style={{
            marginTop: 8,
            background: "var(--ink)",
            padding: "12px 14px",
          }}>
            <div style={{
              fontSize: 10,
              color: "var(--gold)",
              letterSpacing: "0.18em",
              marginBottom: 10,
              fontFamily: "var(--font-sans, sans-serif)",
              fontWeight: 700,
            }}>
              BOX OFFICE TOP 3
            </div>
            {films.slice(0, 3).map((film, i) => (
              <div key={film.id} style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{
                    color: i === 0 ? "var(--gold)" : "rgba(255,255,255,0.35)",
                    fontFamily: "var(--font-serif, Georgia, serif)",
                    fontSize: i === 0 ? 16 : 12,
                    fontWeight: 700,
                  }}>
                    {i + 1}
                  </span>
                  <Link href={`/film/${film.slug}`} style={{
                    fontFamily: "var(--font-serif, Georgia, serif)",
                    color: "var(--parch)",
                    textDecoration: "none",
                    fontSize: 12,
                  }}>
                    {film.title}
                  </Link>
                  {film.boxLive && <span className="live-dot" />}
                </div>
                <span style={{
                  fontFamily: "var(--font-sans, sans-serif)",
                  fontSize: 10,
                  color: "var(--gold-light)",
                  fontWeight: 700,
                }}>
                  {film.boxCumulative != null ? fmtDual(film.boxCumulative, film.country) : "—"}
                </span>
              </div>
            ))}
          </div>
        </aside>
      </section>

      {/* ─── NOW IN CINEMAS ───────────────────────────────────────── */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "0 16px 30px" }}>
        <div style={{
          borderTop: "4px solid var(--ink)",
          borderBottom: "1px solid var(--border)",
          padding: "8px 0",
          marginBottom: 16,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <span style={{
            fontFamily: "var(--font-sans, sans-serif)",
            fontSize: 12,
            color: "var(--gold)",
            letterSpacing: "0.18em",
            fontWeight: 700,
          }}>
            NOW IN CINEMAS
          </span>
          <Link href="/films?live=1" style={{
            fontFamily: "var(--font-sans, sans-serif)",
            fontSize: 10,
            color: "var(--ink-faint)",
            textDecoration: "none",
          }}>
            Nigeria · South Africa · Kenya · Ghana · Ethiopia · Egypt →
          </Link>
        </div>
        <BoxOfficeTable films={films} />
        <div style={{
          marginTop: 12,
          padding: "8px 0",
          borderTop: "0.5px solid var(--border-light)",
          fontFamily: "var(--font-sans, sans-serif)",
          fontSize: 10,
          color: "var(--ink-faint)",
          fontStyle: "italic",
          textAlign: "center",
        }}>
          M&apos;Bari cinema barcodes — verified box office data from partner cinemas.{" "}
          Pricing per screen, per country, fair and transparent.{" "}
          <Link href="/submit" style={{ color: "var(--gold)", textDecoration: "none" }}>Learn more</Link>
        </div>
      </section>

      {/* ─── CRITICS' PICKS ───────────────────────────────────────── */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "0 16px 30px" }}>
        <div style={{
          borderTop: "4px solid var(--ink)",
          padding: "8px 0 18px",
        }}>
          <span style={{
            fontFamily: "var(--font-sans, sans-serif)",
            fontSize: 12,
            color: "var(--gold)",
            letterSpacing: "0.18em",
            fontWeight: 700,
          }}>
            CRITICS&apos; PICKS
          </span>
        </div>
        <div className="mbari-critics-grid">
          {films.filter((f) => f.criticScore && f.criticScore >= 70).slice(0, 4).map((film) => (
            <Link key={film.id} href={`/film/${film.slug}`} style={{ textDecoration: "none" }}>
              <div style={{
                borderLeft: "3px solid var(--gold)",
                padding: "16px 18px",
                background: "var(--parch-light)",
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div>
                    <div style={{
                      fontFamily: "var(--font-serif, Georgia, serif)",
                      fontSize: 20,
                      fontWeight: 700,
                      color: "var(--ink)",
                      lineHeight: 1.15,
                    }}>
                      {film.title}
                    </div>
                    <div style={{
                      fontFamily: "var(--font-sans, sans-serif)",
                      fontSize: 11,
                      color: "var(--ink-faint)",
                      marginTop: 3,
                    }}>
                      {film.year} · {film.genres.join(", ")}
                    </div>
                  </div>
                  {film.criticScore && (
                    <div style={{
                      background: "var(--gold)",
                      color: "var(--ink)",
                      padding: "6px 10px",
                      fontSize: 20,
                      fontWeight: 700,
                      fontFamily: "var(--font-serif, Georgia, serif)",
                      minWidth: 48,
                      textAlign: "center",
                      flexShrink: 0,
                      marginLeft: 12,
                    }}>
                      {film.criticScore}
                    </div>
                  )}
                </div>
                <p style={{
                  fontFamily: "var(--font-sans, sans-serif)",
                  fontSize: 12,
                  color: "var(--ink-muted)",
                  lineHeight: 1.55,
                  margin: 0,
                  overflow: "hidden",
                  display: "-webkit-box",
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical",
                }}>
                  {film.synopsis}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ─── COMING SOON ──────────────────────────────────────────── */}
      {upcomingFilms.length > 0 && (
        <section style={{ maxWidth: 1100, margin: "0 auto", padding: "0 16px 30px" }}>
          <div style={{
            borderTop: "4px solid var(--ink)",
            padding: "8px 0 18px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
            <span style={{
              fontFamily: "var(--font-sans, sans-serif)",
              fontSize: 12,
              color: "var(--gold)",
              letterSpacing: "0.18em",
              fontWeight: 700,
            }}>
              COMING SOON
            </span>
            <span style={{
              fontFamily: "var(--font-sans, sans-serif)",
              fontSize: 10,
              color: "var(--ink-faint)",
            }}>
              Announced &amp; in production
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
            {upcomingFilms.map((film) => (
              <Link key={film.id} href={`/film/${film.slug}`} style={{ textDecoration: "none" }}>
                <div style={{
                  border: "1px solid var(--border)",
                  padding: "14px 16px",
                  background: "var(--parch-light)",
                  position: "relative",
                }}>
                  <div style={{
                    position: "absolute",
                    top: 10,
                    right: 12,
                    fontSize: 9,
                    fontFamily: "var(--font-sans, sans-serif)",
                    color: "var(--ink)",
                    letterSpacing: "0.1em",
                    fontWeight: 700,
                    background: "var(--gold)",
                    padding: "3px 7px",
                  }}>
                    {film.year}
                  </div>
                  <div style={{
                    fontFamily: "var(--font-serif, Georgia, serif)",
                    fontSize: 15,
                    fontWeight: 700,
                    color: "var(--ink)",
                    lineHeight: 1.25,
                    marginBottom: 4,
                    paddingRight: 44,
                  }}>
                    {film.title}
                  </div>
                  {film.country && (
                    <div style={{
                      fontFamily: "var(--font-sans, sans-serif)",
                      fontSize: 10,
                      color: "var(--ink-faint)",
                      marginBottom: 6,
                    }}>
                      {film.country} · {film.genres.slice(0,2).join(", ")}
                    </div>
                  )}
                  {film.tagline && (
                    <p style={{
                      fontFamily: "var(--font-sans, sans-serif)",
                      fontSize: 11,
                      color: "var(--ink-muted)",
                      fontStyle: "italic",
                      lineHeight: 1.45,
                      margin: 0,
                      overflow: "hidden",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                    }}>
                      {film.tagline}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ─── LANGUAGE CINEMA ──────────────────────────────────────── */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "0 16px 30px" }}>
        <div style={{ borderTop: "4px solid var(--ink)", padding: "8px 0 18px" }}>
          <span style={{
            fontFamily: "var(--font-sans, sans-serif)",
            fontSize: 12,
            color: "var(--gold)",
            letterSpacing: "0.18em",
            fontWeight: 700,
          }}>
            LANGUAGE CINEMA
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10 }}>
          {[
            { code: "yo", name: "Yorùbá",       native: "Èdè Yorùbá",     family: "Niger-Congo" },
            { code: "ig", name: "Igbo",          native: "Asụsụ Igbo",     family: "Niger-Congo" },
            { code: "ha", name: "Hausa",         native: "Harshen Hausa",  family: "Afro-Asiatic" },
            { code: "pcm", name: "Naijá Pidgin", native: "Naijá",          family: "Creole" },
            { code: "zu", name: "Zulu",          native: "isiZulu",        family: "Bantu" },
            { code: "sw", name: "Swahili",       native: "Kiswahili",      family: "Bantu" },
            { code: "en", name: "English",       native: "English",        family: "Indo-European" },
            { code: "fr", name: "French",        native: "Français",       family: "Indo-European" },
          ].map((lang) => (
            <Link key={lang.code} href={`/language/${lang.code}`} style={{ textDecoration: "none" }}>
              <div style={{
                border: "1px solid var(--border)",
                padding: "12px 14px",
                background: "var(--parch-light)",
                borderLeft: "3px solid var(--gold-dim)",
              }}>
                <div style={{
                  fontFamily: "var(--font-serif, Georgia, serif)",
                  fontSize: 16,
                  fontWeight: 700,
                  color: "var(--ink)",
                  marginBottom: 2,
                }}>
                  {lang.native}
                </div>
                <div style={{
                  fontFamily: "var(--font-sans, sans-serif)",
                  fontSize: 11,
                  color: "var(--ink-faint)",
                }}>
                  {lang.name}
                </div>
                <div style={{
                  fontFamily: "var(--font-sans, sans-serif)",
                  fontSize: 9,
                  color: "var(--gold-dim)",
                  letterSpacing: "0.1em",
                  marginTop: 4,
                  textTransform: "uppercase",
                }}>
                  {lang.family}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ─── LIVE EVENTS ──────────────────────────────────────────── */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "0 16px 30px" }}>
        <div style={{
          borderTop: "4px solid var(--ink)",
          padding: "8px 0 18px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <span style={{
            fontFamily: "var(--font-sans, sans-serif)",
            fontSize: 12,
            color: "var(--gold)",
            letterSpacing: "0.18em",
            fontWeight: 700,
          }}>
            LIVE EVENTS
          </span>
          <Link href="/events" style={{
            fontFamily: "var(--font-sans, sans-serif)",
            fontSize: 10,
            color: "var(--ink-faint)",
            textDecoration: "none",
          }}>
            View all →
          </Link>
        </div>
        <EventsGrid events={events} />
      </section>

      {/* ─── NEWSLETTER ───────────────────────────────────────────── */}
      <section style={{
        maxWidth: 1100,
        margin: "0 auto",
        padding: "0 16px 30px",
      }}>
        <div style={{
          borderTop: "4px solid var(--ink)",
          background: "var(--parch-light)",
          padding: "28px 32px",
          textAlign: "center",
        }}>
          <div style={{
            fontFamily: "var(--font-sans, sans-serif)",
            fontSize: 10,
            color: "var(--gold)",
            letterSpacing: "0.18em",
            fontWeight: 700,
            marginBottom: 10,
          }}>
            JOIN THE MAILING LIST
          </div>
          <div style={{
            fontFamily: "var(--font-serif, Georgia, serif)",
            fontSize: 22,
            fontWeight: 700,
            color: "var(--ink)",
            marginBottom: 8,
          }}>
            Weekly Recap
          </div>
          <p style={{
            fontFamily: "var(--font-sans, sans-serif)",
            fontSize: 13,
            color: "var(--ink-muted)",
            lineHeight: 1.6,
            margin: "0 auto 18px",
            maxWidth: 420,
          }}>
            Box office numbers, new films, live events, and the week in African culture — delivered every Monday.
          </p>
          <NewsletterSignup />
        </div>
      </section>

      {/* ─── CTA ──────────────────────────────────────────────────── */}
      <section className="mbari-cta-grid">
        {[
          {
            title: "Are you a filmmaker?",
            body: "Submit your film to M'Bari. We verify box office, credit crews, and track legal availability across Africa.",
            cta: "Submit a film →",
            href: "/submit",
          },
          {
            title: "Organising an event?",
            body: "List your concert, theatre show, or festival on M'Bari. Enable the barcode system for verified audience ratings.",
            cta: "Submit an event →",
            href: "/submit",
          },
        ].map((item) => (
          <div key={item.title} style={{
            background: "var(--ink)",
            padding: "24px 28px",
          }}>
            <div style={{
              fontFamily: "var(--font-serif, Georgia, serif)",
              fontSize: 20,
              fontWeight: 700,
              color: "var(--parch)",
              marginBottom: 10,
            }}>
              {item.title}
            </div>
            <p style={{
              fontFamily: "var(--font-sans, sans-serif)",
              fontSize: 13,
              color: "rgba(251,248,240,0.65)",
              lineHeight: 1.65,
              margin: "0 0 18px",
            }}>
              {item.body}
            </p>
            <Link href={item.href} style={{
              fontFamily: "var(--font-sans, sans-serif)",
              fontSize: 12,
              color: "var(--gold-light)",
              textDecoration: "none",
              fontWeight: 700,
              letterSpacing: "0.08em",
              borderBottom: "1px solid var(--gold)",
              paddingBottom: 2,
            }}>
              {item.cta}
            </Link>
          </div>
        ))}
      </section>


      {/* ─── FOOTER ───────────────────────────────────────────────── */}
      <footer style={{
        borderTop: "2px solid rgba(200,146,10,0.3)",
        padding: "18px 20px",
        textAlign: "center",
        background: "var(--nav-bg)",
        fontFamily: "var(--font-sans, sans-serif)",
        fontSize: 11,
        letterSpacing: "0.08em",
      }}>
        <span style={{ color: "#C8920A", fontWeight: 700 }}>M&apos;BARI</span>
        <span style={{ color: "rgba(255,255,255,0.5)" }}> — Where culture lives · mbari.art · © {new Date().getFullYear()}</span>
      </footer>

    </div>
    </>
  );
}
