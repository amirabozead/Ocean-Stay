// src/utils/helpers.js

/* ================= DATE HELPERS ================= */
import { APP_PAGES, ROLE_DEFAULT_PAGES, ROLE_DEFAULT_PAGES_FRONT_OFFICE, PAYMENT_STATUSES } from "../data/constants";
export const toMidnight = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

export const ymd = (d) => {
  const x = toMidnight(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
};

export const parseYMD = (s) => {
  if (!s) return null;
  if (typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split("-").map(Number);
    const dt = new Date(y, (m || 1) - 1, d || 1);
    return isNaN(dt) ? null : dt;
  }
  const d = new Date(s);
  return isNaN(d) ? null : d;
};

export const overlapsRange = (checkInStr, checkOutStr, from, to) => {
  const ci = parseYMD(checkInStr);
  const co = parseYMD(checkOutStr);
  if (!ci || !co) return false;
  return ci < to && co > from; 
};

export const toDate = (dateStr) => {
  if (!dateStr) return null;
  if (typeof dateStr === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [y, m, d] = dateStr.split("-").map(Number);
    const dt = new Date(y, (m || 1) - 1, d || 1);
    return Number.isNaN(dt.getTime()) ? null : dt;
  }
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime()) ? null : d;
};

export const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

export const isSameDay = (a, b) => {
  const A = startOfDay(a);
  const B = startOfDay(b);
  return A.getTime() === B.getTime();
};

export const calcNights = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return 0;
  const inD = toDate(checkIn);
  const outD = toDate(checkOut);
  if (!inD || !outD) return 0;
  const diff = startOfDay(outD) - startOfDay(inD);
  return diff > 0 ? Math.ceil(diff / (1000 * 60 * 60 * 24)) : 0;
};

export const rangesOverlap = (aIn, aOut, bIn, bOut) => {
  const A1 = toDate(aIn);
  const A2 = toDate(aOut);
  const B1 = toDate(bIn);
  const B2 = toDate(bOut);
  if (!A1 || !A2 || !B1 || !B2) return false;
  if (A1 >= A2 || B1 >= B2) return false;
  return A1 < B2 && B1 < A2;
};

export const isoNow = () => new Date().toISOString();

/* ================= MONEY & FORMATTING ================= */
export const money = (n) => {
  const x = Number(n || 0);
  if (!Number.isFinite(x)) return "$0";
  return `$${x.toLocaleString("en-US")}`;
};

export const storeMoney = (n) => {
  const x = Number(n || 0);
  if (!Number.isFinite(x)) return "0.00";
  return x.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

/** Round to 2 decimal places for money; avoids floating-point drift. */
export const roundTo2 = (n) => {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.round(x * 100) / 100;
};

export const pct = (n) => {
  const x = Number(n || 0);
  return `${Math.max(0, Math.min(100, Math.round(x)))}%`;
};

/* ================= MISC HELPERS ================= */
export const uid = (prefix = "id") => {
  try {
    if (crypto?.randomUUID) return `${prefix}_${crypto.randomUUID()}`;
  } catch {}
  return `${prefix}_${Date.now()}_${Math.random()}`;
};

export const storeUid = (prefix = "id") => `${prefix}_${uid()}`;

export const isActiveStatus = (status) => status === "Booked" || status === "Checked-in";

/* ================= LOCAL STORAGE SAFE HELPERS ================= */
export const lsGet = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

export const lsSet = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
};

export const storeLoad = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};

export const storeSave = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};
// ضيف دول في آخر الملف خالص
export const fmtDayLabel = (d) => {
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
};

export const fmtMonthLabel = (d) => {
  return d.toLocaleDateString("en-GB", { month: "short" });
};
/* ================= UI HELPERS (New) ================= */
export const statusPillClass = (status) => {
  if (status === "Checked-in") return "pill pill--green";
  if (status === "Checked-out") return "pill pill--indigo";
  if (status === "Cancelled") return "pill pill--red";
  return "pill pill--amber";
};

export const roomBadgeClass = (roomStatus) => {
  if (roomStatus === "Occupied") return "pill pill--green";
  if (roomStatus === "Reserved") return "pill pill--amber";
  return "pill pill--slate";
};

export const roomCardClass = (roomStatus) => {
  if (roomStatus === "Occupied") return "roomInvCard roomInvCard--occupied";
  if (roomStatus === "Reserved") return "roomInvCard roomInvCard--reserved";
  return "roomInvCard roomInvCard--vacant";
};

export const headerGradientClass = (kind) => {
  if (kind === "indigo") return "panelHeader panelHeader--indigo";
  if (kind === "emerald") return "panelHeader panelHeader--emerald";
  if (kind === "amber") return "panelHeader panelHeader--amber";
  return "panelHeader panelHeader--slate";
};

/* ================= DAILY RATE HELPERS ================= */
export const rateCoversDay = (rate, dayStr) => {
  const from = rate?.from ?? rate?.date_from;
  const to = rate?.to ?? rate?.date_to;
  if (!from || !to) return false;
  return dayStr >= from && dayStr < to;
};

export const rateCanEdit = (rate) => {
  const todayStr = new Date().toISOString().slice(0, 10);
  return !!rate?.from && rate.from >= todayStr;
};

/* ================= ROOM STATUS HELPERS ================= */
export const isOOSPhysical = (v) => {
  const s = String(v || "").trim().toLowerCase();
  return s === "out of service" || s === "oos" || s === "maintenance" || s === "out-of-service";
};

export const normalizePhysicalStatus = (v) => (isOOSPhysical(v) ? "Out of Service" : String(v || "").trim() || "Clean");

/** Trimmed internal note on a reservation (`notes`, or legacy `note`). */
export const getReservationNotesTrimmed = (r) => {
  const raw = r?.notes ?? r?.note ?? "";
  const s = typeof raw === "string" ? raw : String(raw ?? "");
  return s.trim();
};

/**
 * Settlement payment status, or null if never set on the reservation (legacy rows → no UX alert noise).
 */
export const getReservationPaymentStatusOrNull = (r) => {
  const raw = r?.paymentStatus ?? r?.payment_status;
  if (raw === undefined || raw === null || String(raw).trim() === "") return null;
  const s = typeof raw === "string" ? raw.trim() : String(raw).trim();
  return PAYMENT_STATUSES.includes(s) ? s : "Not paid";
};

export const reservationPaymentNeedsAttention = (r) => {
  const ps = getReservationPaymentStatusOrNull(r);
  return ps === "Not paid" || ps === "Partial Payment";
};

/* ================= SECURITY HELPERS ================= */
/** app_users.allowed_pages from Postgres may be an array, or a JSON string if stored oddly */
export const normalizeAllowedPages = (value) => {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (value == null || value === "") return ["dashboard"];
  if (typeof value === "string") {
    const s = value.trim();
    if (!s) return ["dashboard"];
    if (s.startsWith("[")) {
      try {
        const p = JSON.parse(s);
        return Array.isArray(p) ? p.map(String).filter(Boolean) : ["dashboard"];
      } catch {
        return ["dashboard"];
      }
    }
    return [s];
  }
  return ["dashboard"];
};

export const secCanAccessPage = (user, pageKey) => {
  if (!user) return false;
  const allow = normalizeAllowedPages(user.allowedPages);
  return allow.includes(pageKey);
};

export const secDefaultPagesForRole = (role) => {
  const r = String(role || "").trim().toLowerCase();
  const aliases = { front_office: "frontoffice", store_keeper: "store" };
  const key = aliases[r] || r;
  return ROLE_DEFAULT_PAGES[key] || ROLE_DEFAULT_PAGES["viewer"];
};

export const SEC_FRONT_OFFICE_READONLY_MESSAGE =
  "Front office can create new bookings, revenue lines, and expenses. Only an administrator can change or delete them after saving.";

export const secFoAlertOperationalReadOnly = () => alert(SEC_FRONT_OFFICE_READONLY_MESSAGE);

export const secIsAdminUser = (user) => {
  if (!user) return false;
  const u = String(user.username ?? "").trim().toLowerCase();
  if (u === "admin") return true;
  const r = String(user.role ?? "").trim().toLowerCase();
  return r === "admin";
};

export const secIsFrontOfficeStaff = (user) => {
  if (!user) return false;
  const canonRole = String(user.role ?? "")
    .trim()
    .toLowerCase()
    .replace(/_/g, "")
    .replace(/-/g, "")
    .replace(/\s+/g, "");
  if (canonRole === "frontoffice") return true;
  const un = String(user.username ?? "").trim().toLowerCase();
  return un === "frontoffice";
};

/** True when allowed pages equal the canonical front-office set (handles Supabase users still marked viewer/manager role). */
export const secUserHasExactFrontOfficePages = (user) => {
  if (!user) return false;
  const pageSig = (arr) =>
    [...new Set((arr || []).map(String).filter(Boolean))].sort().join("\0");
  const userSig = pageSig(normalizeAllowedPages(user.allowedPages));
  const refSig = pageSig(ROLE_DEFAULT_PAGES_FRONT_OFFICE);
  return !!userSig && userSig === refSig;
};

/** Reception: create-only for reservations / extra revenues / expenses (unless admin). */
export const secFrontOfficeOperationalLock = (user) =>
  !!user &&
  !secIsAdminUser(user) &&
  (secIsFrontOfficeStaff(user) || secUserHasExactFrontOfficePages(user));

const foNormExtraRevRow = (r) => ({
  id: String(r?.id ?? ""),
  date: String(r?.date ?? r?.revenue_date ?? "").slice(0, 10),
  type: String(r?.type ?? "").trim(),
  description: String(r?.description ?? "").trim(),
  amount: roundTo2(Number(r?.amount ?? 0)),
});

/** True when the new list preserves every previous row unchanged; new rows allowed. */
export const secFoAllowsExtraRevenueReplacement = (prev, next) => {
  const pArr = Array.isArray(prev) ? prev : [];
  const nArr = Array.isArray(next) ? next : [];
  const pMap = new Map();
  for (const row of pArr) {
    const id = String(row?.id ?? "");
    if (!id) continue;
    pMap.set(id, foNormExtraRevRow(row));
  }
  const nMap = new Map();
  for (const row of nArr) {
    const id = String(row?.id ?? "");
    if (!id) continue;
    nMap.set(id, foNormExtraRevRow(row));
  }
  for (const id of pMap.keys()) {
    if (!nMap.has(id)) return false;
    const a = pMap.get(id);
    const b = nMap.get(id);
    if (
      a.date !== b.date ||
      a.type !== b.type ||
      a.description !== b.description ||
      a.amount !== b.amount
    )
      return false;
  }
  return true;
};

const foNormExpenseRow = (e) => ({
  id: String(e?.id ?? ""),
  date: String(e?.date ?? e?.expense_date ?? "").slice(0, 10),
  category: String(e?.category ?? "").trim(),
  vendor: String(e?.vendor ?? "").trim(),
  description: String(e?.description ?? "").trim(),
  amount: roundTo2(Number(e?.amount ?? 0)),
  method: String(e?.method ?? "").trim(),
  ref: String(e?.ref ?? "").trim(),
});

export const secFoAllowsExpenseReplacement = (prev, next) => {
  const pArr = Array.isArray(prev) ? prev : [];
  const nArr = Array.isArray(next) ? next : [];
  const pMap = new Map();
  for (const row of pArr) {
    const id = String(row?.id ?? "");
    if (!id) continue;
    pMap.set(id, foNormExpenseRow(row));
  }
  const nMap = new Map();
  for (const row of nArr) {
    const id = String(row?.id ?? "");
    if (!id) continue;
    nMap.set(id, foNormExpenseRow(row));
  }
  for (const id of pMap.keys()) {
    if (!nMap.has(id)) return false;
    const a = pMap.get(id);
    const b = nMap.get(id);
    if (
      a.date !== b.date ||
      a.category !== b.category ||
      a.vendor !== b.vendor ||
      a.description !== b.description ||
      a.amount !== b.amount ||
      a.method !== b.method ||
      a.ref !== b.ref
    )
      return false;
  }
  return true;
};

const foNormSupplierRow = (s) => ({
  id: String(s?.id ?? ""),
  name: String(s?.name ?? "").trim(),
  phone: String(s?.phone ?? "").trim(),
  email: String(s?.email ?? "").trim(),
});

export const secFoAllowsSupplierListReplacement = (prev, next) => {
  const pArr = Array.isArray(prev) ? prev : [];
  const nArr = Array.isArray(next) ? next : [];
  const pMap = new Map();
  for (const row of pArr) {
    const id = String(row?.id ?? "");
    if (!id) continue;
    pMap.set(id, foNormSupplierRow(row));
  }
  const nMap = new Map();
  for (const row of nArr) {
    const id = String(row?.id ?? "");
    if (!id) continue;
    nMap.set(id, foNormSupplierRow(row));
  }
  for (const id of pMap.keys()) {
    if (!nMap.has(id)) return false;
    const a = pMap.get(id);
    const b = nMap.get(id);
    if (a.name !== b.name || a.phone !== b.phone || a.email !== b.email) return false;
  }
  return true;
};

/** Default local-login user factory (username + PIN); full admin (all pages + Security manager). */
export const secHossamUser = () => ({
  id: storeUid("u"),
  username: "Hossam",
  pin: "Hossam@2026",
  role: "admin",
  allowedPages: APP_PAGES.map((p) => p.key),
});

export const secSeedUsers = () => {
  return [
    { id: storeUid("u"), username: "admin", pin: "1234", allowedPages: APP_PAGES.map((p) => p.key) },
    { id: storeUid("u"), username: "accountant", pin: "1111", allowedPages: ["dashboard", "expenses", "reports"] },
    {
      id: storeUid("u"),
      username: "frontoffice",
      pin: "2222",
      role: "frontoffice",
      allowedPages: [...ROLE_DEFAULT_PAGES.frontoffice],
    },
    { id: storeUid("u"), username: "store", pin: "3333", allowedPages: ["dashboard", "store"] },
    secHossamUser(),
  ];
};
// دالة لحساب تسعير الليالي (مطلوبة في app.jsx)
export function computeSplitPricingSnapshot({
  roomType,
  checkIn,
  checkOut,
  dailyRates,
  taxRate,
  serviceCharge,
  mealPlan,
  pax
}) {
  const start = parseYMD(checkIn);
  const end = parseYMD(checkOut);
  if (!start || !end || end <= start) {
    return { ok: false, nightly: [], breakdown: [], subtotal: 0, taxAmount: 0, serviceAmount: 0, total: 0, avgNightly: 0 };
  }
  const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  if (!roomType || nights <= 0) {
    return { ok: false, nightly: [], breakdown: [], subtotal: 0, taxAmount: 0, serviceAmount: 0, total: 0, avgNightly: 0 };
  }

  const calculatedNightly = [];
  const missingDates = [];
  for (let d = new Date(start.getTime()); d < end; d.setDate(d.getDate() + 1)) {
    const nightStr = ymd(d);
    const rateMatch = (dailyRates || []).find(r =>
      (r.roomType === roomType || r.room_type === roomType) && nightStr >= (r.from || r.date_from || "") && nightStr < (r.to || r.date_to || "")
    );
    if (!rateMatch) {
      missingDates.push(nightStr);
      continue;
    }
    const base = Number(rateMatch.rate ?? rateMatch.nightlyRate ?? rateMatch.nightly_rate ?? 0);
    const pkg = rateMatch.packages || rateMatch.packageRates || {};
    const mp = String(mealPlan || "BO").toUpperCase();
    let addon = 0;
    if (mp === "BB") addon = Number(pkg.BB ?? pkg.bb ?? rateMatch.pkg_bb ?? rateMatch.bb ?? 0);
    else if (mp === "HB") addon = Number(pkg.HB ?? pkg.hb ?? rateMatch.pkg_hb ?? rateMatch.hb ?? 0);
    else if (mp === "FB") addon = Number(pkg.FB ?? pkg.fb ?? rateMatch.pkg_fb ?? rateMatch.fb ?? 0);

    const totalPax = Math.max(1, Number(pax || 1));
    const totalAddon = addon * totalPax;
    const rate = roundTo2(base + totalAddon);
    calculatedNightly.push({
      date: nightStr,
      rate,
      baseRate: base,
      packageAddon: totalAddon,
      mealPlan: mp
    });
  }

  // So revenue is always from the beginning of the reservation: fill missing nights using the
  // first available rate for this room (nearest rate in the stay range) instead of failing.
  if (missingDates.length > 0 && calculatedNightly.length > 0) {
    const fallback = calculatedNightly[0];
    const totalPax = Math.max(1, Number(pax || 1));
    missingDates.forEach((nightStr) => {
      calculatedNightly.push({
        date: nightStr,
        rate: fallback.rate,
        baseRate: fallback.baseRate,
        packageAddon: fallback.packageAddon,
        mealPlan: fallback.mealPlan || String(mealPlan || "BO").toUpperCase()
      });
    });
    calculatedNightly.sort((a, b) => a.date.localeCompare(b.date));
  } else if (missingDates.length > 0 && calculatedNightly.length === 0) {
    return { ok: false, missing: missingDates, nightly: [], breakdown: [], subtotal: 0, total: 0 };
  }

  const rawSubtotal = calculatedNightly.reduce((acc, curr) => acc + curr.rate, 0);
  const subtotal = roundTo2(rawSubtotal);
  const tr = Number(taxRate || 0);
  const sc = Number(serviceCharge || 0);
  const taxAmount = roundTo2(subtotal * (tr / 100));
  const serviceAmount = roundTo2(subtotal * (sc / 100));
  const total = roundTo2(subtotal + taxAmount + serviceAmount);

  const breakdownMap = {};
  calculatedNightly.forEach(n => {
    const r = n.rate;
    breakdownMap[r] = (breakdownMap[r] || 0) + 1;
  });
  const breakdown = Object.entries(breakdownMap).map(([rate, count]) => ({
    rate: Number(rate),
    count,
    amount: roundTo2(Number(rate) * count)
  })).sort((a, b) => b.rate - a.rate);

  return {
    ok: true,
    nightly: calculatedNightly,
    breakdown,
    subtotal,
    taxAmount,
    serviceAmount,
    total,
    avgNightly: nights > 0 ? roundTo2(subtotal / nights) : 0
  };
}
// ================= EXPENSES HELPERS =================

export const expTodayStr = () => {
  return new Date().toISOString().slice(0, 10);
};

export const expStartOfMonthStr = () => {
  const d = new Date();
  // أول يوم في الشهر الحالي
  const start = new Date(d.getFullYear(), d.getMonth(), 1);
  // ضبط التوقيت لتفادي مشاكل المنطقة الزمنية (اختياري، هنا نستخدم UTC string simple)
  const offset = start.getTimezoneOffset() * 60000; 
  return new Date(start.getTime() - offset).toISOString().slice(0, 10);
};

export const expStartOfYearStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-01-01`;
};

export const expNormalizeYMD = (v) => {
  if (!v) return "";
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === "string") return v.slice(0, 10);
  return String(v).slice(0, 10);
};

export const expInInclusiveRange = (dateStr, fromStr, toStr) => {
  if (!dateStr) return false;
  const d = dateStr.slice(0, 10);
  // لو fromStr فاضي نعتبره متاح من البداية، ولو toStr فاضي نعتبره متاح للنهاية
  if (fromStr && d < fromStr) return false;
  if (toStr && d > toStr) return false;
  return true;
};

// دالة لحفظ المصاريف في LocalStorage (اختيارية لو مش موجودة)
export const expSave = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error("Save failed", e);
  }
};
// 👇 أضف هذا الكود في نهاية ملف helpers.js 👇

export const isDateBetween = (date, start, end) => {
  if (!date || !start || !end) return false;
  const d = new Date(date).setHours(0,0,0,0);
  const s = new Date(start).setHours(0,0,0,0);
  const e = new Date(end).setHours(0,0,0,0);
  return d >= s && d <= e;
};