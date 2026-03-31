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
      {/* Masthead */}
      <header style={{
        borderBottom: "2px solid var(--ink)",
        padding: "16px 20px 10px",
        textAlign: "center",
        background: "var(--parch-light)",
      }}>
        <h1 style={{
          fontFamily: "var(--font-serif, Georgia, serif)",
          fontSize: "clamp(40px, 8vw, 72px)",
          fontWeight: 700,
          color: "var(--ink)",
          margin: "0 0 4px",
          lineHeight: 1,
          letterSpacing: "-0.02em",
        }}>
          M&apos;Bari
        </h1>
        <div style={{
          fontSize: 10,
          fontFamily: "var(--font-sans, sans-serif)",
          color: "var(--ink-faint)",
          letterSpacing: "0.12em",
        }}>
          {today}
        </div>
        {/* Country coverage strip */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 0,
          marginTop: 8,
          flexWrap: "wrap",
          rowGap: 4,
        }}>
          {["Nigeria","South Africa","Kenya","Ghana","Ethiopia","Egypt"].map((c, i, arr) => {
            const active = hasLiveFilms(c);
            return (
              <span key={c} style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "0 10px",
                borderRight: i < arr.length - 1 ? "0.5px solid var(--border)" : "none",
              }}>
                <span style={{
                  width: 4, height: 4, borderRadius: "50%",
                  background: active ? "var(--gold)" : "transparent",
                  border: active ? "none" : "0.5px solid var(--border)",
                  flexShrink: 0, display: "inline-block",
                }} />
                <span style={{
                  fontFamily: "var(--font-sans, sans-serif)",
                  fontSize: 9,
                  color: active ? "var(--ink-muted)" : "var(--border)",
                  fontWeight: active ? 600 : 400,
                  letterSpacing: "0.06em",
                }}>{c}</span>
              </span>
            );
          })}
          {["Morocco","Cameroon","Tanzania","Senegal","Côte d'Ivoire"].map((c) => (
            <span key={c} style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "0 10px",
              borderRight: "0.5px solid var(--border)",
            }}>
              <span style={{
                width: 4, height: 4, borderRadius: "50%",
                border: "0.5px solid var(--border)", flexShrink: 0, display: "inline-block",
              }} />
              <span style={{
                fontFamily: "var(--font-sans, sans-serif)",
                fontSize: 9, color: "var(--border)", letterSpacing: "0.06em",
              }}>{c}</span>
            </span>
          ))}
        </div>
        <div style={{ borderTop: "0.5px solid var(--border)", marginTop: 8 }} />
      </header>

      {/* Broadsheet grid */}
      <section style={{
        maxWidth: 1100,
        margin: "0 auto",
        padding: "20px 16px",
        display: "grid",
        gridTemplateColumns: "1fr 280px",
        gap: 20,
      }}>
        <div>
          <FlipHero films={films.slice(0, 5)} />
        </div>

        {/* Sidebar */}
        <aside style={{ borderLeft: "1px solid var(--border)", paddingLeft: 16 }}>
          <div style={{
            fontSize: 9,
            fontFamily: "var(--font-sans, sans-serif)",
            color: "var(--gold)",
            letterSpacing: "0.14em",
            marginBottom: 10,
            borderBottom: "1px solid var(--border)",
            paddingBottom: 6,
          }}>
            ALSO TRENDING
          </div>
          {sidebarFilms.map((film, i) => (
            <Link key={film.id} href={`/film/${film.slug}`} style={{ textDecoration: "none" }}>
              <div style={{
                borderBottom: "0.5px solid var(--border-light)",
                paddingBottom: 10,
                marginBottom: 10,
              }}>
                <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <span style={{
                    fontSize: 20,
                    fontFamily: "var(--font-serif, Georgia, serif)",
                    color: "var(--border)",
                    lineHeight: 1,
                    fontWeight: 700,
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
            background: "var(--parch-dark)",
            padding: "10px 12px",
            border: "0.5px solid var(--border)",
          }}>
            <div style={{
              fontSize: 9,
              color: "var(--gold)",
              letterSpacing: "0.14em",
              marginBottom: 8,
              fontFamily: "var(--font-sans, sans-serif)",
            }}>
              BOX OFFICE TOP 3
            </div>
            {films.slice(0, 3).map((film, i) => (
              <div key={film.id} style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 6,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ color: "var(--ink-faint)", fontFamily: "var(--font-sans, sans-serif)", fontSize: 10 }}>
                    #{i + 1}
                  </span>
                  <Link href={`/film/${film.slug}`} style={{
                    fontFamily: "var(--font-serif, Georgia, serif)",
                    color: "var(--ink)",
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
                  color: "var(--ink-muted)",
                  fontWeight: 600,
                }}>
                  {film.boxCumulative != null ? fmtDual(film.boxCumulative, film.country) : "—"}
                </span>
              </div>
            ))}
          </div>
        </aside>
      </section>

      {/* Full box office table */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "0 16px 30px" }}>
        <div style={{
          borderTop: "2px solid var(--ink)",
          borderBottom: "0.5px solid var(--border)",
          padding: "6px 0",
          marginBottom: 16,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <span style={{
            fontFamily: "var(--font-sans, sans-serif)",
            fontSize: 10,
            color: "var(--gold)",
            letterSpacing: "0.14em",
            fontWeight: 700,
          }}>
            NOW IN CINEMAS
          </span>
          <Link href="/films?live=1" style={{
            fontFamily: "var(--font-sans, sans-serif)",
            fontSize: 9,
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

      {/* Critics picks */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "0 16px 30px" }}>
        <div style={{ borderTop: "2px solid var(--ink)", padding: "6px 0 16px" }}>
          <span style={{
            fontFamily: "var(--font-sans, sans-serif)",
            fontSize: 10,
            color: "var(--gold)",
            letterSpacing: "0.14em",
            fontWeight: 700,
          }}>
            CRITICS&apos; PICKS
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
          {films.filter((f) => f.criticScore && f.criticScore >= 70).slice(0, 4).map((film) => (
            <Link key={film.id} href={`/film/${film.slug}`} style={{ textDecoration: "none" }}>
              <div style={{
                border: "0.5px solid var(--border)",
                padding: 14,
                background: "var(--parch-light)",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                  <div>
                    <div style={{
                      fontFamily: "var(--font-serif, Georgia, serif)",
                      fontSize: 18,
                      fontWeight: 700,
                      color: "var(--ink)",
                      lineHeight: 1.2,
                    }}>
                      {film.title}
                    </div>
                    <div style={{
                      fontFamily: "var(--font-sans, sans-serif)",
                      fontSize: 11,
                      color: "var(--ink-faint)",
                      marginTop: 2,
                    }}>
                      {film.year} · {film.genres.join(", ")}
                    </div>
                  </div>
                  {film.criticScore && (
                    <div style={{
                      background: "var(--green)",
                      color: "#fff",
                      padding: "4px 8px",
                      fontSize: 16,
                      fontWeight: 700,
                      fontFamily: "var(--font-serif, Georgia, serif)",
                      minWidth: 40,
                      textAlign: "center",
                    }}>
                      {film.criticScore}
                    </div>
                  )}
                </div>
                <p style={{
                  fontFamily: "var(--font-sans, sans-serif)",
                  fontSize: 12,
                  color: "var(--ink-muted)",
                  lineHeight: 1.5,
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

      {/* Upcoming / Announced */}
      {upcomingFilms.length > 0 && (
        <section style={{ maxWidth: 1100, margin: "0 auto", padding: "0 16px 30px" }}>
          <div style={{
            borderTop: "2px solid var(--ink)",
            padding: "6px 0 16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
            <span style={{
              fontFamily: "var(--font-sans, sans-serif)",
              fontSize: 10,
              color: "var(--gold)",
              letterSpacing: "0.14em",
              fontWeight: 700,
            }}>
              COMING SOON
            </span>
            <span style={{
              fontFamily: "var(--font-sans, sans-serif)",
              fontSize: 9,
              color: "var(--ink-faint)",
            }}>
              Announced &amp; in production
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
            {upcomingFilms.map((film) => (
              <Link key={film.id} href={`/film/${film.slug}`} style={{ textDecoration: "none" }}>
                <div style={{
                  border: "0.5px solid var(--border)",
                  padding: "12px 14px",
                  background: "var(--parch-light)",
                  position: "relative",
                }}>
                  <div style={{
                    position: "absolute",
                    top: 8,
                    right: 10,
                    fontSize: 8,
                    fontFamily: "var(--font-sans, sans-serif)",
                    color: "var(--gold)",
                    letterSpacing: "0.12em",
                    border: "0.5px solid var(--gold)",
                    padding: "1px 5px",
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
                    paddingRight: 40,
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

      {/* Language cinema */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "0 16px 30px" }}>
        <div style={{ borderTop: "2px solid var(--ink)", padding: "6px 0 16px" }}>
          <span style={{
            fontFamily: "var(--font-sans, sans-serif)",
            fontSize: 10,
            color: "var(--gold)",
            letterSpacing: "0.14em",
            fontWeight: 700,
          }}>
            LANGUAGE CINEMA
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 8 }}>
          {[
            { code: "yo", name: "Yorùbá", native: "Èdè Yorùbá" },
            { code: "ig", name: "Igbo", native: "Asụsụ Igbo" },
            { code: "ha", name: "Hausa", native: "Harshen Hausa" },
            { code: "pcm", name: "Naijá Pidgin", native: "Naijá" },
            { code: "zu", name: "Zulu", native: "isiZulu" },
            { code: "sw", name: "Swahili", native: "Kiswahili" },
            { code: "en", name: "English", native: "English" },
            { code: "fr", name: "French", native: "Français" },
          ].map((lang) => (
            <Link key={lang.code} href={`/language/${lang.code}`} style={{ textDecoration: "none" }}>
              <div style={{
                border: "0.5px solid var(--border)",
                padding: "10px 12px",
                background: "var(--parch-light)",
              }}>
                <div style={{
                  fontFamily: "var(--font-serif, Georgia, serif)",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "var(--ink)",
                }}>
                  {lang.name}
                </div>
                <div style={{
                  fontFamily: "var(--font-sans, sans-serif)",
                  fontSize: 10,
                  color: "var(--ink-faint)",
                  fontStyle: "italic",
                }}>
                  {lang.native}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Events */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "0 16px 30px" }}>
        <div style={{
          borderTop: "2px solid var(--ink)",
          padding: "6px 0 16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <span style={{
            fontFamily: "var(--font-sans, sans-serif)",
            fontSize: 10,
            color: "var(--gold)",
            letterSpacing: "0.14em",
            fontWeight: 700,
          }}>
            LIVE EVENTS
          </span>
          <Link href="/events" style={{
            fontFamily: "var(--font-sans, sans-serif)",
            fontSize: 9,
            color: "var(--ink-faint)",
            textDecoration: "none",
          }}>
            View all →
          </Link>
        </div>
        <EventsGrid events={events} />
      </section>

      {/* Newsletter Signup */}
      <section style={{
        maxWidth: 1100,
        margin: "0 auto",
        padding: "0 16px 30px",
      }}>
        <div style={{
          borderTop: "2px solid var(--ink)",
          borderBottom: "0.5px solid var(--border)",
          background: "var(--parch-light)",
          padding: "24px 32px",
          textAlign: "center",
        }}>
          <div style={{
            fontFamily: "var(--font-sans, sans-serif)",
            fontSize: 9,
            color: "var(--gold)",
            letterSpacing: "0.14em",
            fontWeight: 700,
            marginBottom: 10,
          }}>
            JOIN THE MAILING LIST
          </div>
          <div style={{
            fontFamily: "var(--font-serif, Georgia, serif)",
            fontSize: 20,
            fontWeight: 700,
            color: "var(--ink)",
            marginBottom: 6,
          }}>
            Weekly Recap
          </div>
          <p style={{
            fontFamily: "var(--font-sans, sans-serif)",
            fontSize: 12,
            color: "var(--ink-muted)",
            lineHeight: 1.6,
            margin: "0 auto 16px",
            maxWidth: 420,
          }}>
            Box office numbers, new films, live events, and the week in African culture — delivered every Monday.
          </p>
          <NewsletterSignup />
        </div>
      </section>

      {/* CTAs */}
      <section style={{
        maxWidth: 1100,
        margin: "0 auto",
        padding: "0 16px 40px",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 16,
      }}>
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
            border: "1px solid var(--border)",
            padding: "20px 24px",
            background: "var(--parch-light)",
          }}>
            <div style={{
              fontFamily: "var(--font-serif, Georgia, serif)",
              fontSize: 18,
              fontWeight: 700,
              color: "var(--ink)",
              marginBottom: 8,
            }}>
              {item.title}
            </div>
            <p style={{
              fontFamily: "var(--font-sans, sans-serif)",
              fontSize: 13,
              color: "var(--ink-muted)",
              lineHeight: 1.6,
              margin: "0 0 14px",
            }}>
              {item.body}
            </p>
            <Link href={item.href} style={{
              fontFamily: "var(--font-sans, sans-serif)",
              fontSize: 11,
              color: "var(--gold)",
              textDecoration: "none",
              fontWeight: 700,
              letterSpacing: "0.06em",
            }}>
              {item.cta}
            </Link>
          </div>
        ))}
      </section>

      <footer style={{
        borderTop: "2px solid var(--ink)",
        padding: "16px 20px",
        textAlign: "center",
        background: "var(--nav-bg)",
        color: "rgba(255,255,255,0.3)",
        fontFamily: "var(--font-sans, sans-serif)",
        fontSize: 10,
        letterSpacing: "0.08em",
      }}>
        M&apos;Bari — Where culture lives · mbari.art · © {new Date().getFullYear()}
      </footer>
    </div>
    </>
  );
}
