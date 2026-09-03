import { useState, useEffect, useCallback, useMemo } from "react";
import {
  MapPin, Navigation, RefreshCw, Layers, DoorOpen,
  AlertTriangle, Compass, ChevronDown
} from "lucide-react";

// ─── CONFIG ───────────────────────────────────────────────
const configuredApiBase = import.meta.env.VITE_API_BASE?.trim();
const API_BASE = (
  import.meta.env.PROD && configuredApiBase?.match(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i)
    ? "https://campus-space-7.onrender.com"
    : configuredApiBase ?? (import.meta.env.PROD ? "https://campus-space-7.onrender.com" : "http://127.0.0.1:8000")
).replace(/\/$/, "");

// ─── STATIC CAMPUS DATA ───────────────────────────────────
const BUILDINGS = [
  { id: 2, name: "CB", label: "Central Block", floors: 10 },
];

// ─── API FUNCTIONS ────────────────────────────────────────
async function fetchFreeRooms(buildingId, floor) {
  const building = BUILDINGS.find((b) => b.id === buildingId);
  const now = new Date();
  const timeValue = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:00`;
  const dayValue = now.toLocaleDateString("en-US", { weekday: "long" });
  const res = await fetch(
    `${API_BASE}/tables?building=${encodeURIComponent(building?.name ?? "")}&floor=${floor}&time=${encodeURIComponent(timeValue)}&day=${encodeURIComponent(dayValue)}`
  );
  if (!res.ok) {
    throw new Error(`Backend returned HTTP ${res.status}`);
  }
  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    throw new Error("Backend returned HTML instead of JSON. Check the Render API URL.");
  }
  const tables = await res.json();
  return tables.map((table) => {
    const start = table.start_time ?? "00:00:00";
    const end = table.end_time ?? "00:00:00";
    const formatTime = (value) => {
      if (!value) return "00:00";
      const [hour = "00", minute = "00"] = String(value).split(":");
      return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    };

    return {
      id: table.id,
      room_number: table.room,
      floor: table.floor,
      capacity: table.capacity ?? 0,
      free_from: formatTime(start),
      free_to: formatTime(end),
    };
  });
}

// ─── DESIGN TOKENS ────────────────────────────────────────
const C = {
  ink: "#0b0e14",
  panel: "#12161f",
  plate: "#171c28",
  line: "#242b3c",
  amber: "#ffb238",
  amberDim: "#ffb23825",
  maroon: "#b13a5c",
  mist: "#8793ab",
  white: "#eef1f7",
  green: "#3ddc97",
  red: "#ff6b6b",
};

// ─── SMALL PARTS ──────────────────────────────────────────
function Dot({ color }) {
  return (
    <span style={{
      display: "inline-block", width: 7, height: 7, borderRadius: "50%",
      background: color, boxShadow: `0 0 8px ${color}`, flexShrink: 0,
    }} />
  );
}

function Spinner({ size = 20, color = C.amber }) {
  return (
    <div style={{
      width: size, height: size,
      border: `2.5px solid ${color}30`,
      borderTop: `2.5px solid ${color}`,
      borderRadius: "50%",
      animation: "spin 0.8s linear infinite",
    }} />
  );
}

function PlateSelect({ label, icon: Icon, value, onChange, disabled, children }) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 6, marginBottom: 8,
        fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, fontWeight: 700,
        letterSpacing: "0.14em", textTransform: "uppercase", color: C.mist,
      }}>
        <Icon size={12} strokeWidth={2.5} />
        {label}
      </div>
      <div style={{ position: "relative" }}>
        <select
          value={value ?? ""}
          onChange={onChange}
          disabled={disabled}
          style={{
            width: "100%", appearance: "none", WebkitAppearance: "none",
            background: `linear-gradient(180deg, ${C.plate}, #10141d)`,
            color: disabled ? C.mist : C.white,
            border: `1px solid ${C.line}`,
            borderRadius: 10,
            padding: "12px 34px 12px 14px",
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 15, fontWeight: 700,
            letterSpacing: "0.01em",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03), inset 0 -1px 2px rgba(0,0,0,0.4)",
            cursor: disabled ? "not-allowed" : "pointer",
            opacity: disabled ? 0.5 : 1,
            colorScheme: "dark",
          }}
        >
          {children}
        </select>
        <ChevronDown size={15} color={C.mist} style={{
          position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none",
        }} />
      </div>
    </div>
  );
}

function RoomRow({ room, index }) {
  const now = new Date();
  const [fh, fm] = room.free_from.split(":").map(Number);
  const [th, tm] = room.free_to.split(":").map(Number);
  const freeStart = new Date(); freeStart.setHours(fh, fm, 0, 0);
  const freeEnd = new Date(); freeEnd.setHours(th, tm, 0, 0);
  const totalMins = Math.max(1, (freeEnd - freeStart) / 60000);
  const elapsed = Math.max(0, (now - freeStart) / 60000);
  const remaining = Math.max(0, totalMins - elapsed);
  const progress = Math.min(100, (elapsed / totalMins) * 100);
  const urgency = remaining < 20 ? C.red : remaining < 45 ? C.amber : C.green;

  return (
    <div style={{
      background: C.plate,
      borderRadius: 14,
      padding: "14px 16px",
      marginBottom: 10,
      border: `1px solid ${C.line}`,
      animation: `slideIn 0.35s ease ${index * 0.06}s both`,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 22, fontWeight: 700,
            color: C.white, letterSpacing: "0.02em",
          }}>
            {room.room_number}
          </span>
        </div>
        <div style={{
          background: urgency + "20", color: urgency, borderRadius: 20,
          padding: "4px 10px", fontSize: 11.5, fontWeight: 700,
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          {Math.round(remaining)}m left
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "12px 0 8px" }}>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12.5, color: C.amber, fontWeight: 700 }}>
          {room.free_from}
        </span>
        <div style={{ flex: 1, height: 1, background: C.line }} />
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12.5, color: C.mist, fontWeight: 700 }}>
          {room.free_to}
        </span>
      </div>

      <div style={{ background: C.line, borderRadius: 4, height: 4, overflow: "hidden" }}>
        <div style={{
          width: `${progress}%`, height: "100%",
          background: urgency, borderRadius: 4, transition: "width 0.5s ease",
        }} />
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div style={{ textAlign: "center", padding: "44px 20px" }}>
      <DoorOpen size={34} color={C.mist} style={{ marginBottom: 10 }} />
      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: C.white }}>
        No free rooms right now
      </div>
      <div style={{ fontSize: 12.5, color: C.mist, marginTop: 6 }}>
        Every room on this floor is booked. Try another floor or block.
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────
export default function CampusSpace() {
  const [block, setBlock] = useState(null);       // building id
  const [floor, setFloor] = useState(null);
  const [freeRooms, setFreeRooms] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [roomsError, setRoomsError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const selectedBuilding = useMemo(
    () => BUILDINGS.find((b) => b.id === block) ?? null,
    [block]
  );

  const floorList = useMemo(() => {
    const count = selectedBuilding?.floors ?? 4;
    return [0, ...Array.from({ length: count }, (_, i) => i + 1)];
  }, [selectedBuilding]);

  const loadFreeRooms = useCallback(async (buildingId, floorNum) => {
    setRoomsLoading(true);
    setRoomsError(null);
    try {
      const rooms = await fetchFreeRooms(buildingId, floorNum);
      setFreeRooms(rooms);
      setLastUpdated(new Date());
    } catch (error) {
      setFreeRooms([]);
      setRoomsError(`${error instanceof Error ? error.message : "Request failed"}. Check the backend URL and try refreshing.`);
    } finally {
      setRoomsLoading(false);
    }
  }, []);

  // Whenever both block and floor are chosen, fetch rooms
  useEffect(() => {
    if (block != null && floor != null) {
      loadFreeRooms(block, floor);
    }
  }, [block, floor, loadFreeRooms]);

  function handleBlockChange(e) {
    const id = Number(e.target.value);
    setBlock(id || null);
    setFloor(null);
    setFreeRooms([]);
  }

  function handleFloorChange(e) {
    const val = e.target.value;
    setFloor(val === "" ? null : Number(val));
  }

  const handleRefresh = useCallback(() => {
    if (block != null && floor != null) loadFreeRooms(block, floor);
  }, [block, floor, loadFreeRooms]);

  const formatTime = (d) => d.toLocaleTimeString("en-IN", {
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true,
  });
  const formatUpdated = (d) => d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });

  const ready = block != null && floor != null;

  return (
    <div style={{
      minHeight: "100vh",
      background: C.ink,
      backgroundImage: `
        linear-gradient(${C.line}22 1px, transparent 1px),
        linear-gradient(90deg, ${C.line}22 1px, transparent 1px)`,
      backgroundSize: "28px 28px",
      display: "flex", justifyContent: "center",
      padding: "0 0 40px",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700;900&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideIn { from { opacity:0; transform: translateY(12px); } to { opacity:1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        select:focus-visible, button:focus-visible { outline: 2px solid ${C.amber}; outline-offset: 2px; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: ${C.amber}30; border-radius: 2px; }
        @media (prefers-reduced-motion: reduce) {
          * { animation-duration: 0.001ms !important; }
        }
      `}</style>

      <div style={{ width: "100%", maxWidth: 440 }}>

        {/* ── Header ── */}
        <div style={{ padding: "44px 20px 22px", animation: "fadeIn 0.5s ease" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, fontWeight: 700,
                letterSpacing: "0.18em", textTransform: "uppercase", color: C.amber,
              }}>
                <span style={{
                  width: 6, height: 6, borderRadius: "50%", background: C.maroon, display: "inline-block",
                }} />
                VIT-AP · Campus Directory
              </div>
              <div style={{
                fontFamily: "'Space Grotesk', sans-serif", fontSize: 30, fontWeight: 900,
                color: C.white, letterSpacing: "-0.03em", marginTop: 6, lineHeight: 1,
              }}>
                CampusSpace
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 19, fontWeight: 700,
                color: C.amber, fontVariantNumeric: "tabular-nums",
                textShadow: `0 0 12px ${C.amber}40`,
              }}>
                {formatTime(currentTime)}
              </div>
              <div style={{ fontSize: 11, color: C.mist, marginTop: 3 }}>
                {currentTime.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
              </div>
            </div>
          </div>
        </div>

        {/* ── Directory selector board ── */}
        <div style={{
          margin: "0 16px 16px",
          background: `linear-gradient(160deg, ${C.panel}, #0e1219)`,
          borderRadius: 20,
          padding: 18,
          border: `1px solid ${C.line}`,
          boxShadow: "0 12px 30px rgba(0,0,0,0.35)",
          animation: "fadeIn 0.5s ease 0.08s both",
        }}>
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14,
          }}>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, fontWeight: 700,
              letterSpacing: "0.14em", textTransform: "uppercase", color: C.mist,
            }}>
              Find a room
            </div>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <PlateSelect label="Block" icon={Compass} value={block ?? ""} onChange={handleBlockChange}>
              <option value="" style={{ background: C.plate, color: C.white }}>Select block</option>
              {BUILDINGS.map((b) => (
                <option key={b.id} value={b.id} style={{ background: C.plate, color: C.white }}>
                  {b.name} — {b.label}
                </option>
              ))}
            </PlateSelect>

            <PlateSelect label="Floor" icon={Layers} value={floor ?? ""} onChange={handleFloorChange} disabled={block == null}>
              <option value="" style={{ background: C.plate, color: C.white }}>Select floor</option>
              {floorList.map((f) => (
                <option key={f} value={f} style={{ background: C.plate, color: C.white }}>
                  {f === 0 ? "Ground floor" : `Floor ${f}`}
                </option>
              ))}
            </PlateSelect>
          </div>

        </div>

        {/* ── Results ── */}
        <div style={{
          margin: "0 16px",
          background: C.panel,
          borderRadius: 20,
          padding: "18px 16px",
          minHeight: 280,
          border: `1px solid ${C.line}`,
          animation: "fadeIn 0.5s ease 0.16s both",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: C.white }}>
                {ready
                  ? `${selectedBuilding?.name} · ${floor === 0 ? "Ground floor" : `Floor ${floor}`}`
                  : "Pick a block & floor"}
              </div>
              {lastUpdated && (
                <div style={{ fontSize: 11, color: C.mist, marginTop: 2, fontFamily: "'JetBrains Mono', monospace" }}>
                  Updated {formatUpdated(lastUpdated)}
                </div>
              )}
            </div>
            <button
              onClick={handleRefresh}
              disabled={!ready || roomsLoading}
              style={{
                background: roomsLoading || !ready ? C.line : C.amber,
                color: roomsLoading || !ready ? C.mist : "#1a1200",
                border: "none", borderRadius: 10, padding: "9px 14px",
                fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5, fontWeight: 700,
                cursor: roomsLoading || !ready ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", gap: 6,
              }}
            >
              {roomsLoading ? <Spinner size={12} color={C.mist} /> : <RefreshCw size={12} />}
              Refresh
            </button>
          </div>

          {!ready && (
            <div style={{ textAlign: "center", padding: "44px 20px" }}>
              <Navigation size={32} color={C.mist} style={{ marginBottom: 12 }} />
              <div style={{ fontSize: 14, color: C.mist, fontWeight: 600 }}>
                Choose a block and floor above
              </div>
              <div style={{ fontSize: 12, color: C.mist, marginTop: 4, opacity: 0.7 }}>
                Select a block and floor to view available rooms
              </div>
            </div>
          )}

          {ready && roomsLoading && (
            <div style={{ textAlign: "center", padding: "44px 20px" }}>
              <Spinner size={26} color={C.amber} />
              <div style={{ marginTop: 12, fontSize: 12.5, color: C.mist, fontFamily: "'JetBrains Mono', monospace" }}>
                Finding free rooms…
              </div>
            </div>
          )}

          {ready && !roomsLoading && roomsError && (
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <AlertTriangle size={30} color={C.red} style={{ marginBottom: 10 }} />
              <div style={{ fontSize: 14, fontWeight: 700, color: C.red }}>{roomsError}</div>
              <button
                onClick={handleRefresh}
                style={{
                  marginTop: 14, background: C.amber, color: "#1a1200",
                  border: "none", borderRadius: 10, padding: "9px 18px",
                  fontSize: 12.5, fontWeight: 700, cursor: "pointer",
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                Try again
              </button>
            </div>
          )}

          {ready && !roomsLoading && !roomsError && freeRooms.length === 0 && <EmptyState />}

          {ready && !roomsLoading && !roomsError && freeRooms.length > 0 && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
                <Dot color={C.green} />
                <span style={{
                  fontSize: 11.5, color: C.green, fontWeight: 700,
                  fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.04em",
                }}>
                  {freeRooms.length} ROOM{freeRooms.length > 1 ? "S" : ""} AVAILABLE NOW
                </span>
              </div>
              {freeRooms.map((room, i) => (
                <RoomRow key={room.id} room={room} index={i} />
              ))}
            </>
          )}
        </div>

        {/* ── Footer ── */}
        <div style={{
          textAlign: "center", marginTop: 22,
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10.5, color: `${C.mist}80`, letterSpacing: "0.06em",
          animation: "fadeIn 0.5s ease 0.3s both",
        }}>
          CAMPUS SPACE · VIT-AP UNIVERSITY
        </div>
      </div>
    </div>
  );
}