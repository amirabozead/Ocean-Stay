/**
 * Create a Supabase Auth user + public.app_users profile (needs service_role; never ship this key to the browser).
 *
 *   set SUPABASE_URL=https://xxxx.supabase.co
 *   set SUPABASE_SERVICE_ROLE_KEY=****
 *   node scripts/create-app-user.mjs --email=hossam@yourdomain.com --password=Hossam@2026 --full-name=Hossam
 *
 * Optional: --role=admin (default full access) or --role=front_office (all pages except Rate Analysis, Reports, Settings)
 */

import { createClient } from "@supabase/supabase-js";

function parseArgs() {
  const out = {};
  for (const a of process.argv.slice(2)) {
    const m = a.match(/^--([^=]+)=(.*)$/);
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return out;
}

// Must stay in sync with src/data/constants.js ROLE_DEFAULT_PAGES (admin vs front_office).
const ADMIN_ALLOWED_PAGES = [
  "dashboard",
  "reservations",
  "rooms",
  "dailyRate",
  "revenue",
  "store",
  "expenses",
  "reports",
  "settings",
];

/** Matches ROLE_DEFAULT_PAGES_FRONT_OFFICE: all modules except Rate Analysis, Reports, Settings. */
const FRONT_OFFICE_ALLOWED_PAGES = [
  "dashboard",
  "reservations",
  "rooms",
  "revenue",
  "store",
  "expenses",
];

async function findUserIdByEmail(admin, emailNorm) {
  let page = 1;
  const perPage = 200;
  for (;;) {
    const { data, error } = await admin.listUsers({ page, perPage });
    if (error) throw error;
    const hit = data.users.find((u) => String(u.email || "").toLowerCase() === emailNorm);
    if (hit) return hit;
    if (!data.users?.length || data.users.length < perPage) return null;
    page += 1;
  }
}

const flags = parseArgs();
const email = flags.email || process.env.CREATE_USER_EMAIL;
const password = flags.password || process.env.CREATE_USER_PASSWORD;
const fullName = flags["full-name"] || flags.fullName || process.env.CREATE_USER_FULL_NAME || "Hossam";
const rawRole = String(flags.role || "admin").trim().toLowerCase();
const role =
  rawRole === "frontoffice" || rawRole === "front_office" ? "front_office" : rawRole.replace(/-/g, "_");

const allowedPages = flags.pages
  ? JSON.parse(flags.pages)
  : role === "front_office"
    ? FRONT_OFFICE_ALLOWED_PAGES
    : ADMIN_ALLOWED_PAGES;

const url = flags.url || process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  console.error('Get URL + anon in Vite env; service role key is ONLY in Dashboard → Settings → API (server-side).');
  process.exit(1);
}
if (!email || !password) {
  console.error("Usage: node scripts/create-app-user.mjs --email=you@domain.com --password=Secret --full-name=\"Name\"");
  process.exit(1);
}

const emailNorm = String(email).trim().toLowerCase();
const sb = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
const admin = sb.auth.admin;

let userId;

const existing = await findUserIdByEmail(admin, emailNorm);
if (existing) {
  userId = existing.id;
  console.log(`Auth user already exists: ${emailNorm} (${userId})`);
} else {
  const { data, error } = await admin.createUser({
    email: emailNorm,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (error) {
    console.error("createUser failed:", error.message);
    process.exit(1);
  }
  userId = data.user?.id;
  if (!userId) {
    console.error("Unexpected: no user id from createUser");
    process.exit(1);
  }
  console.log(`Created Auth user: ${emailNorm} (${userId})`);
}

const row = {
  id: userId,
  email: emailNorm,
  full_name: fullName,
  role,
  allowed_pages: allowedPages,
};

const { error: upErr } = await sb.from("app_users").upsert(row, { onConflict: "id" });
if (upErr) {
  console.error("app_users upsert failed:", upErr.message);
  console.error("Check RLS bypass (service_role) and that public.app_users exists.");
  process.exit(1);
}

console.log(`Upserted public.app_users for ${fullName} (${role}). Sign in via Supabase login in the app with this email/password.`);
