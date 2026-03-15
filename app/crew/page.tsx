import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Crew Directory — M'Bari",
  description:
    "The M'Bari master list of African film and event crew — directors, producers, writers, cinematographers and more.",
};

const ink = "#1C1608";
const inkMuted = "#6B5D3F";
const inkFaint = "#9C8B6E";
const gold = "#8B7040";
const border = "#D8CDB4";
const green = "#2D7A3A";

const ROLE_COLORS: Record<string, string> = {
  Director: "#1C1608",
  Producer: "#2D7A3A",
  Writer: "#1A5C8A",
  Cinematographer: "#8B1A1A",
  Editor: "#B8860B",
  Composer: "#6B3FA0",
};

export default async function CrewDirectoryPage() {
  const crew = await prisma.crewMember.findMany({
    include: {
      credits: { include: { film: true } },
    },
    orderBy: { name: "asc" },
  });

  // Group by primary role
  const byRole: Record<string, typeof crew> = {};
  for (const member of crew) {
    const primaryRole = member.roles[0] ?? "Other";
    if (!byRole[primaryRole]) byRole[primaryRole] = [];
    byRole[primaryRole].push(member);
  }

  const roleOrder = ["Director", "Producer", "Writer", "Cinematographer", "Editor", "Composer"];
  const sortedRoles = [
    ...roleOrder.filter((r) => byRole[r]),
    ...Object.keys(byRole).filter((r) => !roleOrder.includes(r)).sort(),
  ];

  return (
    <div style={{ background: "#fff", minHeight: "100vh" }}>
      {/* Header ribbon — 2x elongated */}
      <header
        style={{
          background: ink,
          padding: "48px 24px 40px",
          borderBottom: `2px solid ${gold}`,
        }}
      >
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <Link
            href="/"
            style={{
              fontFamily: "var(--font-sans, sans-serif)",
              fontSize: 10,
              color: gold,
              textDecoration: "none",
              letterSpacing: "0.12em",
              display: "block",
              marginBottom: 20,
            }}
          >
            ← M&apos;BARI
          </Link>
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              gap: 20,
              flexWrap: "wrap",
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: "var(--font-sans, sans-serif)",
                  fontSize: 9,
                  color: gold,
                  letterSpacing: "0.22em",
                  fontWeight: 700,
                  marginBottom: 10,
                }}
              >
                MASTER CREW DIRECTORY
              </div>
              <h1
                style={{
                  fontFamily: "var(--font-serif, Georgia, serif)",
                  fontSize: "clamp(36px, 5vw, 58px)",
                  fontWeight: 700,
                  color: "#FFFDF7",
                  margin: 0,
                  lineHeight: 1.05,
                  letterSpacing: "-0.02em",
                }}
              >
                The People Behind<br />African Cinema
              </h1>
              <p
                style={{
                  fontFamily: "var(--font-sans, sans-serif)",
                  fontSize: 13,
                  color: `${gold}CC`,
                  marginTop: 12,
                  marginBottom: 0,
                  lineHeight: 1.6,
                  maxWidth: 480,
                }}
              >
                Canonical profiles for every director, producer, writer, and craftsperson in the M&apos;Bari catalogue. Updated as new films are added.
              </p>
            </div>
            <div
              style={{
                fontFamily: "var(--font-serif, Georgia, serif)",
                fontSize: 64,
                fontWeight: 700,
                color: `${gold}30`,
                lineHeight: 1,
                flexShrink: 0,
              }}
            >
              {crew.length}
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 24px 80px" }}>
        {sortedRoles.map((role) => {
          const members = byRole[role];
          const roleColor = ROLE_COLORS[role] ?? gold;
          return (
            <section key={role} style={{ marginBottom: 64 }}>
              {/* Role heading */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  marginBottom: 28,
                  paddingBottom: 12,
                  borderBottom: `1.5px solid ${ink}`,
                }}
              >
                <div
                  style={{
                    width: 4,
                    height: 28,
                    background: roleColor,
                    flexShrink: 0,
                  }}
                />
                <h2
                  style={{
                    fontFamily: "var(--font-serif, Georgia, serif)",
                    fontSize: 22,
                    fontWeight: 700,
                    color: ink,
                    margin: 0,
                  }}
                >
                  {role}s
                </h2>
                <span
                  style={{
                    fontFamily: "var(--font-sans, sans-serif)",
                    fontSize: 10,
                    color: inkFaint,
                    letterSpacing: "0.1em",
                    fontWeight: 700,
                  }}
                >
                  {members.length} {members.length === 1 ? "profile" : "profiles"}
                </span>
              </div>

              {/* Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                  gap: 24,
                }}
              >
                {members.map((member) => {
                  const filmCount = member.credits.length;
                  const latestYear = member.credits.reduce(
                    (max, c) => Math.max(max, c.film.year),
                    0
                  );
                  const avgScore = (() => {
                    const scores = member.credits
                      .map((c) => c.film.criticScore)
                      .filter((s): s is number => s != null);
                    return scores.length > 0
                      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
                      : null;
                  })();

                  return (
                    <Link
                      key={member.id}
                      href={`/crew/${member.slug}`}
                      style={{ textDecoration: "none" }}
                    >
                      <div
                        style={{
                          background: "#fff",
                          border: `1px solid ${border}`,
                          overflow: "hidden",
                          transition: "border-color 0.15s",
                        }}
                      >
                        {/* Photo */}
                        <div
                          style={{
                            height: 200,
                            background: "#F5F0E4",
                            position: "relative",
                            overflow: "hidden",
                          }}
                        >
                          {member.imageUrl ? (
                            <Image
                              src={member.imageUrl}
                              alt={member.name}
                              fill
                              style={{ objectFit: "cover", objectPosition: "top" }}
                              sizes="220px"
                            />
                          ) : (
                            <div
                              style={{
                                width: "100%",
                                height: "100%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                background: `linear-gradient(135deg, #F5F0E4, #E8DFCC)`,
                              }}
                            >
                              <span
                                style={{
                                  fontFamily: "var(--font-serif, Georgia, serif)",
                                  fontSize: 56,
                                  color: border,
                                  fontWeight: 700,
                                  opacity: 0.6,
                                }}
                              >
                                {member.name.charAt(0)}
                              </span>
                            </div>
                          )}
                          {/* Role badge */}
                          <span
                            style={{
                              position: "absolute",
                              bottom: 10,
                              left: 10,
                              background: roleColor,
                              color: "#fff",
                              fontSize: 8,
                              fontFamily: "var(--font-sans, sans-serif)",
                              letterSpacing: "0.12em",
                              padding: "3px 8px",
                              fontWeight: 700,
                            }}
                          >
                            {role.toUpperCase()}
                          </span>
                          {member.available && (
                            <span
                              style={{
                                position: "absolute",
                                top: 10,
                                right: 10,
                                background: green,
                                color: "#fff",
                                fontSize: 7,
                                fontFamily: "var(--font-sans, sans-serif)",
                                letterSpacing: "0.1em",
                                padding: "2px 6px",
                                fontWeight: 700,
                              }}
                            >
                              AVAILABLE
                            </span>
                          )}
                        </div>

                        {/* Info */}
                        <div style={{ padding: "14px 16px 16px" }}>
                          <div
                            style={{
                              fontFamily: "var(--font-serif, Georgia, serif)",
                              fontSize: 16,
                              fontWeight: 700,
                              color: ink,
                              lineHeight: 1.2,
                              marginBottom: 6,
                            }}
                          >
                            {member.name}
                          </div>
                          <div
                            style={{
                              fontFamily: "var(--font-sans, sans-serif)",
                              fontSize: 10,
                              color: inkFaint,
                              display: "flex",
                              gap: 10,
                              flexWrap: "wrap",
                            }}
                          >
                            <span>{filmCount} film{filmCount !== 1 ? "s" : ""}</span>
                            {latestYear > 0 && (
                              <span>Last: {latestYear}</span>
                            )}
                            {avgScore != null && (
                              <span style={{ color: green, fontWeight: 700 }}>
                                {avgScore} avg
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}

        {crew.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "80px 0",
              fontFamily: "var(--font-sans, sans-serif)",
              fontSize: 13,
              color: inkMuted,
            }}
          >
            No crew profiles yet. Import films to populate this directory.
          </div>
        )}
      </div>
    </div>
  );
}
