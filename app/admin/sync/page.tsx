"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

// ── Design tokens (dark theme) ──────────────────────────────────────────────
const BG        = "#1a1812";
const CARD      = "#2a2720";
const BORDER    = "#4a4538";
const GOLD      = "#b8985e";
const GOLD_BRIGHT = "#d4b870";
const TEXT      = "#e8e0cc";
const TEXT_MUTED = "#8a7a5e";
const TEXT_DIM  = "#5a4e38";
const GREEN     = "#2D7A3A";
const GREEN_BRIGHT = "#3a9e4a";
const RED       = "#8B1A1A";
const RED_BRIGHT = "#c0392b";
const AMBER     = "#C87941";

// ── Country badge colours ────────────────────────────────────────────────────
const COUNTRY_COLORS: Record<string, string> = {
  EG: "#8B1A1A",
  GH: "#B8860B",
  ZA: "#1A5C8A",
  KE: "#2D7A3A",
};

// ── Types ────────────────────────────────────────────────────────────────────
interface QueueItem {
  title: string;
  country: string;
  source: string;
  isIndie: boolean;
  revenueWeekly?: number | null;
  revenueTotal?: number | null;
  screenCount?: number | null;
  confidence: number;
  discoveredAt: string;
  approved: boolean;
  notes?: string;
}

interface UnconfirmedFilm {
  slug: string;
  title: string;
  country: string;
  year: number | null;
  daysSinceConfirm: number;
  lastConfirmedAt: string | null;
  daysRemaining: number;
  urgent: boolean;
}

interface DeactivationCandidate {
  slug: string;
  title: string;
  country: string;
  daysMissing: number;
  lastScrapedAt: string | null;
  action: string;
  approved: boolean;
  notes?: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatRevenue(amount: number, country: string): string {
  if (country === "EG") {
    // Egyptian piastres → display as "EGP X,XXX,XXX"
    const egp = Math.round(amount / 100);
    return `EGP ${egp.toLocaleString("en-EG")}`;
  }
  // Generic fallback
  return amount.toLocaleString();
}

function confidenceColor(conf: number): string {
  if (conf >= 0.8) return GREEN_BRIGHT;
  if (conf >= 0.6) return AMBER;
  return RED_BRIGHT;
}

function confidenceLabel(conf: number): string {
  return `${Math.round(conf * 100)}%`;
}

// ── Sub-components ───────────────────────────────────────────────────────────
function CountryBadge({ code }: { code: string }) {
  const bg = COUNTRY_COLORS[code] ?? TEXT_DIM;
  return (
    <span
      style={{
        background: bg,
        color: "#fff",
        fontSize: 9,
        fontWeight: 700,
        fontFamily: "var(--font-sans, sans-serif)",
        letterSpacing: "0.1em",
        padding: "2px 7px",
        display: "inline-block",
      }}
    >
      {code}
    </span>
  );
}

function ConfidenceBar({ confidence }: { confidence: number }) {
  const pct = Math.round(confidence * 100);
  const color = confidenceColor(confidence);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div
        style={{
          flex: 1,
          height: 4,
          background: BORDER,
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: color,
            borderRadius: 2,
          }}
        />
      </div>
      <span
        style={{
          fontSize: 9,
          fontFamily: "var(--font-sans, sans-serif)",
          color,
          fontWeight: 700,
          minWidth: 30,
          textAlign: "right",
        }}
      >
        {confidenceLabel(confidence)}
      </span>
    </div>
  );
}

function QueueCard({
  item,
  onApprove,
  onReject,
}: {
  item: QueueItem;
  onApprove: () => void;
  onReject: () => void;
}) {
  const hasRevenue = item.revenueTotal != null || item.revenueWeekly != null;

  return (
    <div
      style={{
        background: CARD,
        border: `1px solid ${BORDER}`,
        padding: "14px 16px",
        marginBottom: 10,
        opacity: item.approved ? 0.5 : 1,
      }}
    >
      {/* Top row: country + source + indie badge */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 8,
        }}
      >
        <CountryBadge code={item.country} />
        <span
          style={{
            fontSize: 9,
            fontFamily: "var(--font-sans, sans-serif)",
            color: TEXT_MUTED,
            border: `0.5px solid ${BORDER}`,
            padding: "2px 6px",
            letterSpacing: "0.08em",
          }}
        >
          {item.source.toUpperCase()}
        </span>
        {item.isIndie && (
          <span
            style={{
              fontSize: 9,
              fontFamily: "var(--font-sans, sans-serif)",
              color: GOLD,
              border: `0.5px solid ${GOLD}`,
              padding: "2px 6px",
              letterSpacing: "0.08em",
              fontWeight: 700,
            }}
          >
            INDIE
          </span>
        )}
        {item.approved && (
          <span
            style={{
              fontSize: 9,
              fontFamily: "var(--font-sans, sans-serif)",
              color: GREEN_BRIGHT,
              border: `0.5px solid ${GREEN_BRIGHT}`,
              padding: "2px 6px",
              letterSpacing: "0.08em",
              fontWeight: 700,
            }}
          >
            APPROVED
          </span>
        )}
      </div>

      {/* Title */}
      <div
        style={{
          fontFamily: "var(--font-serif, Georgia, serif)",
          fontSize: 16,
          fontWeight: 700,
          color: hasRevenue ? GOLD_BRIGHT : TEXT,
          marginBottom: 8,
          lineHeight: 1.3,
        }}
      >
        {item.title}
      </div>

      {/* Confidence bar */}
      <div style={{ marginBottom: 8 }}>
        <ConfidenceBar confidence={item.confidence} />
      </div>

      {/* Revenue */}
      {(item.revenueTotal != null || item.revenueWeekly != null) && (
        <div
          style={{
            display: "flex",
            gap: 16,
            marginBottom: 10,
            fontSize: 11,
            fontFamily: "var(--font-sans, sans-serif)",
          }}
        >
          {item.revenueTotal != null && (
            <div>
              <span style={{ color: TEXT_MUTED, fontSize: 9, letterSpacing: "0.08em" }}>
                TOTAL
              </span>
              <div style={{ color: GOLD_BRIGHT, fontWeight: 700, marginTop: 2 }}>
                {formatRevenue(item.revenueTotal, item.country)}
              </div>
            </div>
          )}
          {item.revenueWeekly != null && (
            <div>
              <span style={{ color: TEXT_MUTED, fontSize: 9, letterSpacing: "0.08em" }}>
                WEEKLY
              </span>
              <div style={{ color: TEXT, fontWeight: 600, marginTop: 2 }}>
                {formatRevenue(item.revenueWeekly, item.country)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={onApprove}
          disabled={item.approved}
          style={{
            background: item.approved ? TEXT_DIM : GREEN,
            color: "#fff",
            border: "none",
            padding: "6px 14px",
            fontSize: 9,
            fontFamily: "var(--font-sans, sans-serif)",
            fontWeight: 700,
            letterSpacing: "0.1em",
            cursor: item.approved ? "default" : "pointer",
          }}
        >
          ✓ APPROVE
        </button>
        <button
          onClick={onReject}
          style={{
            background: "transparent",
            color: RED_BRIGHT,
            border: `1px solid ${RED_BRIGHT}`,
            padding: "6px 14px",
            fontSize: 9,
            fontFamily: "var(--font-sans, sans-serif)",
            fontWeight: 700,
            letterSpacing: "0.1em",
            cursor: "pointer",
          }}
        >
          ✗ REJECT
        </button>
      </div>
    </div>
  );
}

function DeactivationCard({
  item,
  onConfirm,
  onKeep,
}: {
  item: DeactivationCandidate;
  onConfirm: () => void;
  onKeep: () => void;
}) {
  const isCritical = item.daysMissing > 21;
  const lastSeen = item.lastScrapedAt
    ? new Date(item.lastScrapedAt).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Never";

  return (
    <div
      style={{
        background: CARD,
        border: `1px solid ${isCritical ? RED : BORDER}`,
        padding: "14px 16px",
        marginBottom: 10,
        opacity: item.approved ? 0.5 : 1,
      }}
    >
      {/* Title + country */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 8,
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-serif, Georgia, serif)",
            fontSize: 15,
            fontWeight: 700,
            color: TEXT,
          }}
        >
          {item.title}
        </span>
        <CountryBadge code={item.country} />
        {item.approved && (
          <span
            style={{
              fontSize: 9,
              fontFamily: "var(--font-sans, sans-serif)",
              color: RED_BRIGHT,
              border: `0.5px solid ${RED_BRIGHT}`,
              padding: "2px 6px",
              letterSpacing: "0.08em",
              fontWeight: 700,
            }}
          >
            DEACTIVATED
          </span>
        )}
      </div>

      {/* Stats row */}
      <div
        style={{
          display: "flex",
          gap: 20,
          marginBottom: 10,
          fontSize: 11,
          fontFamily: "var(--font-sans, sans-serif)",
        }}
      >
        <div>
          <span style={{ color: TEXT_MUTED, fontSize: 9, letterSpacing: "0.08em" }}>
            DAYS MISSING
          </span>
          <div
            style={{
              color: isCritical ? RED_BRIGHT : AMBER,
              fontWeight: 700,
              fontSize: 14,
              marginTop: 2,
            }}
          >
            {item.daysMissing}d
          </div>
        </div>
        <div>
          <span style={{ color: TEXT_MUTED, fontSize: 9, letterSpacing: "0.08em" }}>
            LAST SEEN
          </span>
          <div style={{ color: TEXT_MUTED, fontWeight: 500, marginTop: 2 }}>
            {lastSeen}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={onConfirm}
          disabled={item.approved}
          style={{
            background: item.approved ? TEXT_DIM : RED,
            color: "#fff",
            border: "none",
            padding: "6px 14px",
            fontSize: 9,
            fontFamily: "var(--font-sans, sans-serif)",
            fontWeight: 700,
            letterSpacing: "0.1em",
            cursor: item.approved ? "default" : "pointer",
          }}
        >
          ✓ CONFIRM DEACTIVATION
        </button>
        <button
          onClick={onKeep}
          style={{
            background: "transparent",
            color: GREEN_BRIGHT,
            border: `1px solid ${GREEN_BRIGHT}`,
            padding: "6px 14px",
            fontSize: 9,
            fontFamily: "var(--font-sans, sans-serif)",
            fontWeight: 700,
            letterSpacing: "0.1em",
            cursor: "pointer",
          }}
        >
          ✗ KEEP ACTIVE
        </button>
      </div>
    </div>
  );
}

function UnconfirmedCard({
  item,
  onConfirm,
}: {
  item: UnconfirmedFilm;
  onConfirm: () => void;
}) {
  const lastSeen = item.lastConfirmedAt
    ? new Date(item.lastConfirmedAt).toLocaleDateString("en-GB", {
        day: "numeric", month: "short", year: "numeric",
      })
    : "Never confirmed";

  return (
    <div
      style={{
        background: CARD,
        border: `1px solid ${item.urgent ? AMBER : BORDER}`,
        padding: "14px 16px",
        marginBottom: 10,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span
          style={{
            fontFamily: "var(--font-serif, Georgia, serif)",
            fontSize: 15,
            fontWeight: 700,
            color: TEXT,
          }}
        >
          {item.title}
        </span>
        <CountryBadge code={item.country} />
        {item.urgent && (
          <span
            style={{
              fontSize: 9,
              fontFamily: "var(--font-sans, sans-serif)",
              color: AMBER,
              border: `0.5px solid ${AMBER}`,
              padding: "2px 6px",
              letterSpacing: "0.08em",
              fontWeight: 700,
            }}
          >
            EXPIRES SOON
          </span>
        )}
      </div>

      <div style={{ display: "flex", gap: 20, marginBottom: 10, fontSize: 11, fontFamily: "var(--font-sans, sans-serif)" }}>
        <div>
          <span style={{ color: TEXT_MUTED, fontSize: 9, letterSpacing: "0.08em" }}>DAYS SINCE CONFIRM</span>
          <div style={{ color: item.urgent ? AMBER : TEXT_MUTED, fontWeight: 700, fontSize: 14, marginTop: 2 }}>
            {item.daysSinceConfirm}d
          </div>
        </div>
        <div>
          <span style={{ color: TEXT_MUTED, fontSize: 9, letterSpacing: "0.08em" }}>EXPIRES IN</span>
          <div style={{ color: item.daysRemaining <= 3 ? AMBER : TEXT_MUTED, fontWeight: 500, marginTop: 2 }}>
            {item.daysRemaining > 0 ? `${item.daysRemaining}d` : "Overdue"}
          </div>
        </div>
        <div>
          <span style={{ color: TEXT_MUTED, fontSize: 9, letterSpacing: "0.08em" }}>LAST CONFIRMED</span>
          <div style={{ color: TEXT_MUTED, fontWeight: 500, marginTop: 2 }}>{lastSeen}</div>
        </div>
      </div>

      <button
        onClick={onConfirm}
        style={{
          background: GREEN,
          color: "#fff",
          border: "none",
          padding: "6px 14px",
          fontSize: 9,
          fontFamily: "var(--font-sans, sans-serif)",
          fontWeight: 700,
          letterSpacing: "0.1em",
          cursor: "pointer",
        }}
      >
        ✓ STILL LIVE
      </button>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function AdminSyncPage() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [deactivation, setDeactivation] = useState<DeactivationCandidate[]>([]);
  const [unconfirmed, setUnconfirmed] = useState<UnconfirmedFilm[]>([]);
  const [loadingQueue, setLoadingQueue] = useState(true);
  const [loadingDeact, setLoadingDeact] = useState(true);
  const [loadingUnconfirmed, setLoadingUnconfirmed] = useState(true);
  const [runStatus, setRunStatus] = useState<"idle" | "running" | "done" | "error">("idle");
  const [runOutput, setRunOutput] = useState<string>("");

  const fetchQueue = useCallback(async () => {
    setLoadingQueue(true);
    try {
      const res = await fetch("/api/admin/sync/queue");
      const data = await res.json();
      setQueue(Array.isArray(data) ? data : []);
    } catch {
      setQueue([]);
    } finally {
      setLoadingQueue(false);
    }
  }, []);

  const fetchDeactivation = useCallback(async () => {
    setLoadingDeact(true);
    try {
      const res = await fetch("/api/admin/sync/deactivation");
      const data = await res.json();
      setDeactivation(Array.isArray(data) ? data : []);
    } catch {
      setDeactivation([]);
    } finally {
      setLoadingDeact(false);
    }
  }, []);

  const fetchUnconfirmed = useCallback(async () => {
    setLoadingUnconfirmed(true);
    try {
      const res = await fetch("/api/admin/sync/unconfirmed-films");
      const data = await res.json();
      setUnconfirmed(Array.isArray(data) ? data : []);
    } catch {
      setUnconfirmed([]);
    } finally {
      setLoadingUnconfirmed(false);
    }
  }, []);

  useEffect(() => {
    fetchQueue();
    fetchDeactivation();
    fetchUnconfirmed();
  }, [fetchQueue, fetchDeactivation, fetchUnconfirmed]);

  async function handleApprove(item: QueueItem) {
    await fetch("/api/admin/sync/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: item.title, country: item.country }),
    });
    fetchQueue();
  }

  async function handleReject(item: QueueItem) {
    await fetch("/api/admin/sync/reject", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: item.title }),
    });
    fetchQueue();
  }

  async function handleDeactivate(item: DeactivationCandidate) {
    await fetch("/api/admin/sync/deactivate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: item.slug }),
    });
    fetchDeactivation();
  }

  async function handleKeep(item: DeactivationCandidate) {
    await fetch("/api/admin/sync/keep", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: item.slug }),
    });
    fetchDeactivation();
  }

  async function handleConfirmLive(item: UnconfirmedFilm) {
    await fetch("/api/admin/sync/confirm-live", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: item.slug }),
    });
    fetchUnconfirmed();
  }

  async function handleRunSync() {
    setRunStatus("running");
    setRunOutput("");
    try {
      const res = await fetch("/api/admin/sync/run", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setRunStatus("done");
        setRunOutput(data.stdout ?? "");
        fetchQueue();
        fetchDeactivation();
        fetchUnconfirmed();
      } else {
        setRunStatus("error");
        setRunOutput(data.error ?? "Unknown error");
      }
    } catch (err) {
      setRunStatus("error");
      setRunOutput(err instanceof Error ? err.message : "Request failed");
    }
  }

  const pendingQueue = queue.filter((i) => !i.approved);
  const pendingDeact = deactivation.filter((i) => !i.approved);
  const urgentUnconfirmed = unconfirmed.filter((i) => i.urgent);

  return (
    <div
      style={{
        background: BG,
        minHeight: "100vh",
        color: TEXT,
        fontFamily: "var(--font-sans, sans-serif)",
      }}
    >
      {/* Header */}
      <div
        style={{
          borderBottom: `1px solid ${BORDER}`,
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Link
          href="/admin"
          style={{
            fontSize: 11,
            color: TEXT_MUTED,
            textDecoration: "none",
            letterSpacing: "0.06em",
          }}
        >
          ← Admin
        </Link>

        <h1
          style={{
            fontFamily: "var(--font-serif, Georgia, serif)",
            fontSize: 20,
            fontWeight: 700,
            color: GOLD_BRIGHT,
            margin: 0,
          }}
        >
          Cinema Sync
        </h1>

        {/* Run Sync button */}
        <button
          onClick={handleRunSync}
          disabled={runStatus === "running"}
          style={{
            background: runStatus === "running" ? TEXT_DIM : GOLD,
            color: runStatus === "running" ? TEXT_MUTED : "#1a1812",
            border: "none",
            padding: "8px 18px",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.1em",
            cursor: runStatus === "running" ? "default" : "pointer",
            fontFamily: "var(--font-sans, sans-serif)",
          }}
        >
          {runStatus === "running" ? "⟳ RUNNING…" : "▶ RUN SYNC"}
        </button>
      </div>

      {/* Run output panel */}
      {(runStatus === "done" || runStatus === "error") && (
        <div
          style={{
            margin: "12px 24px 0",
            background: CARD,
            border: `1px solid ${runStatus === "error" ? RED_BRIGHT : GREEN}`,
            padding: "12px 14px",
          }}
        >
          <div
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: runStatus === "error" ? RED_BRIGHT : GREEN_BRIGHT,
              letterSpacing: "0.12em",
              marginBottom: 6,
            }}
          >
            {runStatus === "error" ? "SYNC ERROR" : "SYNC COMPLETE"}
          </div>
          {runOutput && (
            <pre
              style={{
                fontSize: 10,
                color: TEXT_MUTED,
                margin: 0,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                maxHeight: 200,
                overflowY: "auto",
              }}
            >
              {runOutput}
            </pre>
          )}
        </div>
      )}

      {/* Split pane */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 0,
          height: "calc(100vh - 65px)",
          overflow: "hidden",
        }}
      >
        {/* LEFT — Review Queue */}
        <div
          style={{
            borderRight: `1px solid ${BORDER}`,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Pane header */}
          <div
            style={{
              padding: "12px 20px",
              borderBottom: `1px solid ${BORDER}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexShrink: 0,
            }}
          >
            <div>
              <span
                style={{
                  fontFamily: "var(--font-sans, sans-serif)",
                  fontSize: 9,
                  color: GOLD,
                  letterSpacing: "0.16em",
                  fontWeight: 700,
                }}
              >
                REVIEW QUEUE
              </span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  color: pendingQueue.length > 0 ? AMBER : TEXT_DIM,
                  fontWeight: 700,
                }}
              >
                {pendingQueue.length} pending
              </span>
              <span style={{ fontSize: 11, color: TEXT_DIM }}>
                / {queue.length} total
              </span>
            </div>
          </div>

          {/* Scrollable list */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "16px 20px",
            }}
          >
            {loadingQueue ? (
              <div
                style={{
                  textAlign: "center",
                  color: TEXT_DIM,
                  fontSize: 13,
                  paddingTop: 40,
                }}
              >
                Loading…
              </div>
            ) : queue.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  color: TEXT_DIM,
                  fontSize: 13,
                  paddingTop: 40,
                }}
              >
                Queue is empty.
              </div>
            ) : (
              queue.map((item, i) => (
                <QueueCard
                  key={`${item.title}-${item.country}-${i}`}
                  item={item}
                  onApprove={() => handleApprove(item)}
                  onReject={() => handleReject(item)}
                />
              ))
            )}
          </div>
        </div>

        {/* MIDDLE — Deactivation Candidates */}
        <div
          style={{
            borderRight: `1px solid ${BORDER}`,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Pane header */}
          <div
            style={{
              padding: "12px 20px",
              borderBottom: `1px solid ${BORDER}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexShrink: 0,
            }}
          >
            <div>
              <span
                style={{
                  fontFamily: "var(--font-sans, sans-serif)",
                  fontSize: 9,
                  color: RED_BRIGHT,
                  letterSpacing: "0.16em",
                  fontWeight: 700,
                }}
              >
                DEACTIVATION CANDIDATES
              </span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  color: pendingDeact.length > 0 ? RED_BRIGHT : TEXT_DIM,
                  fontWeight: 700,
                }}
              >
                {pendingDeact.length} pending
              </span>
              <span style={{ fontSize: 11, color: TEXT_DIM }}>
                / {deactivation.length} total
              </span>
            </div>
          </div>

          {/* Scrollable list */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "16px 20px",
            }}
          >
            {loadingDeact ? (
              <div
                style={{
                  textAlign: "center",
                  color: TEXT_DIM,
                  fontSize: 13,
                  paddingTop: 40,
                }}
              >
                Loading…
              </div>
            ) : deactivation.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  color: TEXT_DIM,
                  fontSize: 13,
                  paddingTop: 40,
                }}
              >
                No deactivation candidates.
              </div>
            ) : (
              deactivation.map((item, i) => (
                <DeactivationCard
                  key={`${item.slug}-${i}`}
                  item={item}
                  onConfirm={() => handleDeactivate(item)}
                  onKeep={() => handleKeep(item)}
                />
              ))
            )}
          </div>
        </div>

        {/* RIGHT — Manual Confirmation (NG + unscraped countries) */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "12px 20px",
              borderBottom: `1px solid ${BORDER}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexShrink: 0,
            }}
          >
            <div>
              <span
                style={{
                  fontFamily: "var(--font-sans, sans-serif)",
                  fontSize: 9,
                  color: AMBER,
                  letterSpacing: "0.16em",
                  fontWeight: 700,
                }}
              >
                CONFIRM STILL LIVE
              </span>
              <div style={{ fontSize: 9, color: TEXT_DIM, marginTop: 3, letterSpacing: "0.04em" }}>
                No scraper · expires every 21 days
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  fontSize: 11,
                  color: urgentUnconfirmed.length > 0 ? AMBER : TEXT_DIM,
                  fontWeight: 700,
                }}
              >
                {urgentUnconfirmed.length} urgent
              </span>
              <span style={{ fontSize: 11, color: TEXT_DIM }}>
                / {unconfirmed.length} total
              </span>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
            {loadingUnconfirmed ? (
              <div style={{ textAlign: "center", color: TEXT_DIM, fontSize: 13, paddingTop: 40 }}>
                Loading…
              </div>
            ) : unconfirmed.length === 0 ? (
              <div style={{ textAlign: "center", color: TEXT_DIM, fontSize: 13, paddingTop: 40 }}>
                All confirmed.
              </div>
            ) : (
              unconfirmed.map((item, i) => (
                <UnconfirmedCard
                  key={`${item.slug}-${i}`}
                  item={item}
                  onConfirm={() => handleConfirmLive(item)}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
