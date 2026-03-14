/**
 * Email delivery via Resend (resend.com)
 *
 * Free tier: 3,000 emails/month, 100/day — enough for early M'Bari.
 * Add RESEND_API_KEY to .env.
 * Set RESEND_FROM to your verified sender (e.g. "M'Bari <weekly@mbari.art>").
 */

import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { fmt } from "@/lib/format";

let _resend: Resend | null = null;

function getResend(): Resend {
  if (!_resend) {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error("RESEND_API_KEY not set");
    _resend = new Resend(key);
  }
  return _resend;
}

const FROM = () => process.env.RESEND_FROM ?? "M'Bari <weekly@mbari.art>";
const BASE_URL = () => process.env.NEXTAUTH_URL ?? "https://mbari.art";

// ─── Weekly Recap HTML builder ───────────────────────────────────────────────

interface RecapData {
  weekOf: string; // e.g. "March 10–16, 2026"
  topFilms: {
    title: string;
    slug: string;
    boxCumulative: bigint | null;
    boxWeekend: bigint | null;
    boxLive: boolean;
    verifiedScore: number | null;
    year: number;
  }[];
  newFilms: {
    title: string;
    slug: string;
    year: number;
    country: string;
    criticScore: number | null;
  }[];
  liveEvents: {
    title: string;
    slug: string;
    venue: string;
    city: string;
    date: string;
  }[];
  subscriberCount: number;
}

export function buildWeeklyRecapHtml(data: RecapData, unsubscribeKey: string): string {
  const P = {
    parch: "#F5F0E4",
    ink: "#1C1608",
    inkSoft: "#3A2E18",
    inkFaint: "#9C8B6E",
    gold: "#8B7040",
    goldLight: "#C4A862",
    green: "#2D7A3A",
    border: "#D8CDB4",
    white: "#FFFDF7",
  };

  const url = BASE_URL();

  const filmRows = data.topFilms.map((f, i) => `
    <tr style="border-bottom: 1px solid ${P.border};">
      <td style="padding: 8px 6px; font-family: Georgia, serif; font-size: 13px; color: ${P.inkFaint};">${i + 1}</td>
      <td style="padding: 8px 6px;">
        <a href="${url}/film/${f.slug}" style="font-family: Georgia, serif; font-size: 14px; font-weight: 700; color: ${P.ink}; text-decoration: none;">
          ${f.title}
        </a>
        <span style="font-size: 11px; color: ${P.inkFaint};"> (${f.year})</span>
        ${f.boxLive ? `<span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: ${P.green}; margin-left: 6px;"></span>` : ""}
      </td>
      <td style="padding: 8px 6px; text-align: right; font-family: sans-serif; font-size: 12px; color: ${P.inkSoft}; font-weight: 600;">
        ${f.boxWeekend ? fmt(f.boxWeekend) : "—"}
      </td>
      <td style="padding: 8px 6px; text-align: right; font-family: sans-serif; font-size: 12px; color: ${P.ink}; font-weight: 700;">
        ${f.boxCumulative ? fmt(f.boxCumulative) : "—"}
      </td>
    </tr>
  `).join("");

  const newFilmList = data.newFilms.length > 0
    ? data.newFilms.map((f) => `
        <li style="margin-bottom: 6px;">
          <a href="${url}/film/${f.slug}" style="font-family: Georgia, serif; font-size: 14px; font-weight: 700; color: ${P.ink}; text-decoration: none;">
            ${f.title}
          </a>
          <span style="font-size: 11px; color: ${P.inkFaint};"> · ${f.year} · ${f.country}</span>
          ${f.criticScore ? `<span style="background: ${P.green}; color: #fff; font-size: 10px; font-weight: 700; padding: 1px 5px; margin-left: 6px;">${f.criticScore}</span>` : ""}
        </li>
      `).join("")
    : `<li style="color: ${P.inkFaint}; font-style: italic;">No new films added this week.</li>`;

  const eventList = data.liveEvents.length > 0
    ? data.liveEvents.map((e) => `
        <li style="margin-bottom: 6px;">
          <a href="${url}/events/${e.slug}" style="font-family: Georgia, serif; font-size: 14px; font-weight: 700; color: ${P.ink}; text-decoration: none;">
            ${e.title}
          </a>
          <span style="font-size: 11px; color: ${P.inkFaint};"> · ${e.venue}, ${e.city} · ${e.date}</span>
        </li>
      `).join("")
    : `<li style="color: ${P.inkFaint}; font-style: italic;">No upcoming events this week.</li>`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>M'Bari Weekly Recap — ${data.weekOf}</title>
</head>
<body style="margin: 0; padding: 0; background: #E8E2D4; font-family: 'Source Sans 3', Helvetica, Arial, sans-serif;">
  <div style="max-width: 560px; margin: 0 auto; padding: 20px 16px;">

    <!-- Masthead -->
    <div style="text-align: center; padding: 24px 0 16px; border-bottom: 2px solid ${P.ink};">
      <div style="font-size: 9px; color: ${P.inkFaint}; letter-spacing: 0.14em; margin-bottom: 6px;">
        WEEKLY RECAP · ${data.weekOf.toUpperCase()}
      </div>
      <div style="font-family: Georgia, serif; font-size: 36px; font-weight: 700; color: ${P.ink}; line-height: 1;">
        M'Bari
      </div>
      <div style="font-size: 10px; color: ${P.inkFaint}; letter-spacing: 0.12em; margin-top: 4px;">
        Where culture lives
      </div>
    </div>

    <!-- Box Office -->
    <div style="background: ${P.parch}; border: 0.5px solid ${P.border}; padding: 16px 20px; margin-top: 20px;">
      <div style="font-size: 9px; color: ${P.gold}; letter-spacing: 0.14em; font-weight: 700; margin-bottom: 12px;">
        BOX OFFICE
      </div>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="border-bottom: 1px solid ${P.border};">
            <th style="font-size: 8px; color: ${P.gold}; letter-spacing: 0.1em; text-align: left; padding: 4px 6px; font-weight: 700;">#</th>
            <th style="font-size: 8px; color: ${P.gold}; letter-spacing: 0.1em; text-align: left; padding: 4px 6px; font-weight: 700;">TITLE</th>
            <th style="font-size: 8px; color: ${P.gold}; letter-spacing: 0.1em; text-align: right; padding: 4px 6px; font-weight: 700;">WKND</th>
            <th style="font-size: 8px; color: ${P.gold}; letter-spacing: 0.1em; text-align: right; padding: 4px 6px; font-weight: 700;">TOTAL</th>
          </tr>
        </thead>
        <tbody>${filmRows}</tbody>
      </table>
    </div>

    <!-- New This Week -->
    <div style="background: ${P.parch}; border: 0.5px solid ${P.border}; padding: 16px 20px; margin-top: 12px;">
      <div style="font-size: 9px; color: ${P.gold}; letter-spacing: 0.14em; font-weight: 700; margin-bottom: 10px;">
        NEW ON M'BARI THIS WEEK
      </div>
      <ul style="margin: 0; padding: 0 0 0 16px; list-style-type: disc;">
        ${newFilmList}
      </ul>
    </div>

    <!-- Events -->
    <div style="background: ${P.parch}; border: 0.5px solid ${P.border}; padding: 16px 20px; margin-top: 12px;">
      <div style="font-size: 9px; color: ${P.gold}; letter-spacing: 0.14em; font-weight: 700; margin-bottom: 10px;">
        EVENTS COMING UP
      </div>
      <ul style="margin: 0; padding: 0 0 0 16px; list-style-type: disc;">
        ${eventList}
      </ul>
    </div>

    <!-- CTA -->
    <div style="text-align: center; padding: 24px 0;">
      <a href="${url}" style="background: ${P.gold}; color: #fff; font-size: 12px; font-weight: 700; letter-spacing: 0.08em; padding: 10px 24px; text-decoration: none; display: inline-block;">
        EXPLORE M'BARI →
      </a>
    </div>

    <!-- Footer -->
    <div style="text-align: center; border-top: 1px solid ${P.border}; padding: 16px 0; font-size: 10px; color: ${P.inkFaint};">
      <div>M'Bari — Where culture lives · <a href="${url}" style="color: ${P.gold}; text-decoration: none;">mbari.art</a></div>
      <div style="margin-top: 6px;">
        Sent to ${data.subscriberCount.toLocaleString()} readers.
      </div>
      <div style="margin-top: 8px;">
        <a href="${url}/api/newsletter/unsubscribe?key=${unsubscribeKey}" style="color: ${P.inkFaint}; text-decoration: underline; font-size: 9px;">
          Unsubscribe
        </a>
        &nbsp; · &nbsp;
        <a href="${url}/api/newsletter/preferences?key=${unsubscribeKey}" style="color: ${P.inkFaint}; text-decoration: underline; font-size: 9px;">
          Email preferences
        </a>
      </div>
    </div>

  </div>
</body>
</html>
  `.trim();
}

// ─── Send weekly recap to all active subscribers ─────────────────────────────

export async function sendWeeklyRecap(): Promise<{ sent: number; failed: number; errors: string[] }> {
  const resend = getResend();

  // Gather data for the email
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const [topFilms, newFilms, events, subscribers] = await Promise.all([
    prisma.film.findMany({
      orderBy: { boxCumulative: "desc" },
      take: 5,
      select: { title: true, slug: true, boxCumulative: true, boxWeekend: true, boxLive: true, verifiedScore: true, year: true },
    }),
    prisma.film.findMany({
      where: { createdAt: { gte: oneWeekAgo } },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { title: true, slug: true, year: true, country: true, criticScore: true },
    }),
    prisma.event.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { title: true, slug: true, venue: true, city: true, date: true },
    }),
    prisma.subscriber.findMany({
      where: {
        status: "active",
        preferences: { has: "weekly_recap" },
      },
    }),
  ]);

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - 7);
  const weekOf = `${weekStart.toLocaleDateString("en-NG", { month: "long", day: "numeric" })} – ${now.toLocaleDateString("en-NG", { month: "long", day: "numeric", year: "numeric" })}`;

  const recapData: RecapData = {
    weekOf,
    topFilms,
    newFilms,
    liveEvents: events,
    subscriberCount: subscribers.length,
  };

  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  // Send in batches of 10 to respect rate limits
  const BATCH_SIZE = 10;
  for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
    const batch = subscribers.slice(i, i + BATCH_SIZE);

    const results = await Promise.allSettled(
      batch.map(async (sub) => {
        const html = buildWeeklyRecapHtml(recapData, sub.unsubscribeKey);

        await resend.emails.send({
          from: FROM(),
          to: sub.email,
          subject: `M'Bari Weekly Recap — ${weekOf}`,
          html,
          headers: {
            "List-Unsubscribe": `<${BASE_URL()}/api/newsletter/unsubscribe?key=${sub.unsubscribeKey}>`,
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          },
        });

        // Update lastSentAt
        await prisma.subscriber.update({
          where: { id: sub.id },
          data: { lastSentAt: new Date() },
        });
      })
    );

    for (const r of results) {
      if (r.status === "fulfilled") sent++;
      else {
        failed++;
        errors.push(r.reason?.message ?? "Unknown send error");
      }
    }
  }

  return { sent, failed, errors };
}

// ─── Subscribe ────────────────────────────────────────────────────────────────

export async function subscribe(email: string, name?: string, source = "website") {
  return prisma.subscriber.upsert({
    where: { email },
    create: {
      email,
      name: name ?? null,
      source,
      status: "active",
      preferences: ["weekly_recap"],
    },
    update: {
      status: "active", // reactivate if they previously unsubscribed
      ...(name && { name }),
    },
  });
}

// ─── Unsubscribe ──────────────────────────────────────────────────────────────

export async function unsubscribe(key: string) {
  return prisma.subscriber.update({
    where: { unsubscribeKey: key },
    data: { status: "unsubscribed" },
  });
}
