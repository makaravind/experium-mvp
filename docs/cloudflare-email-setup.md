# Cloudflare Email Routing Setup

Handles inbound email for `aikyatechnology.in`. Used for the feedback button in the app.

## What's set up

- **Domain registrar:** GoDaddy (`aikyatechnology.in`)
- **DNS:** Managed by Cloudflare (nameservers: `april.ns.cloudflare.com`, `sterling.ns.cloudflare.com`)
- **App subdomain:** `experium.aikyatechnology.in`
- **Feedback email:** `experium@aikyatechnology.in` → forwards to personal Gmail
- **Email routing:** Cloudflare Email Routing (free)

## How it works

Cloudflare Email Routing receives mail sent to `experium@aikyatechnology.in` and forwards it to the configured Gmail destination. No email server to maintain.

## Where it's used

`components/more/UserMenu.tsx` — "Send feedback" menu item:
```
mailto:experium@aikyatechnology.in?subject=Feedback%20%E2%80%93%20Experium%20Park%20Audio%20Tour
```

## Cloudflare dashboard

- Zone: `aikyatechnology.in`
- Email Routing: **Email → Email Routing**
- Routing rule: `experium` → personal Gmail

## If you need to change the destination Gmail

1. Cloudflare → `aikyatechnology.in` → Email → Email Routing
2. Destination addresses → add new Gmail → verify it
3. Update the routing rule for `experium` to point to new address

## If email stops working

1. Check Cloudflare → Email Routing → confirm rule is active
2. Check Gmail spam folder
3. Verify MX records exist in Cloudflare DNS (added automatically when Email Routing was enabled)
