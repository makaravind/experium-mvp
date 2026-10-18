# Phone + OTP Login (m8-user-auth) — Design, Deferred

**Status:** DEFERRED. Designed 2026-10-18, not specced, not built. Blocked on India SMS delivery (DLT registration / provider choice). Revisit when that is unblocked; run `/spec` then.
**GitHub:** milestone [#18](https://github.com/makaravind/experium-ai-tour-app/milestone/18), issue [#35](https://github.com/makaravind/experium-ai-tour-app/issues/35) (body is empty; update it from this doc before starting).

Today's decision stays in force until then: anonymous-first, optional unverified name/phone/email, **no OTP in v1** (`docs/decisions.md`, "User identity").

---

## Current state (what exists, 2026-10-18)

- A visitor is a `users` row created by `POST /api/user/handshake`; its UUID lives in `localStorage` / the persisted store (`visitorId`). `lib/handshake-lock.ts` guards the cross-tab race.
- `scans` hangs off `users.id`. The trail count is `total_discovered(user)`: distinct QR codes with `discovered = true`. Device-side state (`discoveredCodes`, `scanQueue`, `visitedExhibits`, `totalDiscovered`) is in the persisted `experium-store`.
- The info/profile modal saves name/phone/email through `POST /api/user/info`, unverified and unauthenticated (anyone holding a visitor UUID can overwrite those fields).
- No Supabase Auth for visitors, and no `supabase/config.toml` in the repo.
- More menu (`components/more/UserMenu.tsx`) has disabled "Log out" / "Profile" placeholders.

---

## Decisions (from the 2026-10-18 grill)

| # | Decision |
|---|---|
| 1 | **Goal: both.** Restore progress (new phone / cleared storage) and capture verified leads. |
| 2 | **Ships behind a build-time flag** `NEXT_PUBLIC_PHONE_AUTH_ENABLED`, same pattern as `NEXT_PUBLIC_DEBUG_ENABLED`. Off: onboarding and More menu look exactly as today, and `/api/auth/*` returns 404 (server checks the same flag). Turning on is a Vercel env change + redeploy. |
| 3 | **Supabase Auth phone OTP.** New `users.auth_id` links the Supabase auth user to the existing `users` row. App identity stays the `users.id` UUID. |
| 4 | **Number already belongs to another `users` row → "Replace with account".** This device adopts that row and drops its own anonymous progress. Lossless at onboarding (no progress yet); lossy mid-visit. |
| 5 | **Entry points:** an onboarding step (skippable) plus a "Log in / Save progress" row in More. Skipped visitors stay anonymous and can log in later from the menu. |
| 6 | **Phone stored plain** in `users.phone` + `phone_verified_at`, with a separate unchecked `marketing_opt_in` checkbox and a consent line + privacy-policy link on the verify screen. Overrides the "hashed after OTP" line in `docs/tech-architecture.md`. |
| 7 | **Use the session once, then drop it.** Browser verifies the OTP, then calls `POST /api/auth/claim` with the access token + current `visitorId`; the server validates the token, links or replaces the row, returns the canonical `visitorId` + a progress snapshot; the client signs out locally. No change to `/api/scan`, the scan queue or handshake. |
| 8 | **"Log out" = "Forget this device".** After a confirm: clear `visitorId`, progress, queued scans and the saved profile locally; next load makes a fresh anonymous visitor. The server account stays and comes back after re-verifying. The row shows "Logged in · +91 ••• 1234" while a verified number is linked. |
| 9 | **Replace warning:** static banner in the same modal on the OTP-entry step, shown only when the device has progress (`totalDiscovered > 0`): "If this number already has saved progress, it replaces the progress on this phone." No server dry run. |
| 10 | **Abuse protection: Supabase defaults only** (decided before the SMS research). **Revisit before enabling the flag**, see "Revisit checklist". |

### Defaults assumed (confirm when specced)

- Flush the scan queue **before** claiming. On "replace", clear local `scanQueue`, `discoveredCodes`, `visitedExhibits`, then rebuild them from the server snapshot (built from `scans`; `visitedExhibits` from `listened` rows mapped QR → exhibit id).
- Keep the abandoned anonymous `users` row and its scans (analytics stay intact; nothing deleted).
- Offline: login rows disabled with "Needs connection" (like Refresh content). Failures (wrong code, resend cooldown, too many tries) are visible and non-blocking.
- With the flag on, the profile modal's phone field becomes the verify flow. Existing unverified phone values stay with `phone_verified_at` null.
- Tests: vitest for claim/merge logic; Playwright with the Supabase auth endpoints mocked.

### Suggested split of #35 when picked up

1. DB migration: `users.auth_id` (unique), `phone_verified_at`, `marketing_opt_in`.
2. `POST /api/auth/claim` + progress-snapshot query + client restore.
3. OTP modal (phone → code → replace banner → consent/marketing checkbox) in onboarding and More.
4. More-menu rows: Log in / Logged in state / Forget this device.
5. Send SMS Hook (Edge Function) + provider setup (blocked on DLT).

---

## India SMS research (2026-10-18)

Verified = from official docs at the URL; "unverified" = third-party only or not reached.

### Verified

- **Providers** ([phone-login](https://supabase.com/docs/guides/auth/phone-login)): MessageBird, Twilio, Vonage, Textlocal (community-supported). Twilio Verify is only mentioned in the WhatsApp sentence (page is inconsistent). Config: Dashboard → Auth → Providers → Phone. The page names India's TRAI DLT.
- **Send SMS Hook** ([send-sms-hook](https://supabase.com/docs/guides/auth/auth-hooks/send-sms-hook)): Free and Pro. Postgres function or HTTPS endpoint (e.g. an Edge Function). Payload `{ user: { phone: "+91…" }, sms: { otp: "<6 digits>" } }`. Supabase generates and verifies the OTP; the hook only delivers it. Success = 200/202/204 with `Content-Type: application/json`. HTTPS hooks use Standard Webhooks (`webhook-id`, `webhook-timestamp`, `webhook-signature`, secret `v1,whsec_…`; verify with `standardwebhooks`). **5 s total budget including retries**; 429/503 with `retry-after` retried up to 3×; 20 KB payload limit. Docs name MSG91 as an India example. Not labelled GA/beta (looks GA).
- **Limits** ([rate-limits](https://supabase.com/docs/guides/auth/rate-limits)): SMS sent defaults to **30 per hour per project** (`rate_limit_sms_sent`, customizable); per-user OTP cooldown 60 s; default OTP expiry 1 hour; sign-in/verify 30 requests per 5 min per IP; docs recommend CAPTCHA. OTP is always 6 digits in the hook. Local test OTPs: `[auth.sms.test_otp] 91XXXXXXXXXX="123456"` in `config.toml`.
- **Twilio India** ([guidelines](https://www.twilio.com/en-us/guidelines/in/sms), [pricing](https://www.twilio.com/en-us/sms/pricing/in)): International route needs no developer DLT, sends from random 5xxxx shortcodes; alphanumeric sender IDs are overwritten. Domestic route needs your own DLT entity + sender ID. About $0.083 (~₹7) per SMS.
- **Fast2SMS** ([docs](https://docs.fast2sms.com), [pricing](https://fast2sms.com/pricing)): `POST https://www.fast2sms.com/dev/otp/send` with `Authorization: <key>`; fields `mobile` (10 digits), `otp_id` (a DLT OTP template), optional `otp` (lets the hook pass Supabase's code through), `otp_length`, `otp_expiry`. About ₹0.21–0.25 per SMS. "Quick SMS" route (`route=q`) needs no DLT but is ₹5 per SMS.

### Unverified

- MSG91 pricing (~₹0.15 per OTP from secondary sources), onboarding time, API shape (`control.msg91.com/api/v5/otp?template_id&mobile=91…&authkey&otp`, `##OTP##` placeholder), and whether it accepts individuals.
- DLT details (no TRAI/DoT primary page reached): entity fee about ₹5,900 incl. GST per operator portal (Jio / Airtel / Vi), registration ~24 h, header + template approval 1–7 days. Whether an individual can register (one source says proprietorship via individual PAN works).
- 2Factor (claimed no DLT, ₹0.16–0.25 per OTP), Gupshup, Textlocal pricing/onboarding.
- Whether hosted projects have a dashboard UI for test phone numbers.

### Path forward (inference)

1. Supabase Phone provider on, with a **Send SMS Hook** (Edge Function, Standard Webhooks verification, ~4 s provider timeout).
2. **Fast launch, days:** Twilio International, no DLT. About ₹7 per OTP; 1,000 OTPs a month ≈ ₹7,000. Unfamiliar sender; delivery may vary.
3. **Cheaper, 1–2 weeks:** register on DLT (one operator portal, sender ID, OTP template), then point the hook at Fast2SMS or MSG91 (~₹0.2 per OTP, ≈ ₹250 per 1,000). Only the hook body changes, not the app.
4. **Bridge:** Fast2SMS Quick SMS (₹5 per SMS) until DLT clears.
5. Dev: local `test_otp`, no SMS cost.

Alternatives if SMS stays painful (one line each, inference): email OTP/magic link (free, weaker for walk-ins); WhatsApp OTP (Supabase supports it through Twilio; needs a WABA + template approval); Supabase anonymous sign-in (no phone; only if verification isn't essential).

---

## Revisit checklist (before building or turning the flag on)

- [ ] **DLT decision:** register (and which operator portal), or launch on Twilio International first. Confirm an individual can register, or whether a business entity is needed.
- [ ] **Provider** chosen and test-sent to a real +91 number.
- [ ] **Raise `rate_limit_sms_sent`.** The default of 30/hour is per **project**, so a busy park at onboarding would hit it.
- [ ] **Re-decide abuse protection (decision 10).** The research changes the picture: at ~₹7 per Twilio SMS a bot costs real money. Cheap options: block non-+91 numbers in the hook, provider-side spend cap + usage alert, 60 s resend cooldown with a visible message. CAPTCHA is the only one that adds visitor friction.
- [ ] **Privacy policy page** exists (open question #9 in `docs/open-questions.md`) and the consent copy is final.
- [ ] Update when built: `docs/decisions.md` ("User identity": drop "No OTP in v1"), `docs/tech-architecture.md` (the "phone hashed after OTP" line, `POST /api/auth/claim`, new `users` columns), and wire the disabled "Log out" / "Profile" rows in `UserMenu.tsx`.
- [ ] Supabase phone auth configured in the dashboard (there is no `supabase/config.toml`); migrations applied with `db push` and Aravind's explicit OK before the app push.

---

## Related

- `docs/decisions.md` — "User identity" row
- `docs/tech-architecture.md` — Auth (visitor), `users` schema, API list
- `docs/open-questions.md` — #9 privacy policy
- `docs/specs/gh-67-offline-scan-queue.md` — scan queue that a claim must flush/clear
- `docs/specs/gh-64-upfront-precache.md` — `lib/handshake-lock.ts` visitor-id handshake
