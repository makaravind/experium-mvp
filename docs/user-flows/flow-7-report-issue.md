# Flow 7: Report Issue

## Version: V1

## Summary

User reports problems (wrong info, damaged marker, audio issues) from the bottom sheet. Anonymous, free-text with predefined dropdown. Confirmation via toast.

---

## Entry Point

- Bottom sheet (S2, both Active and Preview states)
- Small icon button (e.g., flag or ⚠️ icon) in sheet — tapping opens report modal

---

## Flow

| Step | Screen | Action |
|------|--------|--------|
| 1 | Bottom sheet (S2) | User taps report icon |
| 2 | Report modal (overlay) | Modal opens over sheet. Contains: dropdown + free-text field + submit button |
| 3 | Report modal | User selects issue type from dropdown, optionally adds free-text detail |
| 4 | — | User taps Submit |
| 5 | Toast | Modal closes. Toast: "Thanks! We'll look into it ✓" (3s auto-dismiss) |

---

## Report Modal

| Element | Details |
|---------|---------|
| Title | "Report an issue" |
| Dropdown | Predefined options: "Wrong information" · "Damaged marker" · "Audio not working" · "Other" |
| Free-text field | Optional textarea, placeholder: "Tell us more (optional)" |
| Submit button | Primary CTA, green (#588157) |
| Close | X button top-right or tap outside modal |

---

## Identity

- Anonymous (no OTP required in V1)
- Report stored with: exhibit_code, issue_type, free_text, timestamp, device_fingerprint (optional, for spam filtering later)

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| No network | Submit fails. Toast: "Couldn't send report. Try again later." Report NOT queued locally |
| Empty submission (no dropdown selected) | Submit button disabled until dropdown has selection |
| Spam (same device, many reports) | V1: no throttling. Address in V2 with OTP identity |

---

## Data Requirements

| Element | Data Needed |
|---------|-------------|
| Report submission | exhibit_code (from current sheet context), issue_type, free_text, timestamp |
| Admin/maintainer view | Out of scope for this flow — see maintainer flow |

---

## Design Tokens

Same as Flow 1 global tokens. No additional tokens needed.
