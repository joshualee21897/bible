# Project brief: group Bible reading app ("Sprout" — The Mustard Seed Bible Reading App)

## About me and how to work with me
- I'm not a professional developer. Explain what you're doing in plain language, one step at a time.
- Before writing code for each phase, show me a short plan and wait for my OK.
- When I need to do something outside the code (Supabase dashboard, Vercel, terminal commands), give me exact click-by-click or copy-paste steps.
- Ask before adding any new library. Keep dependencies few.
- Never put secret keys in the code. Use a `.env` file and make sure it's in `.gitignore`.
- After each phase, tell me how to test it on my phone and what to check.

## What we're building
A community Bible reading app. Friends form groups (cell group, family, friends), read the same chapter each day, and check in. Each person has their own tree that grows as they read, and a group's trees together form a shared garden. A lamb is the app's mascot and lives in every garden.

Inspiration: "yoked" (partner Bible check-ins) and "Charlie" (pixel pet that grows with your steps, with friend groups). Ours is for groups, not pairs.

## Platform plan
- **Now:** a web app my friends can open from a link and "Add to Home Screen."
- **Later:** the same code built into iPhone and Android apps.
- **So:** use **Expo (React Native) with Expo Router and TypeScript**, exported to web and deployed on **Vercel**. Later use **EAS Build** for the app stores.
- **Backend:** **Supabase** (auth, Postgres database, storage for photos).

## Core rules of the app
1. **A photo is the check-in.** Adding a photo (BeReal-style, like their Bible and coffee) is how a person checks in — no photo, no check-in. (Changed from the original "reading alone counts" rule, by explicit request.)
2. **Reflection is optional.** After checking in with a photo, a person can also add a short reflection.
3. **One chapter a day.** The group picks a book and a start date. Day 1 = chapter 1, Day 2 = chapter 2, and so on.
4. **Catch-up is allowed.** Anyone can read and check in on earlier chapters they missed.
5. **A person can be in several groups.** A check-in belongs to one group. If someone is in two groups reading different books, they check in separately.
6. **Grace, not guilt.** See the wording rules below.

## Bible text
- Use the **KJV (public domain)** only for now.
- Bundle a public-domain KJV JSON file in the project (e.g., from the scrollmapper/bible_databases repo on GitHub). Confirm the license says public domain before using it.
- Bundling it means reading works offline and we don't depend on an outside API.

## Growth and garden

### Personal tree (stage based on total check-ins in that group)
| Check-ins | Stage |
|---|---|
| 0 | Seed |
| 3 | Sprout |
| 10 | Sapling |
| 25 | Tree |
| 50 | Fruit-bearing tree |

- If someone hasn't checked in for 3+ days, their tree shows as **resting** (sleepy, softer colors). It never shrinks, wilts, or dies. It wakes up on their next check-in.

### Water drops (currency, per person)
- Reading a chapter earns 10 drops. Adding a reflection earns +3, and adding a photo earns +3.
- Drops belong to the person, not the group — your balance is everything you've earned from your own check-ins across *every* group you're in, plus mission bonuses (see below), minus everything you've personally spent.
- You can spend your drops in any group's shop. The item you buy joins that group's shared garden, but it's paid for from your own balance — so several people can each contribute items to the same garden using their own progress.
- Compute the balance from the data every time (checkins + mission progress + purchases), never store it, so it can't drift out of sync.

### Missions (bonus ways to earn drops)
- A dedicated "Missions" tab (bottom nav, next to Read and Groups) — personal, not tied to one group. It counts your reading across every group combined.
- Missions are grouped into six sections: **This week & month** (resets each period, but a period's bonus stays earned for good once hit), **Reading**, **Finishing books**, **Community**, **Garden**, and **Grace**.
- Every mission has a name, a Bible verse reference (shown under the title), a target, and a drop reward. The full list lives in `lib/mission-config.ts` — that file is the source of truth, not this doc, so it can be tuned without touching code elsewhere.
- A "finishing a book" mission means every chapter of that book has been checked in, combining check-ins from every group (same book, any group, any order) — not just that enough calendar days have passed.
- Some "finish a book" missions require a *set* of books (e.g. all four Gospels, the whole New Testament, the whole Bible) — progress shows as "X / Y books" with which ones are done.
- The Grace section's "Prodigal Returns" mission is repeatable — it can be earned again every time someone checks in after 7+ days of rest in a group, not just once.
- Finishing a book also shows a one-time lamb celebration on the Bible screen: "You finished [Book]! Well done, good and faithful servant."
- Everything is computed live from check-ins, reflections, prayers, and reactions — no separate mission-progress table, same as the drops balance.

### Garden animals and items (bought with drops; show the verse when unlocked)
| Item | Verse | Price |
|---|---|---|
| Dove | Genesis 8:11 | 50 |
| Sparrow | Matthew 10:29–31 | 50 |
| Fish (in a small pond) | John 21:6 | 80 |
| Raven | 1 Kings 17:6 | 80 |
| Donkey | Zechariah 9:9 | 120 |
| Eagle | Isaiah 40:31 | 150 |
| Lion | Revelation 5:5 | 250 |
| Well, bench, fence, lanterns | none | 40–100 |

Treat the prices as a starting point. Keep them in one config file so I can tweak them.

### The lamb (mascot)
- It lives in every garden and wanders between the trees.
- Its moods:
  - **Happy:** the group is doing well this week.
  - **Waiting by your tree:** you haven't read today.
  - **Sleeping:** at night.
- It's used in reminders, e.g., "The lamb is waiting by your tree."

### Weekly group goal and Harvest Supper
- The group sets a target of how many days a week each person aims to read (default 5).
- If the group reaches 80% of its combined target for the week, the garden **bears fruit** for that week and shows a **Harvest Supper** card: a prompt to meet up in person and share what they read.

## Wording rules (important)
- Never use words like "loser," "failed," "missed," "streak lost," "wilted," or "dead."
- Use "resting" for inactive trees.
- Nudges should be warm, e.g., "Your garden misses you" or "The lamb is waiting by your tree."
- Speak in "we": "Our garden grew this week."
- Use sentence case and plain words. Buttons say exactly what happens ("Take a photo to check in," "Post reflection").

## Screens
1. **Sign in:** email magic link (simplest for testing). Add Google and Apple sign-in later, in Phase 3.
2. **My groups:** a list of my groups, plus "Create group" (name, book, start date, weekly target) and "Join group" (6-character invite code).
3. **Today (per group):** today's chapter in KJV, readable and scrollable. At the bottom:
   - A photo is required to check in (camera or gallery via `expo-image-picker`, which also works on web).
   - After checking in, optional "Add a reflection."
   - A small list of earlier chapters I haven't checked in yet, for catch-up.
4. **Group feed:** everyone's check-ins, newest first, showing an avatar (their tree at its current stage), name, chapter, reflection, and photo. Keep it simple, with no likes for now (maybe a single 🙏 reaction later).
5. **Garden:** pixel-art scene with everyone's tree (name under each), the lamb, bought animals and items, the viewer's own drop balance, and a shop button.
6. **Shop:** buy animals and items with your personal drops, for this group's garden. Show the verse when bought.
7. **Missions:** a global tab (not per group) with bonus ways to earn drops — this week/month goals and lifetime milestone badges, counted across all your groups.
8. **Profile:** name and avatar color. Sign out.

## Database (Supabase)
Write these as SQL migrations I can run in the Supabase SQL editor.

- `profiles`: id (= auth user id), display_name, avatar_color, created_at
- `groups`: id, name, invite_code (unique), book, start_date, weekly_target (default 5), created_by, created_at
- `group_members`: group_id, user_id, role (owner/member), joined_at
- `checkins`: id, group_id, user_id, book, chapter, reflection (nullable), photo_path (nullable), created_at
  - Unique on (group_id, user_id, book, chapter) so the same chapter can't be counted twice.
- `group_items`: id, group_id, item_key, bought_by, created_at

Compute drops (earned minus spent) and tree stages from the data, rather than storing them, so they can't get out of sync.

### Security (must have)
- Turn on **row-level security** on every table.
- A user can only read groups, members, check-ins, and items for groups they belong to.
- A user can only create check-ins for themselves.
- Photos go in a **private** storage bucket, `checkin-photos`, with the path `group_id/user_id/filename`. Only group members can view them, via signed URLs.
- Joining a group requires a valid invite code.

## Art direction: 8-bit pixel art
The style should feel like the Charlie app: chunky pixel sprites, thick black outlines, flat colors, lots of white space. The designs must be **original**; don't copy Charlie's characters.

- **Sprites as code:** draw every sprite as a pixel grid in code (e.g., a TypeScript array of palette keys) and render it with SVG `<rect>`s or a canvas scaled up. There should be no downloaded image files, so art is easy to tweak.
- **Grid sizes:**
  - The lamb and animals are around 24 pixels wide (not necessarily square — the lamb's grid is wider than it is tall, since it's drawn side-on).
  - Trees are around 32×32 pixels, with one sprite per stage plus a "resting" variant.
- **Crisp rendering:** scale up by whole numbers only (×3, ×4), and use `image-rendering: pixelated` for any bitmap.
- **Palette (limited, earthy, warm):**
  - Outline: warm dark brown `#4A3F35` (not pure black)
  - Lamb wool: `#F7F3E8`, with shade `#D9D2C0`
  - Lamb face: cream `#F7D9C4`, with pink cheek blush `#F6B8B8`/`#E8A598`
  - Lamb legs: tan `#E6C9B4`, with darker hooves `#C9A88E`
  - Grass: `#6DAA45` and `#4E8A32`
  - Bark: `#7A4E2D`
  - Leaves: `#3F8F4A` and `#77C063`
  - Fruit: `#C8403A`
  - Water and pond: `#8EC5F0` and `#5B9BD5`
  - Sky and background: white `#FFFFFF`
- **Lamb design (v2):** a side-view sheep with a fluffy white-and-cream wool body (a lighter top, slightly deeper cream underside), a pale cream face with pink cheek blush and simple dot eyes, and tan legs with hooves — not the original plain white/black design. Moods: happy, waiting, praying (share one calm standing pose), sleeping (adds a small "z" trail), waving and pointing (add a small raised or outstretched leg). Give it a simple 2-frame idle animation (a bob or blink) when animated.
- **Type:**
  - Use a pixel font (e.g., "Pixelify Sans" or "Silkscreen" from Google Fonts) for headings, numbers, and buttons.
  - Use a highly readable serif (e.g., "Literata") for the Bible text and reflections. Scripture must be comfortable to read.
- **UI elements:** chunky square-ish buttons with 2–3 px black borders and a hard offset shadow (no blur), plus a pixel-style progress bar for the weekly goal.
- **Motion:** keep it minimal. Use the lamb's idle animation and a small celebration when a tree grows a stage.
- Must look good on a phone screen first.

## Phases

### Phase 1 — Web MVP (goal: my friends can use it)
- Expo project setup, Supabase connection, email sign-in.
- Create/join group, Today screen with KJV and a required photo to check in, optional reflection, and the group feed.
- A simple garden with each person's tree stage and the lamb.
- Deploy to Vercel, with instructions for "Add to Home Screen" on iPhone and Android.

### Phase 2 — Garden game
- Water drops, the shop, animals and items with verses, resting trees, lamb moods, the weekly goal bar, the Harvest Supper card, and the Missions tab.

### Phase 3 — Real phone app
- EAS Build, TestFlight (iOS) and Play internal testing (Android).
- Push notifications (a daily reading reminder at a time the user picks, plus friend nudges).
- Google and Apple sign-in, and a privacy policy page (Singapore PDPA).
- Home-screen widget later.

### Later ideas (don't build yet)
- A prayer request board visible only within the group.
- Other translations, after checking licensing.
- A leader view for cell leaders.

## Definition of done for Phase 1
- I can create a group and share the code, and a friend can join from a different phone.
- We both see the same chapter, can check in, and can see each other's check-ins and photos in the feed.
- Trees show the right stage, and the lamb appears in the garden.
- Someone who isn't in the group cannot see its content.
