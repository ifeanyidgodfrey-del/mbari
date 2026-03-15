"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

const P = {
  parch: "#F5F0E4",
  parchLight: "#FAF6ED",
  parchDark: "#EDE5D0",
  ink: "#1C1608",
  inkMuted: "#6B5D3F",
  inkFaint: "#9C8B6E",
  gold: "#8B7040",
  goldLight: "#C4A862",
  green: "#2D7A3A",
  orange: "#D4882A",
  red: "#B83232",
  border: "#D8CDB4",
  white: "#FFFDF7",
};

const EVENT_TYPES = ["Concert", "Music", "Festival", "Theatre", "Comedy", "Film", "Art", "Dance", "Sport", "Conference", "Other"];
const COUNTRIES = ["Nigeria", "South Africa", "Kenya", "Ghana"] as const;
type Country = typeof COUNTRIES[number];

interface Event {
  id: string;
  slug: string;
  title: string;
  type: string;
  venue: string;
  city: string;
  country: string;
  date: string;
  imageUrl: string | null;
  live: boolean;
  barcode: boolean;
  tickets: string | null;
  capacity: string | null;
  audienceScore: number | null;
  verifiedScore: number | null;
}

const EMPTY_EVENT = (): Omit<Event, "id" | "slug"> & { slugOverride: string } => ({
  title: "",
  type: "Concert",
  venue: "",
  city: "",
  country: "Nigeria" as Country,
  date: "",
  imageUrl: "",
  live: false,
  barcode: false,
  tickets: "",
  capacity: "",
  audienceScore: null,
  verifiedScore: null,
  slugOverride: "",
});

function Input({ value, onChange, placeholder, type = "text", style = {} }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string; style?: React.CSSProperties;
}) {
  return (
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      style={{ width: "100%", border: `1px solid ${P.border}`, background: P.white, color: P.ink, fontFamily: "var(--font-sans, sans-serif)", fontSize: 12, padding: "6px 8px", outline: "none", boxSizing: "border-box", ...style }} />
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 8, fontFamily: "var(--font-sans, sans-serif)", color: P.gold, letterSpacing: "0.14em", fontWeight: 700, marginBottom: 4 }}>{children}</div>;
}

function Btn({ onClick, children, variant = "primary", disabled = false, small = false }: {
  onClick?: () => void; children: React.ReactNode; variant?: "primary" | "ghost" | "danger" | "success"; disabled?: boolean; small?: boolean;
}) {
  const bg: Record<string, string> = { primary: P.gold, ghost: "transparent", danger: P.red, success: P.green };
  const col: Record<string, string> = { primary: "#fff", ghost: P.inkMuted, danger: "#fff", success: "#fff" };
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ background: disabled ? P.border : bg[variant], color: disabled ? P.inkFaint : col[variant], border: variant === "ghost" ? `1px solid ${P.border}` : "none", fontFamily: "var(--font-sans, sans-serif)", fontSize: small ? 10 : 11, fontWeight: 700, letterSpacing: "0.06em", padding: small ? "4px 10px" : "7px 14px", cursor: disabled ? "default" : "pointer", whiteSpace: "nowrap" }}>
      {children}
    </button>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontFamily: "var(--font-sans, sans-serif)", fontSize: 11, color: P.inkMuted }}>
      <div onClick={() => onChange(!checked)} style={{ width: 36, height: 20, background: checked ? P.green : P.border, borderRadius: 10, position: "relative", cursor: "pointer", flexShrink: 0, transition: "background 0.2s" }}>
        <div style={{ position: "absolute", top: 2, left: checked ? 18 : 2, width: 16, height: 16, background: "#fff", borderRadius: "50%", transition: "left 0.2s" }} />
      </div>
      {label}
    </label>
  );
}

function EventForm({
  initial,
  onSave,
  onCancel,
  saving,
}: {
  initial: ReturnType<typeof EMPTY_EVENT>;
  onSave: (data: ReturnType<typeof EMPTY_EVENT>) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState(initial);
  const set = (k: keyof typeof form, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div style={{ background: P.parchLight, border: `1px solid ${P.goldLight}`, padding: "20px", display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 140px 120px", gap: 10 }}>
        <div><Label>TITLE *</Label><Input value={form.title} onChange={(v) => set("title", v)} placeholder="Event title" /></div>
        <div>
          <Label>TYPE *</Label>
          <select value={form.type} onChange={(e) => set("type", e.target.value)}
            style={{ width: "100%", border: `1px solid ${P.border}`, background: P.white, color: P.ink, fontFamily: "var(--font-sans, sans-serif)", fontSize: 12, padding: "6px 8px" }}>
            {EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div><Label>DATE *</Label><Input value={form.date} onChange={(v) => set("date", v)} placeholder="19 April 2026" /></div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 160px", gap: 10 }}>
        <div><Label>VENUE *</Label><Input value={form.venue} onChange={(v) => set("venue", v)} placeholder="Eko Convention Centre" /></div>
        <div><Label>CITY *</Label><Input value={form.city} onChange={(v) => set("city", v)} placeholder="Lagos" /></div>
        <div>
          <Label>COUNTRY *</Label>
          <select value={form.country} onChange={(e) => set("country", e.target.value)}
            style={{ width: "100%", border: `1px solid ${P.border}`, background: P.white, color: P.ink, fontFamily: "var(--font-sans, sans-serif)", fontSize: 12, padding: "6px 8px" }}>
            {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div><Label>IMAGE URL (images.unsplash.com or media.mbari.art)</Label><Input value={form.imageUrl ?? ""} onChange={(v) => set("imageUrl", v)} placeholder="https://images.unsplash.com/photo-…" /></div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        <div>
          <Label>TICKETS STATUS</Label>
          <select value={form.tickets ?? ""} onChange={(e) => set("tickets", e.target.value || null)}
            style={{ width: "100%", border: `1px solid ${P.border}`, background: P.white, color: P.ink, fontFamily: "var(--font-sans, sans-serif)", fontSize: 12, padding: "6px 8px" }}>
            <option value="">— none —</option>
            <option value="available">Available</option>
            <option value="limited">Limited</option>
            <option value="sold out">Sold out</option>
            <option value="free">Free</option>
          </select>
        </div>
        <div><Label>CAPACITY</Label><Input value={form.capacity ?? ""} onChange={(v) => set("capacity", v || null)} placeholder="5,000" /></div>
        <div><Label>SLUG OVERRIDE</Label><Input value={form.slugOverride} onChange={(v) => set("slugOverride", v)} placeholder="auto-generated" /></div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div><Label>AUDIENCE SCORE (0–100)</Label><Input type="number" value={form.audienceScore != null ? String(form.audienceScore) : ""} onChange={(v) => set("audienceScore", v ? Number(v) : null)} placeholder="—" /></div>
        <div><Label>VERIFIED SCORE (0–100)</Label><Input type="number" value={form.verifiedScore != null ? String(form.verifiedScore) : ""} onChange={(v) => set("verifiedScore", v ? Number(v) : null)} placeholder="—" /></div>
      </div>

      {/* Toggles */}
      <div style={{ display: "flex", gap: 24, paddingTop: 4 }}>
        <Toggle checked={form.live} onChange={(v) => set("live", v)} label="Live now (broadcast marker)" />
        <Toggle checked={form.barcode} onChange={(v) => set("barcode", v)} label="M'Bari Barcode enabled" />
      </div>
      {!form.barcode && (
        <div style={{ fontFamily: "var(--font-sans, sans-serif)", fontSize: 10, color: P.inkFaint, marginTop: -8 }}>
          Barcode is off — the M&apos;BARI BARCODE badge will not appear on this event card.
        </div>
      )}

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", paddingTop: 4 }}>
        <Btn onClick={onCancel} variant="ghost">Cancel</Btn>
        <Btn onClick={() => onSave(form)} disabled={saving || !form.title || !form.venue || !form.city || !form.date}>
          {saving ? "Saving…" : "Save event →"}
        </Btn>
      </div>
    </div>
  );
}

export default function EventsAdminPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [countryFilter, setCountryFilter] = useState<string>("ALL");

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/events");
      const data = await res.json();
      setEvents(data.events ?? []);
    } catch {
      setError("Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (form: ReturnType<typeof EMPTY_EVENT>) => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Failed to create");
        return;
      }
      setCreating(false);
      await load();
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id: string, form: ReturnType<typeof EMPTY_EVENT>) => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/events", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...form }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Failed to update");
        return;
      }
      setEditingId(null);
      await load();
    } finally {
      setSaving(false);
    }
  };

  const toggleField = async (id: string, field: "barcode" | "live", value: boolean) => {
    setTogglingId(id);
    try {
      await fetch("/api/admin/events", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, [field]: value }),
      });
      setEvents((prev) => prev.map((e) => e.id === id ? { ...e, [field]: value } : e));
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    await fetch(`/api/admin/events?id=${id}`, { method: "DELETE" });
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  const eventToForm = (e: Event): ReturnType<typeof EMPTY_EVENT> => ({
    title: e.title, type: e.type, venue: e.venue, city: e.city, country: e.country ?? "Nigeria", date: e.date,
    imageUrl: e.imageUrl ?? "", live: e.live, barcode: e.barcode,
    tickets: e.tickets ?? "", capacity: e.capacity ?? "",
    audienceScore: e.audienceScore, verifiedScore: e.verifiedScore, slugOverride: "",
  });

  return (
    <div style={{ background: P.parch, minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ borderBottom: `2px solid ${P.ink}`, padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", background: P.parchLight }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 2 }}>
            <Link href="/admin" style={{ fontFamily: "var(--font-sans, sans-serif)", fontSize: 10, color: P.inkFaint, textDecoration: "none" }}>← Admin</Link>
            <span style={{ color: P.border, fontSize: 10 }}>/</span>
            <span style={{ fontFamily: "var(--font-sans, sans-serif)", fontSize: 10, color: P.gold, letterSpacing: "0.1em", fontWeight: 700 }}>EVENTS</span>
          </div>
          <div style={{ fontFamily: "var(--font-serif, Georgia, serif)", fontSize: 22, fontWeight: 700, color: P.ink }}>Manage Events</div>
          <div style={{ fontFamily: "var(--font-sans, sans-serif)", fontSize: 11, color: P.inkFaint, marginTop: 2 }}>
            Add, edit and toggle barcode for live events. Barcode-disabled events won&apos;t show the badge on the public page.
          </div>
        </div>
        <Btn onClick={() => { setCreating(true); setEditingId(null); }}>+ New event</Btn>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "20px 16px" }}>
        {error && (
          <div style={{ background: `${P.red}10`, border: `1px solid ${P.red}`, padding: "10px 14px", fontFamily: "var(--font-sans, sans-serif)", fontSize: 12, color: P.red, marginBottom: 16 }}>
            {error} <button onClick={() => setError(null)} style={{ background: "none", border: "none", cursor: "pointer", color: P.red, marginLeft: 8 }}>×</button>
          </div>
        )}

        {creating && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontFamily: "var(--font-sans, sans-serif)", fontSize: 9, color: P.gold, letterSpacing: "0.14em", fontWeight: 700, marginBottom: 8 }}>NEW EVENT</div>
            <EventForm initial={EMPTY_EVENT()} onSave={handleCreate} onCancel={() => setCreating(false)} saving={saving} />
          </div>
        )}

        {/* Country filter */}
        <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
          {(["ALL", ...COUNTRIES] as const).map((c) => (
            <button key={c} onClick={() => setCountryFilter(c)}
              style={{ fontFamily: "var(--font-sans, sans-serif)", fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", padding: "5px 12px", border: `1px solid ${countryFilter === c ? P.gold : P.border}`, background: countryFilter === c ? P.gold : "transparent", color: countryFilter === c ? "#fff" : P.inkMuted, cursor: "pointer" }}>
              {c === "ALL" ? "ALL COUNTRIES" : c.toUpperCase()}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ fontFamily: "var(--font-sans, sans-serif)", fontSize: 12, color: P.inkFaint, padding: "20px 0" }}>Loading…</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {events.filter((e) => countryFilter === "ALL" || e.country === countryFilter).map((event) => (
              <div key={event.id}>
                {editingId === event.id ? (
                  <div>
                    <div style={{ fontFamily: "var(--font-sans, sans-serif)", fontSize: 9, color: P.gold, letterSpacing: "0.14em", fontWeight: 700, marginBottom: 8 }}>EDITING: {event.title}</div>
                    <EventForm initial={eventToForm(event)} onSave={(form) => handleUpdate(event.id, form)} onCancel={() => setEditingId(null)} saving={saving} />
                  </div>
                ) : (
                  <div style={{ background: P.parchLight, border: `0.5px solid ${P.border}`, padding: "12px 16px", display: "flex", gap: 12, alignItems: "flex-start" }}>
                    {/* Thumbnail */}
                    <div style={{ width: 60, height: 44, background: P.parchDark, flexShrink: 0, position: "relative", overflow: "hidden" }}>
                      {event.imageUrl ? (
                        <Image src={event.imageUrl} alt={event.title} fill style={{ objectFit: "cover" }} sizes="60px" />
                      ) : (
                        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ fontSize: 18, color: P.goldLight, opacity: 0.5, fontFamily: "var(--font-serif, Georgia, serif)" }}>{event.type.charAt(0)}</span>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                        <span style={{ fontFamily: "var(--font-serif, Georgia, serif)", fontSize: 14, fontWeight: 700, color: P.ink }}>{event.title}</span>
                        <span style={{ fontSize: 8, background: P.ink, color: P.parch, padding: "2px 6px", fontFamily: "var(--font-sans, sans-serif)", letterSpacing: "0.1em", fontWeight: 700 }}>{event.type.toUpperCase()}</span>
                        {event.live && <span style={{ fontSize: 8, background: P.red, color: "#fff", padding: "2px 6px", fontFamily: "var(--font-sans, sans-serif)", letterSpacing: "0.1em", fontWeight: 700 }}>LIVE</span>}
                      </div>
                      <div style={{ fontFamily: "var(--font-sans, sans-serif)", fontSize: 10, color: P.inkFaint }}>
                        {event.venue} · {event.city}, <span style={{ color: P.gold, fontWeight: 700 }}>{event.country}</span> · {event.date}
                        {event.tickets && ` · ${event.tickets.toUpperCase()}`}
                        {event.audienceScore != null && ` · Score: ${event.audienceScore}`}
                      </div>
                    </div>

                    {/* Barcode & Live toggles */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0, minWidth: 180 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div
                          onClick={() => togglingId !== event.id && toggleField(event.id, "barcode", !event.barcode)}
                          style={{ width: 32, height: 18, background: event.barcode ? P.gold : P.border, borderRadius: 9, position: "relative", cursor: "pointer", transition: "background 0.2s", flexShrink: 0 }}
                        >
                          <div style={{ position: "absolute", top: 2, left: event.barcode ? 16 : 2, width: 14, height: 14, background: "#fff", borderRadius: "50%", transition: "left 0.2s" }} />
                        </div>
                        <span style={{ fontFamily: "var(--font-sans, sans-serif)", fontSize: 10, color: event.barcode ? P.gold : P.inkFaint, fontWeight: event.barcode ? 700 : 400 }}>
                          M&apos;Bari Barcode
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div
                          onClick={() => togglingId !== event.id && toggleField(event.id, "live", !event.live)}
                          style={{ width: 32, height: 18, background: event.live ? P.red : P.border, borderRadius: 9, position: "relative", cursor: "pointer", transition: "background 0.2s", flexShrink: 0 }}
                        >
                          <div style={{ position: "absolute", top: 2, left: event.live ? 16 : 2, width: 14, height: 14, background: "#fff", borderRadius: "50%", transition: "left 0.2s" }} />
                        </div>
                        <span style={{ fontFamily: "var(--font-sans, sans-serif)", fontSize: 10, color: event.live ? P.red : P.inkFaint, fontWeight: event.live ? 700 : 400 }}>
                          Live now
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                      <Btn onClick={() => { setEditingId(event.id); setCreating(false); }} variant="ghost" small>Edit</Btn>
                      <Btn onClick={() => handleDelete(event.id, event.title)} variant="danger" small>Delete</Btn>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {events.filter((e) => countryFilter === "ALL" || e.country === countryFilter).length === 0 && !loading && (
              <div style={{ fontFamily: "var(--font-sans, sans-serif)", fontSize: 12, color: P.inkFaint, padding: "20px 0", textAlign: "center" }}>
                No events yet. Click &quot;+ New event&quot; to add one.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
