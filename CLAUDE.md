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
- **Backend:** **Supabase** (auth, Postgres database). No photo storage for now — see rule 1 below.

## Core rules of the app
1. **A written reflection is the check-in.** No photo step for now (removed to stay on Supabase's free storage tier, until a permanent solution is found) — writing at least 10 characters is how a person checks in; it's required, not optional. There's no "kind" picker anymore (Reflection/Revelation/Action was tried and removed — one simple reflection per check-in is enough). (The `kind` column still exists on `checkins`, silently defaulted to `'reflection'` for every new row, and the `photo_path` column and `checkin-photos` storage bucket still exist too — all unused, nothing was deleted.)
2. **One chapter a day.** The group picks a book and a start date. Day 1 = chapter 1, Day 2 = chapter 2, and so on.
3. **Catch-up is allowed.** Anyone can read and check in on earlier chapters they missed.
4. **A person can be in several groups.** A check-in belongs to one group. If someone is in two groups reading different books, they check in separately.
5. **Grace, not guilt.** See the wording rules below.

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
- Reading itself doesn't earn drops automatically anymore — drops come from explicitly collecting a "Daily drop" (see below) or a Missions bonus. This avoids double-counting the same chapter/reflection.
- Drops belong to the person, not the group — your balance is everything you've collected from Daily drops plus Missions bonuses, across *every* group you're in, minus everything you've personally spent (shop purchases) and given (Storehouse deposits, see below).
- You can spend your drops in any group's shop. The item you buy joins that group's shared garden, but it's paid for from your own balance — so several people can each contribute items to the same garden using their own progress.
- Compute the balance from the data every time (daily_claims + mission progress + purchases + Storehouse deposits), never store the balance itself, so it can't drift out of sync.

### Daily drops (Missions tab)
- A "Daily drops" section at the top of the Missions tab, above the mission sections — six small once-a-day tasks, each with a name, a verse reference, and a reward. Defined in `lib/mission-config.ts` (`DAILY_DROPS`).
- Resets at midnight in the person's own local time.
- Each row shows one of three states: **Growing** (not done yet, soft/disabled), **Collect** (done, tap to claim — sage green), **Collected ✓** (claimed today, muted). Tapping "Growing" on Daily Bread takes you to the group with today's unread chapter.
- Tapping "Collect" adds the reward to the balance with a small animation. Each row can only be claimed once per day, even across devices — enforced by a `daily_claims` table (user_id, claim_key, claim_date) with a unique constraint, which Supabase checks for us.
- When all 6 are collected, the section collapses to "All collected today ✓ · Come back tomorrow." (tap to expand again).
- The lamb says "Fresh manna for today!" on the first collect of the day.

### Missions (bonus ways to earn drops)
- A dedicated "Missions" tab (bottom nav, next to Read and Groups) — personal, not tied to one group. It counts your reading across every group combined.
- Missions are grouped into six sections: **This week & month** (resets each period, but a period's bonus stays earned for good once hit), **Reading**, **Finishing books**, **Community**, **Garden**, and **Grace**.
- Every mission has a name, a Bible verse reference (shown under the title), a target, and a drop reward. The full list lives in `lib/mission-config.ts` — that file is the source of truth, not this doc, so it can be tuned without touching code elsewhere.
- A "finishing a book" mission means every chapter of that book has been checked in, combining check-ins from every group (same book, any group, any order) — not just that enough calendar days have passed.
- Some "finish a book" missions require a *set* of books (e.g. all four Gospels, the whole New Testament, the whole Bible) — progress shows as "X / Y books" with which ones are done.
- The Grace section's "Prodigal Returns" mission is repeatable — it can be earned again every time someone checks in after 7+ days of rest in a group, not just once.
- Finishing a book also shows a one-time lamb celebration on the Bible screen: "You finished [Book]! Well done, good and faithful servant."
- Everything is computed live from check-ins, reflections, prayers, and reactions — no separate mission-progress table, same as the drops balance.
- Reaching a mission's target doesn't auto-credit the drops — it shows a **Collect** button, same idea as Daily drops. Tapping it adds the reward to the balance and the mission then disappears from the list. A `mission_claims` table (user_id, mission_key, period_key) remembers what's been collected: `period_key` is empty for one-time missions (so collecting hides them for good), a period identifier like `week:2026-10-05` for the weekly/monthly missions (so they reappear once a new period also hits the target), and an occurrence number for the repeatable "Prodigal Returns" mission (so each comeback can be collected once, then the next one shows up next time).

### Garden animals, plants, and items (bought with drops; show the verse when unlocked)
Three categories — Animals, Plants, Decor — plus a few seasonal decor items only offered in their own months. All of it lives in `lib/garden-items.ts`, the source of truth, not this table.

| Animals | Verse | Price |
|---|---|---|
| Dove | Genesis 8:11 | 50 |
| Sparrow | Matthew 10:29–31 | 50 |
| Fish (in a small pond) | John 21:6 | 80 |
| Raven | 1 Kings 17:6 | 80 |
| Donkey | Zechariah 9:9 | 120 |
| Eagle | Isaiah 40:31 | 150 |
| Lion | Revelation 5:5 | 250 |
| Deer | Psalm 42:1 | 100 |
| Ram | Genesis 22:13 | 90 |
| Hen and chicks | Matthew 23:37 | 70 |
| Camel | Genesis 24:10 | 150 |
| Ox | Isaiah 1:3 | 120 |
| Ant hill | Proverbs 6:6 | 20 |
| Beehive | Exodus 3:8 | 60 |

| Plants | Verse | Price |
|---|---|---|
| Lilies of the field | Matthew 6:28 | 30 |
| Fig tree | Micah 4:4 | 80 |
| Palm tree | Psalm 92:12 | 90 |
| Cedar of Lebanon | Psalm 92:12 | 150 |
| Pomegranate tree | Exodus 28:33 | 100 |
| Budding almond branch | Numbers 17:8 | 60 |

| Decor | Verse | Price |
|---|---|---|
| Well, bench | none | 40–60 |
| Lamp unto my feet | Psalm 119:105 | 70 |
| Ebenezer stone | 1 Samuel 7:12 | 80 |
| Harvest table | Psalm 23:5 | 120 |
| Shepherd's staff | Psalm 23:4 | 40 |
| Basket of loaves and fish | John 6:9 | 50 |
| Fishing boat with net | Luke 5:6 | 150 |
| Watchtower | Isaiah 5:2 | 200 |
| Harp | Psalm 33:2 | 90 |
| Jars of clay | 2 Corinthians 4:7 | 30 |

| Seasonal decor (only shown in the shop during these months) | Verse | Price | Months |
|---|---|---|---|
| Rainbow | Genesis 9:13 | 100 | all year (no month given) |
| Christmas star and manger | Luke 2:7 | 120 | December |
| Easter lilies | none | 60 | March–April |

Treat the prices as a starting point. Keep them in one config file so I can tweak them.

- The same animal, plant, or item can be bought more than once per garden — two different people (or the same person twice) can each add their own lion, for instance. Bought items don't show a name label in the garden scene (trees still do, since those are tied to a person) — except the Ebenezer stone, which shows the group's own name on it.
- A seasonal item still stays in a garden it was already bought into, even outside its months — only the shop listing hides it.
- The fence that divides the bought items from everyone's trees is a permanent, always-on part of the garden layout — it's not something anyone buys from the shop.

### Shop screen layout
- One row of filters: a segmented All / Animals / Plants / Decor control, plus a "Hide owned" switch on the same row. Owned items get an "In our garden" badge and sort to the end of the list.
- Content is capped at 600px wide and centered, 2 columns on phones and 3 on wider screens. Each card shows the sprite, name, verse reference, price, and one of: **Buy**, **Need X more 💧** (disabled), or **In our garden** (once owned).
- Tapping a card opens a detail sheet with a bigger sprite, the full KJV verse text (looked up live from the bundled Bible text, not just shown as a reference), the price, and a Buy button — buying another copy still works from here even once owned, since duplicates are allowed.

### The Storehouse and garden levels
- Each group has a shared **Storehouse** (Genesis 41:56) — a pool of drops the group fills together, separate from the shop. Anyone can give ("deposit") drops from their own personal balance into their group's Storehouse; once given, it can't be taken back.
- The Garden tab shows a "Storehouse" card: a pixel progress bar toward the next level, a "Give drops" button (quick amounts of 10/50/100, or a custom amount up to your balance), and a plain list of who's given — **names only, never amounts or a ranking** (Matthew 6:3).
- As the group's total ever given rises, the garden grows through 7 levels, each costing more (on top of the last) to reach:

  | Level | Verse | Cost from previous |
  |---|---|---|
  | Good Ground | Mark 4:8 | — (starting level) |
  | Shepherd's Tent | Genesis 12:8 | 300 |
  | Sheepfold | John 10:16 | 700 |
  | Olive Grove | Psalm 52:8 | 1,200 |
  | Vineyard | John 15:5 | 2,000 |
  | House on the Rock | Matthew 7:24 | 3,500 |
  | Like Eden | Isaiah 51:3 | 5,000 |

  Levels and verses live in `lib/garden-levels.ts`, so they can be tweaked without touching anything else. A level is never stored — always worked out fresh from the Storehouse's running total, same as drops and tree stages.
- Each level adds its own small piece of garden art (a tent, then a sheepfold with a sheep friend, then olive trees and a well, then a vineyard and winepress, then a house, then a river with blossoms and birds) on top of what came before — gardens never lose a level, and everyone's trees and bought animals stay visible at every level.
- The Garden tab's top-right shows the current level's name and verse, tappable to open a "Levels" sheet listing all 7 (levels not yet reached are greyed out).
- The bottom of the Garden tab has four buttons: **Shop**, **Upgrade** (opens the Levels sheet), **Deposit** (opens the Give-drops sheet), and **Leave**.
- When the group crosses into a new level, everyone sees a one-time full-screen celebration (the lamb doing a happy hop, the new level's name and verse) the next time they open the Garden tab, and the group feed gets a "🌿 Our garden became a [Level]!" message.
- Two missions reward Storehouse giving: **Cheerful Giver** (2 Corinthians 9:7, give for the first time, +10) and **Laborers Together** (1 Corinthians 3:9, be part of a garden that reaches Sheepfold, +30).
- A deposit can't push a personal balance below zero — checked by the database itself (not just the app), so it can't be bypassed.

### The lamb (mascot)
- It lives in every garden and wanders between the trees.
- Its moods:
  - **Happy:** the group is doing well this week.
  - **Waiting by your tree:** you haven't read today.
  - **Sleeping:** at night.
- It's used in reminders, e.g., "The lamb is waiting by your tree."

## Wording rules (important)
- Never use words like "loser," "failed," "missed," "streak lost," "wilted," or "dead."
- Use "resting" for inactive trees.
- Nudges should be warm, e.g., "Your garden misses you" or "The lamb is waiting by your tree."
- Speak in "we": "Our garden grew this week."
- Use sentence case and plain words. Buttons say exactly what happens ("Check in," "Save changes").

## Screens
1. **Sign in:** a single "Continue with Google" button (Supabase Google OAuth). Add Apple sign-in later, in Phase 3.
2. **My groups:** a list of my groups, plus "Create group" (name, book, start date, weekly target) and "Join group" (6-character invite code).
3. **Today (per group):** today's chapter in KJV, readable and scrollable. At the bottom:
   - Write at least 10 characters, then "Check in."
   - A small list of earlier chapters I haven't checked in yet, for catch-up.
4. **Group feed:** everyone's check-ins, newest first, showing an avatar (their tree at its current stage), name, chapter, and the reflection text. Keep it simple, with no likes for now (maybe a single 🙏 reaction later).
5. **Garden:** pixel-art scene with everyone's tree (name under each), the lamb, bought animals and items, plus a level header (current level + verse, tap for the Levels sheet) and the group's Storehouse card. The viewer's own drop balance and the invite code sit at the top; Shop, Upgrade, Deposit, and Leave sit at the bottom. Leaving a group requires typing the group's name to confirm, so it can't happen by accident.
6. **Shop:** buy animals, plants, and decor with your personal drops, for this group's garden — see "Shop screen layout" above for the filters, cards, and detail sheet.
7. **Missions:** a global tab (not per group) with bonus ways to earn drops — Daily drops at the top, then this week/month goals and lifetime milestone badges, counted across all your groups. Finished missions show a Collect button rather than crediting automatically.
8. **Read:** a global tab for browsing any book/chapter in KJV outside of a group's "Today" chapter. Tap a verse's text (not just its number) to highlight it, with a choice of a few pastel highlighter colors; tap ✎ to add a personal note. Reopening the tab (or refreshing the page) picks up at the last book/chapter read, instead of resetting to Genesis 1. A "My highlights" screen lists every highlighted/noted verse across all books.
9. **Profile:** name and avatar color. Sign out.

## Database (Supabase)
Write these as SQL migrations I can run in the Supabase SQL editor.

- `profiles`: id (= auth user id), display_name, avatar_color, created_at
- `groups`: id, name, invite_code (unique), book, start_date, weekly_target (default 5), created_by, created_at
- `group_members`: group_id, user_id, role (owner/member), joined_at
- `checkins`: id, group_id, user_id, book, chapter, reflection (required, 10+ chars), kind (unused, always defaults to 'reflection' — see core rule 1), photo_path (nullable, unused — see core rule 1), created_at
  - Unique on (group_id, user_id, book, chapter) so the same chapter can't be counted twice.
- `group_items`: id, group_id, item_key, bought_by, created_at — no uniqueness rule, so the same item can be bought more than once for a garden.
- `daily_claims`: id, user_id, claim_key, claim_date, created_at — unique on (user_id, claim_key, claim_date).
- `mission_claims`: id, user_id, mission_key, period_key (default ''), created_at — unique on (user_id, mission_key, period_key). Remembers which Missions-tab rewards have been collected (see the Missions section above).
- `bible_annotations`: id, user_id, book, chapter, verse, highlighted, color (nullable — null means the default yellow), note, updated_at — unique on (user_id, book, chapter, verse). Personal highlights and notes for the Read tab.
- `storehouse_deposits`: id, group_id, user_id, amount, created_at. One-way (no edit or delete) — a group's level is always the running total of these, never stored (see the Storehouse section above).
- `group_level_events`: id, group_id, level_index, reached_at — unique on (group_id, level_index). One row per level a group has ever reached, so the celebration and the feed message only ever happen once per group per level.
- `daily_drop_rewards`, `mission_rewards`, `garden_item_prices`: small reference tables mirroring the reward/price numbers in `lib/mission-config.ts` and `lib/garden-items.ts`. They exist only so the database can check a Storehouse deposit doesn't overdraw someone's balance — **if you ever change a reward or price in those two files, update the matching row in these tables too**, or the database's math will fall out of step with the app's.

Compute drops (earned minus spent minus given) and tree stages from the data, rather than storing them, so they can't get out of sync.

### Security (must have)
- Turn on **row-level security** on every table.
- A user can only read groups, members, check-ins, and items for groups they belong to — plus a group they just created, even before they're added as a member (closes a gap where creating a group would otherwise fail).
- A user can only create check-ins for themselves.
- A user can only read and insert their own daily_claims rows.
- A user can only give to the Storehouse of a group they belong to, for themselves — and the database itself blocks a deposit larger than their current balance, not just the app.
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
  - Use a pixel font ("Geist Pixel" from Google Fonts) for headings, numbers, and buttons. It only ships one weight (Regular), so there's no separate bold variant.
  - Use a highly readable font ("Inter" from Google Fonts) for the Bible text and reflections. Scripture must be comfortable to read.
- **UI elements:** chunky square-ish buttons with 2–3 px black borders and a hard offset shadow (no blur), plus a pixel-style progress bar for the weekly goal.
- **Motion:** keep it minimal. Use the lamb's idle animation and a small celebration when a tree grows a stage.
- Must look good on a phone screen first.

## Phases

### Phase 1 — Web MVP (goal: my friends can use it)
- Expo project setup, Supabase connection, Google sign-in.
- Create/join group, Today screen with KJV and a required reflection to check in, and the group feed.
- A simple garden with each person's tree stage and the lamb.
- Deploy to Vercel, with instructions for "Add to Home Screen" on iPhone and Android.

### Phase 2 — Garden game
- Water drops, the shop, animals and items with verses, resting trees, lamb moods, the weekly goal bar, the Harvest Supper card, and the Missions tab.

### Phase 3 — Real phone app
- EAS Build, TestFlight (iOS) and Play internal testing (Android).
- Push notifications (a daily reading reminder at a time the user picks, plus friend nudges).
- Apple sign-in, and a privacy policy page (Singapore PDPA).
- Home-screen widget later.

### Later ideas (don't build yet)
- A prayer request board visible only within the group.
- Other translations, after checking licensing.
- A leader view for cell leaders.

## Definition of done for Phase 1
- I can create a group and share the code, and a friend can join from a different phone.
- We both see the same chapter, can check in, and can see each other's check-ins and reflections in the feed.
- Trees show the right stage, and the lamb appears in the garden.
- Someone who isn't in the group cannot see its content.
