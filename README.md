<div align="center">

# Nail Bar — Appointment Booking App

**Online booking for a nail salon, with a full admin dashboard.**

Clients browse free slots and book in seconds — the owner manages everything from a protected dashboard.

<br/>

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?logo=supabase&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?logo=vercel&logoColor=white)
![Private](https://img.shields.io/badge/license-Proprietary-red)

</div>

> [!IMPORTANT]
> **Private / proprietary project.** This source code is confidential and is **not** intended
> for public distribution or reuse without the owner's permission.

---

## Overview

| | |
|---|---|
| **Book online** | Clients pick a free slot from a calendar and book instantly |
| **Admin dashboard** | Manage slots, appointments, services, calendar & stats |
| **Insights** | Charts and Excel exports for appointments |
| **GDPR-ready** | Auto-anonymize personal data older than 12 months |

---

## Tech stack

<table>
<tr><td><b>UI</b></td><td>React 19 · TypeScript</td></tr>
<tr><td><b>Tooling</b></td><td>Vite</td></tr>
<tr><td><b>Styling</b></td><td>Tailwind CSS v4 (<code>@theme</code> / <code>@utility</code> in <code>src/index.css</code>)</td></tr>
<tr><td><b>Routing</b></td><td>React Router v7</td></tr>
<tr><td><b>Backend / Auth</b></td><td>Supabase (PostgreSQL + Auth)</td></tr>
<tr><td><b>Charts</b></td><td>Recharts</td></tr>
<tr><td><b>Excel export</b></td><td><code>xlsx</code> (dynamically imported)</td></tr>
<tr><td><b>Contact form</b></td><td>Formspree</td></tr>
<tr><td><b>Hosting</b></td><td>Vercel</td></tr>
</table>

---

## Getting started

**Requirements:** Node.js 18+ · npm · a Supabase project

```bash
# 1. Install dependencies
npm install

# 2. Create your local environment file
cp .env.example .env      # then fill in the values

# 3. Start the dev server
npm run dev               # → http://localhost:5173
```

Production build:

```bash
npm run build && npm run preview
```

---

## Environment variables

All variables are inlined at build time by Vite and **must** be prefixed with `VITE_`.
Copy [`.env.example`](.env.example) → `.env`.

| Variable | Required | Description |
|---|:---:|---|
| `VITE_SUPABASE_URL` | Supabase project URL (`https://xxxx.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | Supabase public (anon) API key |
| `VITE_ADMIN_EMAILS` | Comma-separated emails allowed into the dashboard |

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the dev server with hot reload |
| `npm run build` | Type-check (`tsc -b`) + production build into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run ESLint |

---

## Backend (Supabase)

The client talks to Supabase directly using the anon key.

| Object | Type | Purpose |
|---|---|---|
| `available_slots` | table | Bookable time slots (date, start/end time, duration) |
| `appointments` | table | Client bookings (name, phone, Instagram, status, linked slot) |
| `services` | table | Salon services (name, price, duration, type) |
| `book_slot` | RPC | Atomically books a slot and creates the appointment |

> Row Level Security (RLS) policies enforce what the anon key can read/write — keep them in
> mind when changing queries.

---

## ☁️ Deployment

Deployed on **Vercel** — every push triggers `npm run build`, and `dist/` is served as a static SPA.

<details>
<summary>Deployment checklist</summary>

- [ ] `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_ADMIN_EMAILS` set in Vercel
- [ ] Redeploy after changing any env var (values are inlined at build time)
- [ ] `npm run build` passes locally before pushing

</details>

---

## Routes

| Path | Page |
|---|---|
| `/` | Booking (home) |
| `/prices` | Price list |
| `/despre` | About |
| `/contact` | Contact |
| `/programarea-mea` | Manage my appointment |
| `/termeni-si-conditii` | Terms & conditions |
| `/politica-de-confidentialitate` | Privacy policy |
| `/admin` | Admin dashboard (protected) |
| `*` | Not found |

---

## Project structure

```
public/          # static images and favicons (favicon.ico, apple-touch-icon.png, …)
src/
├─ components/   # reusable UI (BookingForm, MonthCalendar, DaySlots, modals, …)
├─ hooks/        # data hooks (useAppointments, useAdminSlots, useServices, useAuth)
├─ lib/          # Supabase client initialization
├─ pages/        # route pages (BookingPage, ContactPage, AdminPage + tabs, …)
├─ types/        # shared TypeScript types
├─ utils/        # helpers (dateUtils, …)
└─ index.css     # Tailwind theme and global styles
index.html       # meta tags, favicons, Content-Security-Policy
```

---

## Features

<table>
<tr>
<td valign="top" width="50%">

**Public**
- Browse free slots on a calendar & book
- "My appointment" page to manage a booking
- About · Contact · Prices · Terms · Privacy

</td>
<td valign="top" width="50%">

**Admin dashboard** 🔐
- Appointments: upcoming / past / cancelled + Excel export
- Calendar: month / week / day views
- Slots: single add & bulk generation
- Services: create / edit / delete
- Statistics: charts
- GDPR: anonymize data > 12 months old

</td>
</tr>
</table>

---

## Development conventions

- **Tailwind v4** — `@theme` / `@utility` in `src/index.css` may cause false-positive linter warnings; ignore them.
- **Excel export** (`xlsx`) is dynamically imported to keep the initial bundle small.
- Run `npm run build` before shipping to validate types & the build.
- A chunk-size warning (>500 kB) on build is expected.

---

## Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| App crashes on load (missing-env error) | `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` not set |
| Can't access `/admin` after login | Your email isn't in `VITE_ADMIN_EMAILS` |
| Env change not reflected on Vercel | Redeploy — env vars are inlined at build time |
| Contact form not sending | Check the Formspree ID in `src/pages/ContactPage/ContactPage.tsx` |

---

## License

This project is **proprietary and confidential**. All rights reserved.
See the [`LICENSE`](LICENSE) file for the full terms. No use, reproduction, or
distribution is permitted without the copyright holder's prior written consent.

---

<div align="center">
<sub>© Nail Bar — Private project. All rights reserved.</sub>
</div>
