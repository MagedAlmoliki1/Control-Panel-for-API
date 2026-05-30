# AI Coding Prompt — Software Sales & Management Control Panel

> **How to use:** Paste this entire prompt into your AI coding tool (Claude Code, Cursor, v0, Lovable, Bolt, etc.). If the tool builds incrementally, feed it section by section starting from "Phase 0". The product UI is **Arabic, right-to-left (RTL)**; this prompt is written in English only because coding tools parse English instructions more reliably.

---

## 1. ROLE & CONTEXT

You are a senior full-stack engineer. Build a **production-grade, multi-tenant admin/sales control panel** for a business that sells subscriptions to a software product. The owner currently manages everything **manually** by calling an external API by hand (adding users, activating, suspending). Your job is to replace that manual workflow with a clean visual dashboard that wraps the external API.

**Critical business context (do not skip):**
- A previous developer *failed* to make the system extensible — it could not integrate other/3rd-party programs. Therefore the API integration layer MUST use a **pluggable adapter (provider) pattern** so new external programs can be added later without rewriting the app.
- The **official external API documentation is NOT yet available**. Build against a **mock API adapter** that implements a clear interface, so all features work end-to-end today and the real API can be swapped in by changing one adapter file. Never block a feature on the missing docs.

---

## 2. PRODUCT SUMMARY

A web app where an **Admin (owner)** and **Sellers (sub-resellers)** manage software subscriptions: add customers, activate/suspend/renew subscriptions via the external API, view login logs, record manual payments, and track revenue and seller performance — all through an Arabic RTL interface usable on desktop and mobile.

End customers do **not** log in; they are data records only.

---

## 3. TECH STACK (recommended default — keep unless told otherwise)

- **Framework:** Next.js (App Router) + TypeScript
- **Styling:** Tailwind CSS, configured for **RTL** (`dir="rtl"`, logical properties). Arabic font (e.g. Cairo / IBM Plex Sans Arabic).
- **Database:** PostgreSQL via **Prisma ORM**
- **Auth:** session-based auth with role claims (NextAuth credentials provider or equivalent). Passwords hashed with **bcrypt**.
- **Charts:** Recharts
- **Tables/exports:** server-side filtering/pagination; CSV + Excel export (e.g. `xlsx` / `papaparse`)
- **Validation:** Zod on all inputs (client + server)
- **HTTP to external API:** isolated in `/lib/api/` behind an interface (see §7)

> If the user later specifies Laravel/PHP or Python, port the same architecture; do not change the feature set.

---

## 4. ROLES & PERMISSIONS

Two login roles: **Admin** and **Seller**. Enforce permissions on **both** the UI and the server (never trust the client). A Seller can only ever see/affect **their own** customers, sales, and logs.

| Capability | Admin | Seller |
|---|---|---|
| Login to panel | ✔ | ✔ |
| Add customer | ✔ | ✔ |
| Activate subscription via API | ✔ | ✔ |
| Suspend / renew / edit customer | ✔ (all) | ✔ (own only) |
| View customer list | ✔ (all) | ✔ (own only) |
| View login logs | ✔ (all) | ✔ (own only) |
| Record a payment/sale | ✔ | ✔ |
| View total revenue | ✔ | ✔ (own sales only) |
| Add / disable / edit sellers | ✔ | ✘ |
| Set subscription prices / allowed price list per seller | ✔ | ✘ |
| View seller performance reports | ✔ | ✔ (own) |
| System & API settings | ✔ | ✘ |
| Export data (Excel/CSV) | ✔ | ✔ (own) |

---

## 5. FUNCTIONAL REQUIREMENTS (by module)

### 5.1 Customer Management
- **Add customer:** name, subscription duration, send activation request to API with `base_id` + `username`; store record in DB. *(highest priority)*
- **Duration options:** 2 hours, 1 day, 3 days, 1 week, 1 month, 3 months, 6 months, 1 year. *(highest)*
- **Auto-suspend on expiry:** when the subscription end time passes, automatically call the API delete/disable endpoint. Implement with a scheduled job / cron worker. *(highest)*
- **Manual renew:** Admin/Seller selects customer + new duration. *(highest)*
- **Customer list columns:** name, base_id, start date, end date, status (active/expired/suspended), seller name. *(high)*
- **Search & filter:** by name, status, expiry date, responsible seller. *(high)*
- **Edit customer:** name, notes, linked seller. *(medium)*
- **Auto-alert:** customers expiring within the next 3 days (shown on dashboard). *(medium)*
- **Full renewal history per customer.** *(medium)*
- **Permanently delete customer** (also disabling API access). *(low)*

### 5.2 Activity / Login Logs
- Fetch & display customer login logs from API: login time (date + time), IP address, session duration. *(high)*
- Filter logs by customer name, date range (from/to), IP. *(high)*
- Show last login per customer in the customer list. *(medium)*
- Export logs to CSV. *(medium)*
- Highlight logins from a new/unrecognized IP. *(low — phase 2)*

### 5.3 Revenue & Sales
- **Record a manual payment:** customer, amount, currency, purchased duration, responsible seller, payment method, notes. *(highest)*
- **Auto-link payment to activation/renewal** of that customer's subscription. *(highest)*
- Total revenue with filters: date range, seller, duration, currency. *(high)*
- Dashboard quick stats: revenue today / this week / this month / this year. *(high)*
- Detailed payments table: transaction #, customer, seller, amount, date, duration. *(high)*
- Monthly sales bar chart (compare months). *(medium)*
- Export revenue report to CSV/Excel. *(medium)*
- Track each seller's sales separately with filtering. *(high)*

### 5.4 Seller Management (Admin only)
- **Add seller:** full name, username, password, phone, status. *(highest)*
- **Set allowed price list per seller** (Admin defines what each seller may sell and at what price). *(highest)*
- Each seller sees only their own customers, sales, and logs — strict isolation. *(highest)*
- Seller performance report: # customers added, total sales amount, prices used. *(high)*
- Enable/disable a seller account with one click. *(high)*
- View all sellers side-by-side with stats. *(medium)*
- Edit seller data and prices anytime. *(medium)*
- Seller activity log: last login, # operations today. *(low)*

### 5.5 Main Dashboard
- Summary cards: total active customers, expired customers, today's revenue, this month's revenue. *(highest)*
- List of customers expiring within the next 3 days. *(high)*
- Last 10 sale/activation operations with details. *(high)*
- Daily sales chart for the current week. *(medium)*
- Indicator of active sellers and customer count per seller. *(medium)*

---

## 6. REQUIRED SCREENS (UI)

1. **Login** — username + password, auto-detect role and route to correct view, clear error messages, "remember me" for 7 days.
2. **Main Dashboard** — 4 summary cards, "expiring soon (3 days)" table, last-10-sales table, 7-day sales chart, seller performance summary.
3. **Customers** — full table with color-coded status (green=active / red=expired / yellow=expiring soon), "Add Customer" popup with all fields, per-row buttons (renew / suspend / edit / view log), instant search + multi-filters, days-remaining per customer.
4. **Logs** — table (customer / date-time / IP), filter by customer/date/IP, CSV export, visual flag for new IPs.
5. **Revenue** — cards (today/week/month/year), "Record Payment" popup, detailed payments table with filters, monthly sales chart, export.
6. **Sellers (Admin only)** — seller list (name, # customers, total sales, status), "Add Seller" with allowed prices, one-click enable/disable, seller detail page (their sales/customers/reports).
7. **Settings (Admin only)** — API config (Base URL, API Key, auth keys), price-plan management (add/edit/delete), change Admin password, alert settings.

**UI rules:** Full Arabic RTL, responsive (mobile/tablet/desktop), clear success/error toasts for every action.

---

## 7. EXTERNAL API INTEGRATION (pluggable adapter — most important architectural point)

Define a TypeScript interface `SubscriptionProvider` and place all external calls behind it. Ship a `MockProvider` (in-memory/fake responses) now; add real providers later **without touching feature code**.

```ts
// /lib/api/provider.ts
export interface SubscriptionProvider {
  addUser(input: { base_id: string; username: string; duration: string }): Promise<{ ok: boolean; raw?: unknown }>;
  removeUser(input: { username: string }): Promise<{ ok: boolean }>;
  listUsers(): Promise<ExternalUser[]>;
  getLogs(input: { user_id: string; date_from?: string; date_to?: string }): Promise<ExternalLog[]>;
  getUserStatus(input: { user_id: string }): Promise<ExternalStatus>;
  renewUser(input: { username: string; duration: string }): Promise<{ ok: boolean }>;
}
```

Proposed (UNVERIFIED) endpoints to model the MockProvider after — **must be confirmed against the partner's official docs before going live**:

| Purpose | Method | Endpoint (proposed) | Payload |
|---|---|---|---|
| Add/activate user | POST | `/api/add-user/` | base_id, username, duration |
| Delete/suspend user | DELETE | `/api/remove-user/` | username |
| List users | GET | `/api/users/` | — |
| Get login logs | GET | `/api/logs/` | user_id, date_from, date_to |
| Check user status | GET | `/api/user-status/{id}/` | user_id |
| Renew subscription | PUT | `/api/renew-user/` | username, duration |

Make auth method (API Key / Bearer / Basic), data format (JSON/XML), and rate limits all **configurable** from Settings, since they are not yet known. Centralize retries, timeouts, and error mapping in the adapter.

---

## 8. DATA MODEL (Prisma schema)

Implement these tables (extend as needed):

- **customers**: id, name, id_base, username, seller_id (FK), start_subscription, end_subscription, status (active/expired/suspended), notes, created_at
- **sales**: id, customer_id (FK), seller_id (FK), amount, currency, duration, payment_method, notes, created_at
- **sellers**: id, name, username, hash_password, phone, allowed_prices (JSON), status (active/inactive), created_at
- **subscription_history**: id, customer_id (FK), seller_id (FK), action (activate/renew/suspend), duration, start_date, end_date, created_at
- **audit_log**: id, user_id, action_type, changed_data (JSON), created_at
- (auth) **users/admins** table or a role flag distinguishing Admin from Seller

---

## 9. NON-FUNCTIONAL REQUIREMENTS

- **Security:** bcrypt password hashing; protect the external API key (server-side only, never exposed to client); prevent SQL injection & XSS (parameterized queries + output escaping); auto-logout after 30 min inactivity; HTTPS enforced; server-side authorization on every endpoint.
- **Performance:** any page loads in ≤ 2s; external API responses handled within ≤ 3s (with timeout + graceful error); support ≥ 20 concurrent users.
- **Reliability:** target ≥ 99% uptime; daily automated DB backup; documented restore path.
- **Usability:** full Arabic RTL; responsive on mobile/tablet/desktop; clear success/error feedback on every operation.
- **Extensibility:** architecture must allow future features (automated payment, mobile app, seller-facing API) **without a rewrite** — hence the adapter pattern and clean service boundaries.
- **Auditing:** log all Admin/Seller actions (user, timestamp, action type, changed data).
- **Compatibility:** latest Chrome, Firefox, Safari, Edge.

---

## 10. SUCCESS CRITERIA (verify before considering done)

- New customer fully activated in **< 60 seconds** from data entry.
- **100%** of expired subscriptions auto-suspended within 5 minutes of expiry.
- Every page loads in **< 2 seconds**.
- Revenue reports match manual records **100%**.
- A seller can complete a full sale unaided in **< 3 minutes**.
- No seller can ever see or modify another seller's data (verify with a test).

---

## 11. BUILD ORDER (phases)

- **Phase 0 — Foundation:** project setup, RTL + Arabic theme, Prisma schema + migrations, seed script, auth with Admin/Seller roles, `SubscriptionProvider` interface + `MockProvider`.
- **Phase 1 — Core:** Customers module (add/list/activate via mock + auto-suspend job), Dashboard cards.
- **Phase 2 — Sales:** payment recording linked to activation/renewal, revenue stats + charts, exports.
- **Phase 3 — Sellers:** seller CRUD, allowed-price lists, strict per-seller data isolation, performance reports.
- **Phase 4 — Logs & Settings:** login logs fetch/filter/export, settings (API config, price plans, alerts), audit log.
- **Phase 5 — Hardening:** security pass, performance pass, responsive QA, seed demo data, README with how to swap MockProvider for the real API.

Deliver clean, typed, commented code with a README explaining setup, environment variables, and exactly where/how to plug in the real partner API.

---

## 12. ASSUMPTIONS TO CONFIRM WITH THE CLIENT (don't block on these — pick a sensible default and note it)

- Accepted currencies (USD / SAR / USDT?) → default: multi-currency, configurable.
- Are seller prices fixed or editable per deal? → default: fixed to the allowed list.
- Commission system for sellers? → default: none for v1, schema left extensible.
- Hosting (VPS / Cloud / Shared)? → default: cloud-ready, env-driven config.
- Mobile app / offline support later? → not in v1, but architecture supports it.
