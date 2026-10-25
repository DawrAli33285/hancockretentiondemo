# Start here (developer handoff)

This zip is the Retention app branded for **Hancock Health**, with fictional hospital demo data (nurses, physicians, nurse practitioners, clinical and support staff). It is the same dashboard as the October 12 build (leadership summary, savings scenario, cost by role, pressure map, Data and security tab), with its own database built in: React front end, Express API and database, deployed as one Vercel project. See `CHANGES.md` ("Hancock Health edition").

## Branding (done)
- **Logo:** the official Hancock Health logo is `public/brand/logo.png` (header and sign-in page). Favicon and phone icon: `public/favicon.png`, `public/apple-touch-icon.png`, cut from the same logo.
- **Colors** (sampled from the logo): Hancock orange `#ef7724` and charcoal `#565757`, set once in `tailwind.config.js` (`brand`). Buttons and links use a deeper orange (`#bb5711`) so white text stays readable; the header, headings and dark panels are charcoal. Neutral data bars are charcoal so they are never confused with the amber "Watch" color.
- Name, tagline and footer credit: `src/lib/brand.js` (or the `VITE_BRAND_*` / `VITE_POWERED_BY` variables). Server-side name (emails, Excel report): `BRAND_NAME`, default Hancock Health.

## The database is included
- `database/hancock-starter.db` is the database that ships with the app. It already contains every table and the test login below.
- The first time the app starts, it copies that file to `data/hancock.db` and works on the copy. Nothing to install, create or migrate.
- It is a standard SQLite file; any SQLite viewer (for example DB Browser for SQLite) can open it.
- Start over at any time with `npm run db:reset`.

## Logins (each has $1,000.00 of test credits)
- `shipmate2134@gmail.com` / `12345678`: administrator (PrognostiCare).
- `jwoods@hancockhealth.org` / `Hancock2027`: Hancock Health **client** login. Sees only its own uploads and results, no Admin pages. One current-staff run per month (an administrator can allow extra runs under *Admin > Clients & users*); pre-hire candidates are each scored once.
- Signing in opens the Home page. Change the short `12345678` test password (Account, top right) before the app is shared beyond the demo.
- These logins load into a new hosted database automatically on its first start. If the hosted database already has accounts, add the Hancock login under *Admin > Clients & users* instead.

## 1. Run it on your computer (2 minutes)
Needs Node.js 22.13 or newer (the current LTS is fine).
```
npm install
npm run dev
```
Open http://localhost:5173 and sign in with the test login.

## 2. Hancock Health demo (what to run for the walkthrough)
1. Sign in as `jwoods@hancockhealth.org` so the results belong to Hancock's account (runs made by the administrator are not visible to the client login). The sample files can also be downloaded from the Upload page.
2. Upload `samples/Hancock Health - Current Staff Demo.xlsx` under **Current staff** first. 216 rows: 169 active people are scored, and the 47 who left in the last 12 months build the turnover table by job class.
3. Then upload `samples/Hancock Health - Pre-hire Demo.xlsx` under **Pre-hire** (20 candidates, in Hancock's pre-hire column layout).

Everyone in these files is fictional (example.com emails, 555-01xx phones). Roles: Staff Nurse RN (five units), Nurse RN Outpatient, LPN, Hospitalist, Family Medicine and Emergency Physicians, Nurse Practitioner, Patient Care Tech, ER Tech, Medical Assistant, Respiratory Therapist, Radiologic and Surgical Technologists, Pharmacy Technician, Housekeeper, Nutrition Technician, Patient Access Advocate and Public Safety Officer. Each row has a commute distance, so no address lookup is needed. The CSV copies in `samples/` and the sample downloads on the Upload page hold the same data. Regenerate with `node scripts/make-hancock-samples.js`.

Administrator logins can run as many staff files per month as needed; the one-run-per-month rule applies to client accounts. A client account needs about $500 in credits for the staff file (169 people scored).

**Cost per exit.** Replacement benchmarks are set for hospital roles in `src/lib/financial.js` and are editable on the Financial impact tab: staff RN $61,110 (2025 NSI National Health Care Retention & RN Staffing Report), physician $500,000 and nurse practitioner $85,000 (estimates), other roles $5,000 to $30,000 (estimates). Lost productivity adds 18% of annual salary.

## 3. Deploy to Vercel
1. Push this folder to a new private GitHub repo and import it into Vercel. Vercel detects Vite; no build settings to change.
2. **Add a permanent database (one click, free tier). Required, do not skip.** In the Vercel project: *Storage > Create Database > Neon (Postgres) > Connect*. Vercel sets `DATABASE_URL` for you. On first start the app creates its tables and copies the test login in by itself.
3. Deploy, then open `/api/health`. It should show `"ok": true` and `"kind": "postgres"`.
4. Sign in with the test login and change the password.

Why step 2: Vercel can run the app on several servers at once, and none of them has a permanent disk. Without a connected database each server keeps its own copy of the data, so a file uploaded on one server can be missing on the next request, and everything resets when Vercel restarts. Sign-ins now hold across servers either way, but uploads and results need the database. The on-screen notices are switched off for the demo, so check `/api/health` (`"kind": "postgres"`) or the Database line on the Admin page (it must not say "temporary").

## Demo presentation settings
- Prices, credits and the Invoices page are hidden from client screens, and the three notices at the top of the page (demo mode, short password, temporary database) are off. Admin pages still show the database status.
- To turn them back on, set `SHOW_PRICING=true` and/or `SHOW_NOTICES=true` in Vercel environment variables and redeploy.
- Matched phrases and links to individual social profiles are hidden on screen and in exports. `SHOW_EVIDENCE=true` shows them again.
- Credits are still checked behind the scenes, so each account needs enough credit to run a file (the test login has $1,000; the Hancock staff file uses $498.55).

Recommended environment variable: `APP_URL` (the public address, used in password-reset emails). Branding can be overridden with the `VITE_BRAND_*` and `BRAND_NAME` variables in `.env.example`; the defaults are already Hancock Health.

## 4. Test checklist
1. Run the Hancock Health demo above.
2. Upload the staff file again and confirm the monthly-limit message.
3. Download the Excel report from a finished run.

Without `PDL_API_KEY` and `RAPIDAPI_KEY` the app runs in clearly labeled demo mode (simulated social signals). Do not add live keys or real client data until Roosevelt confirms.

## Security, before going live
- Rotate every key from the old `backendtwo` code: MongoDB user, Cloudinary, Gmail app password, RapidAPI, both People Data Labs keys, Social Searcher, Stripe, Airtable, JWT secret. The old code published them.
- Change both test passwords.
- `data/` is in `.gitignore` so a local database with uploads is never committed.

## Read next
- `README.md`: full setup, how scoring works, compliance notes
- `CHANGES.md`: everything fixed or changed
- Tests: `npm test` (runs on the built-in database; add `TEST_DATABASE_URL=postgres://...` to run the same tests on Postgres)
