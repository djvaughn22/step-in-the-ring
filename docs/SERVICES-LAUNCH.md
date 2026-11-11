# Build it with us: services launch (2026-11-10)

Read this before changing `/services`, Made here (`/builds`), `/request` or the inquiry flow.
Business planning material (economics, scenarios, conflict screening, Stripe
setup, templates) is private and lives in the git-ignored `private/business/`
folder on the owner's machine, because this repository is public.

## What changed

- **Home:** "Bring your idea to life. Have an idea? Let's build it." Two paths
  in the hero: Build it with us (to `/services`) and Build it yourself (focuses
  the idea box, unchanged). A short services strip follows. The examples,
  tools, engines, proof, help and final invitation all stay. Six sections max.
- **`/services`:** four introductory services, how it works, what's not
  included, optional care plans (described, not sold), a Build it yourself
  door, and the independence notice.
- **Made here (`/builds`):** the portfolio. Every live, presentable Open
  Mirror project in four groups, from one list in `app/work/work.ts`, with the
  real games and sports pages inside iDontCry named and linked. The page says
  they are Open Mirror's own projects, not client work. `/work` redirects here
  (Nov 10: the old Our work and Made here lists disagreed). Outside addresses
  must belong to a live `ECOSYSTEM` project (a test enforces it). The home page
  shows the entries marked `featured`.
- **`/request`:** the project request form.
- **`/owner/inquiries`:** owner-only list of requests (also a tile in the owner hub).
- **Nav:** Create · Services · How it works · Tools · Your work · Made here.
- **Footer and About:** the owner's independence notice, word for word
  (`INDEPENDENCE_NOTICE` in `app/services/offers.ts`). About gains "Two ways
  to build" and "Who builds it".

## Where things live

| Thing | File |
|---|---|
| Every service price, the care plans, form choices, the notice | `app/services/offers.ts` (the only file the price guard allows) |
| Portfolio entries (Made here and the home page) | `app/work/work.ts`, cards in `app/work/Portfolio.tsx` |
| Validation and the owner email | `app/members/projectInquiry.ts` |
| API | `app/api/inquiry/route.ts` |
| Storage | `project_inquiries` table; `PROJECT_INQUIRIES_DDL` in `app/members/store.ts`, created on first use; `migrations/006_project_inquiries.sql` |

## How a request travels

1. The form posts JSON (or a plain form without JavaScript; `method="post"`
   keeps words out of the URL either way).
2. Rate limit: 4 per 10 minutes per address. Honeypot field `nickname` and a
   3-second minimum fill time drop bots quietly without storing anything.
3. Server validation; errors come back per field.
4. Saved to Postgres. Only then does the page show the thank-you.
5. After the response, the owner gets an email through Resend
   (`RESEND_API_KEY`, `MEMBER_EMAIL_FROM`, to `OWNER_NOTIFICATION_EMAIL` or
   ask@openmirrorllc.com). If the email fails, the request is still saved and
   visible at `/owner/inquiries`. The visitor gets no automatic email.
6. With no `DATABASE_URL`, the form says requests can't be received and gives
   the email address. It never pretends.

Nothing typed is logged or sent to analytics. The only usage event is
`project-request` with the chosen service id.

## Rules

- Prices are introductory; every page says a written quote comes first.
- No checkout, subscription, or payment anywhere on the site. Billing happens
  by invoice after a written quote (Stripe not set up).
- No unlimited revisions, 24/7 support, guaranteed uptime, invented clients,
  testimonials or numbers. `app/services/services.test.ts` enforces this.
- Never name an employer. The notice stays word for word.

## Rollback

Local tag `live-before-services-20261110` is the commit before this work.
