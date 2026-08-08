# Beta login notification

When someone gets through the private-beta door, the owner gets one plain email.

## The trigger

Exactly one event: a **successful beta admission** on `POST /api/members/login` —
correct shared beta password, email accepted, not revoked. The session is
created first; the notification goes out after.

Nothing else notifies. No page visit, no wrong password, no revoked email, no
rate-limited attempt, and no ordinary account-password login.

## What it says

```
Subject: Step In The Ring — Beta Login

A tester entered Step In The Ring.

Email entered:
person@example.com

Time:
2026-08-07 6:52 PM Central

Access:
Successful beta login

Tester:
New tester

Site:
https://stepinthering.com
```

The beta door does not prove the person owns that inbox, so the message says
**"Email entered"** — never verified, confirmed, or identified.

## What it never says

No beta password, no password hash, no session token or cookie, no database
identifiers, no request headers, no device fingerprint, no location. The
notification helper's input type has no field for any of them. Delivery
failures log a status-only line — never the address, never the provider body.

## Configuration (server-only)

| Variable | Required | Notes |
|---|---|---|
| `RESEND_API_KEY` | to send | Same Resend account the family already uses. |
| `MEMBER_EMAIL_FROM` | to send | Must be on a domain verified in Resend, e.g. `Step In The Ring <hi@crossheartpray.com>`. |
| `OWNER_NOTIFICATION_EMAIL` | no | Defaults to `ask@openmirrorllc.com`. Only set it to move the owner mailbox. |

With either of the first two missing the notification is **skipped** and login
is unaffected. That is the intended failure mode: mail is never allowed to
break authentication.

## Files

- `app/members/login-notification.ts` — the helper (message, recipient, Resend adapter).
- `app/api/members/login/route.ts` — the one call site, after the session exists.
- `app/members/login-notification.test.ts`, `app/api/members/login/beta-login-notify.test.ts` — tests.
