# Spec

GOAL:    Viewer feels FOMO and curiosity — they want to be at Experium now; tease says "coming soon"
OUTPUT:  HyperFrames, 1920×1080, 30 fps
TIME:    45 s × 30 fps = 1350 frames; no beat grid (music bed TBD, no sync yet)

LOOK:
  Warm world ground:   #f8f7f4 (off-white paper)
  Dark world ground:   #111a0d (deep forest)
  Ink:                 #2b2b2b
  Accent 1:            #588157 (forest green) — scan brackets, CTA, active elements
  Accent 2:            #dda15e (orange) — one highlight per scene maximum
  Muted:               #8a8a8a
  Park placeholder:    CSS gradient warm landscape — linear-gradient(135deg,#2d4a1e,#3f6b3a 30%,#588157 55%,#8a6e3b 80%,#dda15e)
  Display face:        Outfit 900, 80–128 px at 1080p, −0.03 em tracking
  Body face:           Nunito 700, 32 px at 1080p, +0 tracking
  App UI face:         Nunito 600–800 (matching app tokens)
  Phone frame:         graphite slab, 9:19.5 ratio, 78cqh tall in scene, border-radius 4.4cqh
                       border: 1px solid rgba(255,255,255,.28)
                       shadow: 0 24px 60px rgba(0,0,0,.45), 0 8px 20px rgba(0,0,0,.35)
  Light:               no glow, no particles; vignette 5% on dark scenes only
  Grain:               0%

OBJECTS:
  QR marker:   dark plaque, white QR pattern (CSS grid), green scan brackets via camera-scan-gate
  Phone:       graphite slab with rounded screen slot; screen shows app UI in #f8f7f4 / forest / orange
  Park IMG-1:  wide establishing shot placeholder — warm gradient, labeled at bottom-left
  Park IMG-2:  exhibit close-up placeholder — same gradient at different angle
  GPS dot:     #4a90d9 (brand GPS blue), 14px with pulsing ring
  Audio wave:  6 bars animated via GSAP, forest green, heights vary sinusoidally
  Badge card:  82×120px rounded rect, forest green fill or locked grey

MOTION:
  Enter ease:    power3.out, 18f (0.6s)
  Move ease:     power2.inOut, 12f (0.4s)
  Exit ease:     power2.in, 9f (0.3s)
  Camera push:   power4.in, 24f (0.8s)
  Phone rise:    power3.out 18f, settle power2.out 5f; enters from y+80px below rest
  Stagger lines: 4f (0.13s) between text lines
  Scene dissolve: 1s overlap, fade-in 0.4s power2.out, fade-out 0.5s power2.in via overlay clip

SHOTS:
  0–7s    Problem (scene-hook): park gradient IMG-1 + three kinetic lines masked-reveal bottom-to-top; fades out on overlap
  6–13s   Reveal (scene-reveal): dark bg + park IMG-2 + camera-scan-gate locks onto QR; "Opening your guide…" text; dissolve
  12–22s  Audio (scene-audio): warm bg + phone rises, screen shows audio player; feature text left; dissolve
  21–34s  Features (scene-features): phone swaps map→gamification at 27s; text right/left alternates; dissolve
  33–40s  Claim (scene-claim): deep forest bg + three phones fan from centre; "Your park. With stories." payoff; dissolve
  39–45s  End card (scene-endcard): clean warm bg + "COMING SOON" 128px Outfit; park name; QR icon; holds

BANNED:
  Dark void with small UI floating in it; glow + particles; cream/paper/serif/mono aesthetic;
  three-card bullet row; logo docked in corner; "Introducing" / "Meet" / "seamless" / "effortless";
  every scene entering with the same slide-up fade;
  breathing/floating idle loops on titles after they land

QA:
  t=1s:   park gradient visible warm, first line "You're at Experium." readable (≥80px Outfit)
  t=3s:   second line "3 hours. 30 exhibits." in orange at full opacity
  t=7s:   QR scan gate visible, scan line active or brackets locked
  t=9s:   green check visible on scan gate, "Opening your guide…" text present
  t=14s:  phone risen in scene-audio, graphite frame visible against warm bg
  t=17s:  audio player screen content readable (exhibit name, waveform bars, play button)
  t=23s:  map screen showing GPS dot and ≥3 exhibit markers
  t=30s:  gamification badges visible, progress indicator present
  t=36s:  three phones fanned, claim text large (≥80px) and readable
  t=41s:  "COMING SOON" dominant at ≥96px; "Experium Park, Hyderabad" readable; QR icon present
