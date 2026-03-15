export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { approveSubmission, rejectSubmission } from "./actions";
import Link from "next/link";
import type { Metadata } from "next";

export const revalidate = 0;

export const metadata: Metadata = {
  title: "Admin — M'Bari",
};

const parch = "#F5F0E4";
const ink = "#1C1608";
const gold = "#8B7040";
const green = "#2D7A3A";
const red = "#C0392B";
const border = "#C4A862";
const inkFaint = "#9C8B6E";
const inkMuted = "#6B5D3F";

const TYPE_BADGES: Record<string, string> = {
  film: "F",
  article: "A",
  event: "E",
  crew: "C",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "#C87941",
  approved: green,
  rejected: red,
};

const ENDPOINTS = [
  "/v1/films",
  "/v1/crew",
  "/v1/boxoffice/weekly",
  "/v1/heat",
  "/v1/events",
  "/v1/bulk/export",
];

const TIERS = [
  { name: "Free", limit: "1,000 / day", color: inkFaint },
  { name: "Industry", limit: "50,000 / day", color: gold },
  { name: "Enterprise", limit: "Unlimited", color: green },
];

export default async function AdminPage() {
  const [submissions, subscriberStats] = await Promise.all([
    prisma.submission.findMany({
      orderBy: { createdAt: "desc" },
    }),
    prisma.subscriber.groupBy({
      by: ["status"],
      _count: true,
    }).catch(() => [] as { status: string; _count: number }[]),
  ]);

  const recentSubscribers = await prisma.subscriber.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { id: true, email: true, name: true, status: true, source: true, createdAt: true },
  }).catch(() => [] as { id: string; email: string; name: string | null; status: string; source: string; createdAt: Date }[]);

  const subActive = subscriberStats.find((s) => s.status === "active")?._count ?? 0;
  const subUnsub = subscriberStats.find((s) => s.status === "unsubscribed")?._count ?? 0;
  const subTotal = subActive + subUnsub + (subscriberStats.find((s) => s.status === "bounced")?._count ?? 0);

  const pending = submissions.filter((s) => s.status === "pending").length;
  const approved = submissions.filter((s) => s.status === "approved").length;
  const rejected = submissions.filter((s) => s.status === "rejected").length;
  const total = submissions.length;

  return (
    <div
      style={{
        background: "#E8E2D4",
        minHeight: "100vh",
        padding: "20px 16px 40px",
        maxWidth: 1100,
        margin: "0 auto",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <Link
          href="/"
          style={{
            fontFamily: "var(--font-sans, sans-serif)",
            fontSize: 11,
            color: inkFaint,
            textDecoration: "none",
          }}
        >
          ← M&apos;Bari
        </Link>
        <h1
          style={{
            fontFamily: "var(--font-serif, Georgia, serif)",
            fontSize: 22,
            fontWeight: 700,
            color: ink,
            margin: 0,
          }}
        >
          Admin Console
        </h1>
        <div style={{ display: "flex", gap: 8 }}>
          <Link
            href="/admin/events"
            style={{
              background: "transparent",
              color: gold,
              border: `1px solid ${gold}`,
              fontFamily: "var(--font-sans, sans-serif)",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.06em",
              padding: "7px 14px",
              textDecoration: "none",
            }}
          >
            Manage Events →
          </Link>
          <Link
            href="/admin/import"
            style={{
              background: gold,
              color: "#fff",
              fontFamily: "var(--font-sans, sans-serif)",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.06em",
              padding: "7px 14px",
              textDecoration: "none",
            }}
          >
            Import Films →
          </Link>
        </div>
      </div>

      {/* Stats row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 0,
          border: `0.5px solid ${border}`,
          marginBottom: 24,
          background: parch,
        }}
      >
        {[
          { label: "PENDING", value: pending, color: "#C87941" },
          { label: "APPROVED", value: approved, color: green },
          { label: "REJECTED", value: rejected, color: red },
          { label: "TOTAL", value: total, color: ink },
        ].map((stat, i) => (
          <div
            key={stat.label}
            style={{
              padding: "16px 20px",
              textAlign: "center",
              borderRight: i < 3 ? `0.5px solid ${border}` : "none",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-serif, Georgia, serif)",
                fontSize: 32,
                fontWeight: 700,
                color: stat.color,
              }}
            >
              {stat.value}
            </div>
            <div
              style={{
                fontFamily: "var(--font-sans, sans-serif)",
                fontSize: 8,
                color: inkFaint,
                letterSpacing: "0.14em",
                marginTop: 2,
              }}
            >
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div
        style={{
          display: "flex",
          gap: 0,
          marginBottom: 16,
          borderBottom: `1px solid ${border}`,
        }}
      >
        {["ALL", "PENDING", "APPROVED", "REJECTED"].map((tab) => (
          <div
            key={tab}
            style={{
              padding: "8px 16px",
              fontFamily: "var(--font-sans, sans-serif)",
              fontSize: 9,
              color: tab === "ALL" ? gold : inkFaint,
              letterSpacing: "0.12em",
              fontWeight: tab === "ALL" ? 700 : 400,
              borderBottom: tab === "ALL" ? `2px solid ${gold}` : "none",
              cursor: "pointer",
            }}
          >
            {tab}
          </div>
        ))}
      </div>

      {/* Submission queue */}
      <div
        style={{
          background: parch,
          border: `0.5px solid ${border}`,
          marginBottom: 32,
        }}
      >
        {submissions.length === 0 ? (
          <div
            style={{
              padding: 40,
              textAlign: "center",
              fontFamily: "var(--font-sans, sans-serif)",
              fontSize: 13,
              color: inkFaint,
            }}
          >
            No submissions yet.
          </div>
        ) : (
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontFamily: "var(--font-sans, sans-serif)",
              fontSize: 12,
            }}
          >
            <thead>
              <tr style={{ borderBottom: `1px solid ${border}` }}>
                {[
                  "TYPE",
                  "TITLE",
                  "SUBMITTER",
                  "DATE",
                  "STATUS",
                  "ACTIONS",
                ].map((col, i) => (
                  <th
                    key={col}
                    style={{
                      fontSize: 8,
                      color: gold,
                      letterSpacing: "0.12em",
                      fontWeight: 700,
                      textAlign: "left",
                      padding: "8px 10px",
                    }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {submissions.map((sub, i) => (
                <tr
                  key={sub.id}
                  style={{
                    background: i % 2 === 0 ? "#fff" : "#EDE6D6",
                    borderBottom: `0.5px solid ${border}30`,
                  }}
                >
                  <td style={{ padding: "8px 10px" }}>
                    <span
                      style={{
                        background: ink,
                        color: parch,
                        fontSize: 9,
                        fontWeight: 700,
                        padding: "2px 7px",
                        fontFamily: "var(--font-sans, sans-serif)",
                      }}
                    >
                      {TYPE_BADGES[sub.type] ?? sub.type.charAt(0).toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: "8px 10px" }}>
                    <span
                      style={{
                        fontFamily: "var(--font-serif, Georgia, serif)",
                        fontSize: 13,
                        fontWeight: 700,
                        color: ink,
                      }}
                    >
                      {sub.title}
                    </span>
                    {sub.hasDesign && (
                      <span
                        style={{
                          marginLeft: 8,
                          fontSize: 8,
                          fontFamily: "var(--font-sans, sans-serif)",
                          color: gold,
                          border: `0.5px solid ${gold}`,
                          padding: "1px 5px",
                          fontWeight: 700,
                          letterSpacing: "0.08em",
                        }}
                      >
                        HAS ORIGINAL DESIGN
                      </span>
                    )}
                  </td>
                  <td
                    style={{
                      padding: "8px 10px",
                      color: inkMuted,
                      fontSize: 11,
                    }}
                  >
                    {sub.submitter}
                  </td>
                  <td
                    style={{
                      padding: "8px 10px",
                      color: inkFaint,
                      fontSize: 10,
                    }}
                  >
                    {new Date(sub.createdAt).toLocaleDateString("en-NG", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td style={{ padding: "8px 10px" }}>
                    <span
                      style={{
                        fontSize: 9,
                        fontFamily: "var(--font-sans, sans-serif)",
                        color: STATUS_COLORS[sub.status] ?? inkFaint,
                        border: `0.5px solid ${STATUS_COLORS[sub.status] ?? inkFaint}`,
                        padding: "2px 7px",
                        fontWeight: 700,
                        letterSpacing: "0.1em",
                      }}
                    >
                      {sub.status.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: "8px 10px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      {sub.status !== "approved" && (
                        <form action={approveSubmission.bind(null, sub.id)}>
                          <button
                            type="submit"
                            style={{
                              background: green,
                              color: "#fff",
                              border: "none",
                              padding: "4px 10px",
                              fontSize: 9,
                              fontFamily: "var(--font-sans, sans-serif)",
                              cursor: "pointer",
                              fontWeight: 700,
                              letterSpacing: "0.08em",
                            }}
                          >
                            APPROVE
                          </button>
                        </form>
                      )}
                      {sub.status !== "rejected" && (
                        <form action={rejectSubmission.bind(null, sub.id)}>
                          <button
                            type="submit"
                            style={{
                              background: "transparent",
                              color: red,
                              border: `0.5px solid ${red}`,
                              padding: "4px 10px",
                              fontSize: 9,
                              fontFamily: "var(--font-sans, sans-serif)",
                              cursor: "pointer",
                              fontWeight: 700,
                              letterSpacing: "0.08em",
                            }}
                          >
                            REJECT
                          </button>
                        </form>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Newsletter Management */}
      <div
        style={{
          background: parch,
          border: `0.5px solid ${border}`,
          padding: "20px 24px",
          marginBottom: 24,
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-sans, sans-serif)",
            fontSize: 9,
            color: gold,
            letterSpacing: "0.16em",
            fontWeight: 700,
            marginBottom: 14,
          }}
        >
          NEWSLETTER
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 0,
            border: `0.5px solid ${border}`,
            marginBottom: 16,
          }}
        >
          {[
            { label: "ACTIVE", value: subActive, color: green },
            { label: "UNSUBSCRIBED", value: subUnsub, color: red },
            { label: "TOTAL", value: subTotal, color: ink },
          ].map((stat, i) => (
            <div
              key={stat.label}
              style={{
                padding: "12px 16px",
                textAlign: "center",
                borderRight: i < 2 ? `0.5px solid ${border}` : "none",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-serif, Georgia, serif)",
                  fontSize: 24,
                  fontWeight: 700,
                  color: stat.color,
                }}
              >
                {stat.value}
              </div>
              <div
                style={{
                  fontFamily: "var(--font-sans, sans-serif)",
                  fontSize: 7,
                  color: inkFaint,
                  letterSpacing: "0.14em",
                  marginTop: 2,
                }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {recentSubscribers.length > 0 && (
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontFamily: "var(--font-sans, sans-serif)",
              fontSize: 11,
            }}
          >
            <thead>
              <tr style={{ borderBottom: `1px solid ${border}` }}>
                {["EMAIL", "NAME", "SOURCE", "STATUS", "JOINED"].map((col) => (
                  <th
                    key={col}
                    style={{
                      fontSize: 8,
                      color: gold,
                      letterSpacing: "0.12em",
                      fontWeight: 700,
                      textAlign: "left",
                      padding: "6px 8px",
                    }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentSubscribers.map((sub, i) => (
                <tr
                  key={sub.id}
                  style={{
                    background: i % 2 === 0 ? "#fff" : "#EDE6D6",
                    borderBottom: `0.5px solid ${border}30`,
                  }}
                >
                  <td style={{ padding: "6px 8px", color: ink, fontSize: 11 }}>{sub.email}</td>
                  <td style={{ padding: "6px 8px", color: inkMuted, fontSize: 11 }}>{sub.name ?? "—"}</td>
                  <td style={{ padding: "6px 8px", color: inkFaint, fontSize: 10 }}>{sub.source}</td>
                  <td style={{ padding: "6px 8px" }}>
                    <span
                      style={{
                        fontSize: 8,
                        color: sub.status === "active" ? green : red,
                        border: `0.5px solid ${sub.status === "active" ? green : red}`,
                        padding: "1px 6px",
                        fontWeight: 700,
                        letterSpacing: "0.1em",
                      }}
                    >
                      {sub.status.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: "6px 8px", color: inkFaint, fontSize: 10 }}>
                    {new Date(sub.createdAt).toLocaleDateString("en-NG", {
                      day: "numeric",
                      month: "short",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Data infrastructure */}
      <div
        style={{
          background: parch,
          border: `0.5px solid ${border}`,
          padding: "20px 24px",
          marginBottom: 24,
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-sans, sans-serif)",
            fontSize: 9,
            color: gold,
            letterSpacing: "0.16em",
            fontWeight: 700,
            marginBottom: 14,
          }}
        >
          DATA INFRASTRUCTURE
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 20,
          }}
        >
          {/* API endpoints */}
          <div>
            <div
              style={{
                fontFamily: "var(--font-sans, sans-serif)",
                fontSize: 8,
                color: inkFaint,
                letterSpacing: "0.12em",
                marginBottom: 8,
              }}
            >
              API ENDPOINTS
            </div>
            <div
              style={{ display: "flex", flexDirection: "column", gap: 4 }}
            >
              {ENDPOINTS.map((ep) => (
                <div
                  key={ep}
                  style={{
                    fontFamily: "var(--font-sans, sans-serif)",
                    fontSize: 11,
                    color: inkMuted,
                    padding: "4px 8px",
                    background: "#EDE6D6",
                    fontWeight: 600,
                  }}
                >
                  <span style={{ color: green }}>GET</span> /api{ep}
                </div>
              ))}
            </div>
          </div>

          {/* Licensing tiers */}
          <div>
            <div
              style={{
                fontFamily: "var(--font-sans, sans-serif)",
                fontSize: 8,
                color: inkFaint,
                letterSpacing: "0.12em",
                marginBottom: 8,
              }}
            >
              LICENSING TIERS
            </div>
            <div
              style={{ display: "flex", flexDirection: "column", gap: 6 }}
            >
              {TIERS.map((tier) => (
                <div
                  key={tier.name}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 10px",
                    border: `0.5px solid ${tier.color}40`,
                    background: `${tier.color}08`,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-sans, sans-serif)",
                      fontSize: 11,
                      color: tier.color,
                      fontWeight: 700,
                    }}
                  >
                    {tier.name}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-sans, sans-serif)",
                      fontSize: 10,
                      color: inkMuted,
                    }}
                  >
                    {tier.limit}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Fake API stats */}
        <div
          style={{
            display: "flex",
            gap: 20,
            marginTop: 16,
            paddingTop: 16,
            borderTop: `0.5px solid ${border}`,
          }}
        >
          {[
            { label: "API CALLS TODAY", value: "12,847" },
            { label: "ACTIVE KEYS", value: "34" },
            { label: "UPTIME", value: "99.98%" },
            { label: "LATENCY (P95)", value: "87ms" },
          ].map((stat) => (
            <div key={stat.label} style={{ textAlign: "center" }}>
              <div
                style={{
                  fontFamily: "var(--font-serif, Georgia, serif)",
                  fontSize: 20,
                  fontWeight: 700,
                  color: ink,
                }}
              >
                {stat.value}
              </div>
              <div
                style={{
                  fontFamily: "var(--font-sans, sans-serif)",
                  fontSize: 7,
                  color: inkFaint,
                  letterSpacing: "0.12em",
                  marginTop: 2,
                }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
