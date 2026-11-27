# WiNK CONSULT website and admin dashboard

The public website for WiNK CONSULT, plus a private dashboard where WiNK's staff manage enquiries, bookings, classes and website content.

- **Public site:** Home, About, Services, Classes & booking, Updates (blog), FAQ, Contact
- **Admin dashboard** (`/admin`):
  - **Enquiries:** inbox for the contact form, with status, internal notes, a WhatsApp reply button and CSV export
  - **Bookings:** class seats and consultation requests; confirm, cancel or complete them, send a WhatsApp confirmation, export to CSV
  - **Classes:** create IELTS, CBT and other classes with dates, fee and seat limits; the site shows live seats left and stops taking bookings when a class is full
  - **Updates:** write and publish blog posts with a Markdown editor and preview, including scheduled publishing
  - **Services and FAQs:** edit the text on the Services and FAQ pages (admins only)
  - **Site settings:** WhatsApp and phone numbers, email, opening hours (these drive the consultation time slots), home page text, destinations, and a notice bar (admins only)
  - **Staff accounts:** add staff, set roles, reset passwords, deactivate accounts

## Stack

| Part | Choice | Cost |
| --- | --- | --- |
| App | Next.js 15 (App Router, server actions), TypeScript | — |
| Database | Postgres (Supabase free tier in production) | Free |
| Hosting | Vercel Hobby (free tier) | Free |
| Domain | e.g. `winkconsult.com` | ~$10–15 / year |

There are no other paid services. Logins, sessions and spam protection are built into the app, so it runs on any Postgres database.

## Run it locally

You need Node 20 or newer and a Postgres database.

```bash
npm install
cp .env.example .env.local      # then fill in DATABASE_URL and APP_SECRET
npm run db:migrate              # create the tables
npm run db:seed                 # load WiNK's services, FAQs and settings
ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='a-long-password' ADMIN_NAME='Your Name' npm run admin:create
npm run dev                     # http://localhost:3000, admin at /admin
```

## Deploy to production (free tier)

### 1. Database: Supabase

1. Create a free project at [supabase.com](https://supabase.com). Pick the region closest to Ghana, such as **West EU (London)**.
2. Open **Project Settings → Database → Connection string**, choose **Transaction pooler** (port 6543), and copy it. This is your `DATABASE_URL`.
3. On your computer, put that URL in `.env.local` and run:
   ```bash
   npm run db:migrate
   npm run db:seed
   ADMIN_EMAIL=… ADMIN_PASSWORD=… ADMIN_NAME=… npm run admin:create
   ```
   Alternatively, paste `db/migrations/001_init.sql` into Supabase's **SQL Editor**.

The app connects as the database owner. The migration turns on row-level security, so Supabase's public API keys can't read these tables.

### 2. Hosting: Vercel

1. In [vercel.com](https://vercel.com), choose **Add New → Project** and import the `winkconsult` GitHub repository.
2. Add these environment variables:
   - `DATABASE_URL`: the Supabase pooler URL
   - `APP_SECRET`: a long random string; generate one with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
   - `SITE_URL`: e.g. `https://www.winkconsult.com`
3. Deploy. `vercel.json` sets up a daily health check. It keeps the free Supabase database from pausing, which happens after a week with no activity.

### 3. Domain

Buy the domain from any registrar. In Vercel, open **Project → Settings → Domains**, add it, and follow the DNS instructions.

## Guide for WiNK staff

- **Sign in** at `yourdomain.com/admin`.
- **New enquiries and bookings** show as green numbers in the sidebar. Open one, reply with the **WhatsApp** button, then set the status and add notes so the team knows what happened.
- **Bookings:**
  - Set a booking to **Confirmed** once payment or attendance is agreed.
  - **Cancelling** a class booking frees the seat on the website.
  - Use **Send confirmation on WhatsApp** to message the client a ready-written confirmation.
- **Classes:** add a class with its start date, fee and number of seats. Untick **Show on website** to hide it, or set **Registration** to **Closed** to stop new bookings.
- **Updates:** write a post and set it to **Published**. A future publish date schedules it. Changes appear on the site within about 5 minutes.
- **Settings** (admins only): changing the WhatsApp number updates every WhatsApp button on the site. Opening hours control which consultation times people can choose.

## Security notes

- Passwords are hashed with bcrypt (cost 12).
- Sessions are random tokens stored as SHA-256 hashes, in `httpOnly`, `SameSite=Lax` cookies that are `Secure` in production. They expire after 14 days.
- Sign-in locks for 15 minutes after 8 failed attempts from the same email or IP address.
- Every admin page and server action checks the session against the database, and admin-only actions also check the role. The middleware redirect is only a first gate.
- Server actions use Next.js's built-in origin check, which protects them against cross-site request forgery.
- The public forms check every field on the server, include a hidden honeypot field for bots, and accept at most 5 submissions per hour from one visitor. Visitor IP addresses are stored only as salted hashes.
- Markdown is rendered without raw HTML, so content can't inject scripts.
- CSV exports protect against formula injection in Excel and Google Sheets.
- Admin pages send `noindex` and `no-store` headers.

## Not included yet

- **Email or SMS alerts** for new enquiries. Staff currently check the dashboard; email alerts could be added later with a free service such as Resend.
- **Image uploads for posts.** Posts currently link to a cover image by URL; Supabase Storage could add uploads later.
- **Online payments.** Booking confirmations ask clients to pay by MoMo or bank transfer; Paystack could be added later.
