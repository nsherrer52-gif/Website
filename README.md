# 🏋️ Gym Tracker

A simple, private gym programming and workout tracker built for two — you and your
training partner. Plan a rotating split, log your reps/sets/weight during workouts,
review your progress on charts, and track bodyweight + body measurements over time.

**No accounts, no servers, no cost.** All your data is stored privately in your
browser on your device. Back it up to a file anytime.

---

## ✨ Features

- **Rotating split program** — build days (Day A / B / C …), add exercises with
  target sets and reps, and reorder everything. The app suggests your next day
  automatically, but you can start any day you like.
- **Live workout logging** — pre-fills your planned sets, shows what you lifted
  *last time* so you know what to beat, and lets you tick off sets as you go.
- **Two people, one app** — switch between profiles (e.g. you and your brother)
  with one tap. You share the program, but each person's logs, bodyweight, and
  measurements stay separate. Each profile can use lb or kg.
- **Progress charts** — track estimated 1‑rep‑max, top set, or total volume for any
  exercise over time.
- **Body tracking** — log bodyweight and custom measurements (waist, arms, chest…)
  and chart each one.
- **Backup & restore** — export all your data to a file and import it on another
  phone or browser. (Important, since data lives only on your device!)
- **Phone-friendly** — designed mobile-first; add it to your home screen and it
  behaves like an app.

---

## 📱 Using it on your phone

Once the site is deployed (see below), open it in your phone's browser and:

- **iPhone (Safari):** Share button → **Add to Home Screen**.
- **Android (Chrome):** ⋮ menu → **Add to Home screen** / **Install app**.

It'll get its own icon and open full-screen.

> ⚠️ **Your data lives in the browser on each device.** It is *not* automatically
> shared between phones. Use **Settings → Export backup** regularly, and use the
> same file with **Import backup** to move data to another device. If you clear
> your browser data, you'll lose anything you haven't exported.

---

## 🚀 Deploying for free with GitHub Pages

This repo includes a workflow that builds and publishes the site automatically.

1. Get this code onto your `main` branch (merge the development branch into `main`).
2. On GitHub, go to **Settings → Pages**.
3. Under **Build and deployment → Source**, choose **GitHub Actions**.
4. That's it — every push to `main` rebuilds and deploys. Your site will be at:

   ```
   https://<your-username>.github.io/website/
   ```

   (For this repo: `https://nsherrer52-gif.github.io/website/`)

### If you rename the repo or use a custom domain

The site is configured to live in a sub-folder called `/website/`. If your repo
has a different name, edit **one line** in [`vite.config.ts`](./vite.config.ts):

```ts
base: '/website/',   // change to '/your-repo-name/'  — or '/' for a custom domain
```

---

## 🛠️ Running it on your own computer (optional)

You only need this if you want to develop/change the app locally.

```bash
npm install      # one-time: install dependencies
npm run dev      # start a local dev server (it'll print a URL to open)
npm run build    # build the production site into dist/
npm run typecheck# check the TypeScript types
```

Requires [Node.js](https://nodejs.org) 18+.

---

## 🗂️ How the code is organized

```
src/
├── types.ts              # The data model — start here to understand the app
├── store/useStore.ts     # All app state + actions, auto-saved to the browser
├── lib/                  # Small helpers (dates, stats, rotation, backups)
├── components/           # Reusable UI (layout, charts, profile switcher)
└── pages/                # One file per screen
    ├── TodayPage.tsx     #   Home — suggests/starts a workout
    ├── WorkoutPage.tsx   #   The live workout logger
    ├── ProgramPage.tsx   #   Edit your program
    ├── ProgressPage.tsx  #   Charts + workout history
    ├── BodyPage.tsx      #   Bodyweight & measurements
    └── SettingsPage.tsx  #   Profiles, units, backup/restore
```

Built with **React + Vite + TypeScript**, styled with **Tailwind CSS**, charts by
**Recharts**, state managed by **Zustand** (which handles saving to the browser).

---

## 💡 Ideas for later

These were intentionally left out of v1 to keep it simple, but the code is
structured to add them:

- **Cloud sync** so you and your brother share data across phones in real time
  (e.g. with a free Supabase backend). The data layer lives in one file
  (`src/store/useStore.ts`) to make this swap-in friendly.
- **Diet / calorie / macro tracking.**
- **Rest timers** between sets, **plate calculators**, and **personal-record badges.**

---

*Built as a personal project — your data is yours and stays on your device.*
