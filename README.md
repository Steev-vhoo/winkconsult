# WiNK CONSULT website and admin dashboard

The public website for WiNK CONSULT, plus a private dashboard where WiNK's staff manage enquiries, bookings, classes and website content.

- **Public site:** Home, About, Services, Classes & booking, Updates (blog), FAQ, Contact
- **Admin dashboard** (`/admin`):
  - **Enquiries:** inbox for the contact form, with status, internal notes, a WhatsApp reply button and CSV export
  - **Email alerts:** staff get an email for every new enquiry, with the message, a WhatsApp reply button and a link to the dashboard
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
| Database | Postgres on Neon (free tier, via Vercel Storage) | Free |
| Images | Vercel Blob (free tier) | Free |
| Hosting | Vercel Hobby (free tier) | Free |
| Email alerts | Resend (free tier: 3,000 emails/month) | Free |
| Domain | e.g. `winkconsult.com` | ~$10–15 / year |

There are no other paid services.

![New enquiry email alert](docs/email-alert.png) Logins, sessions and spam protection are built into the app, so it runs on any Postgres database.

## Run it locally

You need Node 20 or newer and a Postgres database (local Postgres, or a free Neon database).

```bash
npm install
cp .env.example .env.local      # then fill in DATABASE_URL and APP_SECRET
npx tsx scripts/prepare-db.ts   # create tables and load WiNK's starting content
ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='a-long-password' ADMIN_NAME='Your Name' npm run admin:create
npm run dev                     # http://localhost:3000, admin at /admin
```

Image uploads need `BLOB_READ_WRITE_TOKEN`. Copy it from the Blob store in Vercel; without it, the upload fields are switched off.

## Deploy to production (free tier)

Everything is set up from the Vercel dashboard. You don't need to run any commands.

### 1. Connect the database and image storage

In the Vercel project, open **Storage**:

1. **Create Database → Neon (Serverless Postgres)**. Pick the region closest to Ghana, such as **AWS Europe West 2 (London)**. Connect it to this project for **Production** and **Preview**. This adds `DATABASE_URL` and `DATABASE_URL_UNPOOLED` automatically.
2. **Create → Blob**. Connect it to this project for **Production** and **Preview**. This adds `BLOB_READ_WRITE_TOKEN` automatically.

### 2. Environment variables

In **Settings → Environment Variables**, add these for **Production** and **Preview**:

- `APP_SECRET`: a long random string; generate one with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- `SITE_URL`: e.g. `https://www.winkconsult.com` (used for links in alert emails and the sitemap)
- `ADMIN_EMAIL`, `ADMIN_PASSWORD` (at least 10 characters) and `ADMIN_NAME`: the first admin account. It's created on the first deploy, and only if no accounts exist yet. After you've signed in and changed the password under **My password**, you can delete `ADMIN_PASSWORD`.
- `RESEND_API_KEY` and `EMAIL_FROM`: for email alerts (see below)

### 3. Deploy

Deploy, or redeploy from **Deployments**. Every build first runs `scripts/prepare-db.ts`, which:

- applies any new database migrations (`db/migrations/*.sql`)
- loads WiNK's starting content (services, FAQs, settings) on the very first deploy only, so anything staff delete in the dashboard stays deleted
- creates the first admin from `ADMIN_EMAIL` / `ADMIN_PASSWORD` if there are no accounts

The site runs in Vercel's London region (`lhr1`), close to a London Neon database and to visitors in Ghana. Neon's free tier sleeps when idle and wakes automatically on the next visit, which adds a moment's delay to the first page load.

### 4. Email alerts: Resend

1. Create a free account at [resend.com](https://resend.com) and create an API key. Add it to Vercel as `RESEND_API_KEY`.
2. Under **Domains**, add WiNK's domain and create the DNS records Resend lists. Then set `EMAIL_FROM` to an address on that domain, e.g. `WiNK Website <alerts@winkconsult.com>`.
   - Until a domain is verified, Resend only sends from `onboarding@resend.dev`, and only to the email address you signed up to Resend with. That's enough for a first test.
3. Redeploy. Then, in the dashboard, open **Site settings → Email alerts**, enter the addresses that should get alerts (one per line), save, and press **Send a test email**.

Each enquiry shows whether its alert was sent. If sending failed (for example during an outage), staff can press **Send alert** to try again. Email problems never stop a visitor's enquiry from being saved.

### 5. Domain

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
- **Images:** upload a cover image for each update, and use **Insert image** in the editor to add photos inside the article. Under **Site settings → Home page**, upload the hero photo. Use JPG, PNG, WebP or GIF, up to 4 MB.
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
- Uploads are limited to signed-in staff and to JPG, PNG, WebP or GIF up to 4 MB. The server checks each file's actual contents, not just its name. SVG is refused because it can contain scripts. Replaced or deleted images are removed from storage.

## Not included yet

- **Alerts for bookings, and SMS alerts.** Only new enquiries trigger an email. Bookings could use the same mechanism.
- **Online payments.** Booking confirmations ask clients to pay by MoMo or bank transfer; Paystack could be added later.
