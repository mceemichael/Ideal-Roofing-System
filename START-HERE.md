# Start Here — A Complete Beginner's Walkthrough

This guide assumes you have never used a terminal, never installed Node.js, and have never deployed a website anywhere except WordPress. Every command is written out. Every "what should happen" is described.

**Honest expectation setting:** this is a real technical project, not a one-click migration. But it is a *sequence of small steps*, and none of them individually is hard. Budget about 6–8 hours of actual work spread across two weeks. Most of that is waiting and checking, not typing.

**The good news:** nothing you do before Session 7 can affect your live website. Your WordPress site keeps running exactly as it is. You are building the replacement quietly on the side, and only at the very end do you flip the switch — and even that is reversible in ten minutes.

---

## Table of contents

- [Session 1 — Install your tools](#session-1--install-your-tools-45-min) (45 min) — *includes optional Claude Code setup*
- [Session 2 — Get your content out of WordPress](#session-2--get-your-content-out-of-wordpress-30-min) (30 min)
- [Session 3 — Set up the CMS](#session-3--set-up-the-cms-45-min) (45 min)
- [Session 4 — Import your content](#session-4--import-your-content-30-min) (30 min)
- [Session 5 — Look at your new site](#session-5--look-at-your-new-site-1-hour) (1 hour)
- [Session 6 — Put it on the internet (privately)](#session-6--put-it-on-the-internet-privately-1-hour) (1 hour)
- [Session 7 — The switch](#session-7--the-switch-1-hour--48-hours-of-watching) (1 hour)
- [Session 8 — Watch it for a month](#session-8--watch-it-for-a-month)
- [If something goes wrong](#if-something-goes-wrong)
- [Glossary](#glossary)

---

## Before anything: three concepts

You only need to understand three things to follow this guide.

**1. The terminal.** A window where you type commands instead of clicking buttons. That's it. It looks intimidating but it's just a text box that runs one instruction at a time. You'll type a command, press Enter, and read what it says back.

**2. The three services replacing WordPress.** Your WordPress install currently does three jobs at once. We're splitting them:

| Job | WordPress today | After the move |
|---|---|---|
| Stores your articles and prices | WordPress database | **Sanity** (a free CMS) |
| Turns that into web pages | WordPress + theme + plugins | **Next.js** (the code I wrote) |
| Serves those pages to visitors | Your web host | **Vercel** (free) |

**3. Your URLs are your rankings.** When Google ranks you for "price of aluminium roofing sheet", it ranks the *URL* `idealroofingsystem.com/price-of-aluminium-roofing-sheets-in-2026/`. If that exact URL stops working, or starts redirecting, or loses its price table, you lose the ranking. Almost everything in this guide exists to prevent that. This is why I keep telling you not to "tidy things up" along the way.

---

## Session 1 — Install your tools (45 min)

You need three programs. All free, all standard.

### 1a. Install Node.js

Node.js is what runs the website code on your computer.

1. Go to **https://nodejs.org**
2. Download the button that says **LTS** (it'll say something like "22.x.x LTS"). LTS means "Long Term Support" — the stable one. Don't take the "Current" one.
3. Run the installer. Click Next through everything, accept the defaults.
4. Restart your computer. (Genuinely — this makes the next step work.)

### 1b. Install Visual Studio Code

This is a text editor for code. You'll use it to open the project folder and edit two files.

1. Go to **https://code.visualstudio.com**
2. Download and install. Defaults are fine.

### 1c. Open a terminal and check it worked

- **Windows:** press the Windows key, type `powershell`, press Enter.
- **Mac:** press Cmd+Space, type `terminal`, press Enter.

A window opens with a blinking cursor. Type this exactly and press Enter:

```
node --version
```

**What should happen:** it prints something like `v22.11.0`.

**If it says "not recognized" or "command not found":** Node didn't install properly, or you didn't restart. Restart your computer and try again. If it still fails, reinstall Node.

Now check the second one:

```
npm --version
```

**What should happen:** a number like `10.9.0`. (npm comes with Node — you don't install it separately.)

### 1d. Install Claude Code (optional, but it will save you hours)

Claude Code is the terminal version of Claude. It sits *inside* your project
folder, can read every file, run commands, and fix errors as they happen. When
something in this guide goes wrong, it can diagnose it on the spot instead of
you copying errors back and forth.

> **A note on naming:** "Opus 5" is the *model* — the brain. "Claude Code" is
> the *tool* you install. You install Claude Code, then tell it to use Opus 5.

**What it costs:** Claude Code needs a Pro, Max, Team or Enterprise plan. The
free plan doesn't include it. If you're not on one, skip this section — the
guide works fine without it, and you can always paste errors into the Claude
desktop app instead.

**Install it (Windows PowerShell):**

```powershell
irm https://claude.ai/install.ps1 | iex
```

On Mac, or on Windows inside WSL:

```bash
curl -fsSL https://claude.ai/install.sh | bash
```

**Then close your terminal, open a fresh one, and check:**

```
claude --version
```

**What should happen:** a version number like `2.1.219 (Claude Code)`.

**It must be 2.1.219 or higher** — Opus 5 isn't available on older versions. If
yours is lower, run `claude update` and check again.

**Also install Git for Windows** from https://git-scm.com/downloads/win. You
need it in Session 6 anyway to upload your code, and it lets Claude Code run
proper shell commands.

**Start it in your project folder:**

```
cd C:\Users\chibu\Documents\ideal-roofing-vercel
claude
```

First run opens your browser to log in. Then, inside the session, type:

```
/model opus
```

That selects Opus 5 and remembers it for next time.

### 1e. Hand over the project context

The project folder already contains a file called `CLAUDE.md`. Claude Code
reads it automatically every time it starts — it explains what the project is,
what must never be broken, and that you're not a developer. You don't have to
do anything to activate it.

To confirm it loaded, type this inside a Claude Code session:

```
/context
```

You should see `CLAUDE.md` listed under **Memory files**. If it's missing,
you're in the wrong folder — `cd` to the project folder and start again.

**Your first message to it.** Copy and paste this exactly:

> I'm Michael, the owner of idealroofingsystem.com. I'm not a developer.
> I'm migrating my WordPress site to Next.js + Sanity + Vercel using the plan
> in this repo.
>
> Please read CLAUDE.md and HANDOFF.md, then confirm you understand:
> 1. what state the project is currently in
> 2. what has NOT been verified yet
> 3. what the top blocking items are
>
> Then help me run `npm install` and `npm run build` for the first time, and
> fix anything that breaks. Explain what you're doing in plain language, and
> check with me before anything irreversible.

That gets it fully briefed in one go.

**Useful things to say to it later:**

| Say this | What happens |
|---|---|
| `read HANDOFF.md and tell me what's left` | Full status |
| `run npm run build and fix any errors` | First build |
| `run npm run verify against <url>` | The pre-cutover gate |
| `/model opus` | Switch to Opus 5 |
| `/context` | Check what it has loaded |
| `/clear` | Fresh start, keeps CLAUDE.md |

✅ **Session 1 done.** You have the tools.

---

## Session 2 — Get your content out of WordPress (30 min)

Everything here is read-only. Your live site is untouched.

### 2a. Export your content

1. Log into WordPress admin (`idealroofingsystem.com/wp-admin`).
2. Left sidebar → **Tools** → **Export**.
3. Select **All content**.
4. Click **Download Export File**.

You get a `.xml` file, probably a few megabytes. It contains every post, page, category, tag, author — and critically, all your Rank Math SEO settings.

5. **Rename it to exactly `wordpress-export.xml`** and remember where it saved (probably your Downloads folder).

### 2b. Back up your images

Your images live in a folder on your web host. You need a copy.

1. Log into your web hosting control panel (cPanel, or whatever your host gives you).
2. Find **File Manager**.
3. Navigate to `public_html` → `wp-content`.
4. Right-click the **`uploads`** folder → **Compress** → make a zip.
5. Download that zip. Keep it somewhere safe forever. This is ~200 images going back to 2020.

> **Why this matters:** your images rank in Google Images and are pinned on Pinterest. If those image URLs ever stop working, you lose that traffic. The zip is your insurance.

### 2c. Export your Rank Math redirects

1. WordPress admin → **Rank Math** → **Redirections**.
2. If the list is empty, skip this — you're done.
3. If there are entries, click **Export** → save the CSV.

> **Why this matters:** these are URLs you changed at some point in the past. They're quietly forwarding old links to new pages. They don't appear in your sitemap, so they're easy to forget — but they're carrying real value.

### 2d. Take your "before" snapshot

This is the step people skip and regret. You need proof of where you started.

1. Go to **Google Search Console** (`search.google.com/search-console`).
2. **Performance** → set the date range to **Last 3 months** → click **Pages** tab → click **Export** (top right) → download as CSV.
3. Also note the big number at the top: total clicks and total impressions. Write it down somewhere.
4. Go to **Indexing** → **Pages** and note how many pages are marked "Indexed". Write that down too.

Now you have a baseline. In six weeks, when you're wondering "is traffic down?", you'll have an actual answer instead of a feeling.

✅ **Session 2 done.** Your content is safely exported.

---

## Session 3 — Set up the CMS (45 min)

### 3a. Put the project folder somewhere sensible

The `ideal-roofing-vercel` folder I created — move it somewhere you'll find it. I'd suggest directly on your Desktop or in your Documents folder. Avoid folder names with spaces if you can.

Let's say it ends up at `C:\Users\chibu\Documents\ideal-roofing-vercel` (Windows) or `/Users/chibu/Documents/ideal-roofing-vercel` (Mac).

### 3b. Open a terminal *in that folder*

This is the one bit of terminal navigation you need.

- **Windows:** open the folder in File Explorer, click the address bar at the top, type `powershell`, press Enter.
- **Mac:** right-click the folder → **Services** → **New Terminal at Folder**.

Alternatively, in any terminal, type `cd ` (with a space), then drag the folder onto the terminal window, then press Enter.

**Check you're in the right place** — type:

```
ls
```

**What should happen:** you see a list including `package.json`, `README.md`, `src`, `sanity`, `scripts`.

**If you see something else:** you're in the wrong folder. Try the drag-and-drop method above.

### 3c. Install the project's dependencies

```
npm install
```

**What should happen:** a lot of text scrolls past for 1–3 minutes, ending with something like `added 412 packages`. A new `node_modules` folder appears. That folder is huge and you never need to look inside it.

**If you see warnings** about "deprecated" packages — ignore them, they're normal.

**If you see actual errors in red:** copy the error and ask me.

### 3d. Create your Sanity account and project

Sanity is where your articles will live. Free tier is more than enough for your site.

```
npx sanity@latest login
```

This opens your browser. Sign up with Google or GitHub — whichever you prefer. Then come back to the terminal.

Now create the project:

```
npx sanity@latest init --env
```

It asks you several questions. Answer:

| Question | Answer |
|---|---|
| Create new project or select existing? | **Create new project** |
| Project name | `Ideal Roofing System` |
| Use the default dataset configuration? | **Yes** (this creates one called `production`) |
| Output path | Press Enter to accept the default |
| Select project template | **Clean project with no predefined schemas** |
| TypeScript? | **Yes** |
| Package manager | **npm** |

**What should happen:** it creates a file called `.env.local` in your folder with your project ID in it. You won't need to touch it.

> **If it asks to overwrite existing files** (like `sanity.config.ts`) — say **No**. My versions have your content structure in them.

✅ **Session 3 done.** You have a CMS account and the code is installed.

---

## Session 4 — Import your content (30 min)

### 4a. Put the export file in place

Move `wordpress-export.xml` (from Session 2a) into the `ideal-roofing-vercel` folder — the same folder that has `package.json`.

### 4b. Convert it

```
npm run migrate
```

**What should happen:** a summary appears, looking roughly like:

```
================================================================
  MIGRATION COMPLETE  ->  sanity-import.ndjson
================================================================
  Posts                39
  Pages                7
  Categories           6
  Tags                 54
  Authors              2
  ---
  Tables converted     12
  Videos converted     3
  Images referenced    187
  Raw HTML fallbacks   8
  Interactive tools    2
  Comments             6
================================================================
```

**Read those numbers.** Posts should be around 39, pages around 7, tags around 54. If posts says `3`, something went wrong with the export — redo Session 2a.

**"Tables converted"** matters most. Your pricelist posts contain price tables, and those tables are the content Google actually ranks. If this number is 0, tell me and I'll adjust the converter.

**"Raw HTML fallbacks"** is fine and expected. It means "I found some markup I wasn't 100% sure how to convert, so I kept it exactly as it was." Nothing is lost — it renders identically. You can tidy those up later, or never.

**"Interactive tools"** should be 2 — the length converter and the roof area calculator on your calculator page. If it says 0, the importer didn't recognise the old widgets; tell me and I'll adjust the detection. Nothing is lost either way, the page just won't have the working calculators until we fix it.

**"Comments"** should be around 6. These are your approved reader comments (the roof calculator page has six). Pending and spam comments are deliberately left behind.

**If you see a red `!! N post(s) produced NO content`** — stop and tell me which ones. That's a genuine problem worth fixing before going further.

### 4c. Upload it to Sanity

```
npx sanity dataset import sanity-import.ndjson production --replace
```

**What should happen:** a progress bar, then `Done! Imported N documents`.

✅ **Session 4 done.** Your content is in the new CMS.

---

## Session 5 — Look at your new site (1 hour)

### 5a. Start it up

```
npm run dev
```

**What should happen:** it prints something like:

```
▲ Next.js 15.1.0
- Local:  http://localhost:3000
✓ Ready in 2.1s
```

Open **http://localhost:3000** in your browser.

**You should see your website.** Same blue, same layout, same navigation, same content — running on your own computer.

> **Note:** the terminal is now *busy* running the site. It won't accept new commands. To stop it, press **Ctrl+C**. To run other commands, open a second terminal window.

> **Note on images:** they load from your live WordPress site for now. That's intentional and correct — it's what keeps every image URL working during the transition.

### 5b. Check your content properly

This is the most valuable hour in the whole project. Open these pages and compare them side by side with the live site:

| Check this page | Look for |
|---|---|
| `localhost:3000/price-of-aluminium-roofing-sheets-in-2026/` | **The price table.** Is it there? Are the numbers right? |
| `localhost:3000/price-of-stone-coated-gerard-in-lagos-2025/` | Price table + all 7 images |
| `localhost:3000/price-of-pvc-rain-gutter-water-collector/` | All 14 product images |
| `localhost:3000/colour-chart-for-aluminium-roofing-sheet-in-nigeria/` | The colour chart graphic |
| `localhost:3000/blogs-and-projects/` | All your posts listed, pagination at the bottom |
| `localhost:3000/pricelist/` | Content intact |
| `localhost:3000/roof-area-calculator/` | **Both calculators work.** Type 12 / 9 / 2.5 — you should get 123.55 m². Also check the six comments are there. |
| `localhost:3000/search/?q=aluminium` | Search returns results |

Open the same URL on the live site in another tab and flip between them. You're looking for **missing content**, not for pixel-perfect design differences.

### 5c. Edit something, to prove the CMS works

Open **http://localhost:3000/studio** — this is your new WordPress admin equivalent.

1. Click **Posts** in the left sidebar.
2. Click any post.
3. Change a word.
4. Click **Publish** (bottom right).
5. Go back to the site tab and refresh. Your change is there.

Have a proper look around the Studio. This is where you'll update prices from now on. It's cleaner than WordPress but different — worth spending twenty minutes getting comfortable before you're relying on it.

### 5d. Fill in your business details

Two files need your input. In VS Code: **File** → **Open Folder** → pick `ideal-roofing-vercel`.

**File 1: `src/lib/site.ts`**

Find the `business` section (around line 31) and replace every `TODO`:

```ts
business: {
  legalName: 'Ideal Roofing System',
  registrationNumber: 'BN: 7788277',
  streetAddress: '12 Example Road, Agege',   // ← your real address
  addressLocality: 'Agege',
  addressRegion: 'Lagos',
  postalCode: '100283',                       // ← your real postcode
  addressCountry: 'NG',
  telephone: '+2348012345678',                // ← your real number
  email: 'info@idealroofingsystem.com',       // ← your real email
  latitude: 6.6194,                           // ← from Google Maps
  longitude: 3.3253,                          // ← from Google Maps
```

> **Copy these from your Google Business Profile, character for character.** Google cross-checks your website against your Business Profile for local search. "Agege, Lagos" and "Agege Lagos" are different strings to a machine. This is why I didn't guess them.
>
> To get latitude/longitude: open Google Maps, right-click your business location, and the first item in the menu is the coordinates. Click to copy.

**File 2: `src/lib/redirects.js`** — only if Session 2c gave you a CSV. Scroll to the bottom and add one line per redirect:

```js
{ source: '/old-url/', destination: '/new-url/', permanent: true },
```

**Save both files** (Ctrl+S / Cmd+S). The site auto-reloads.

### 5e. Add your favicon

Copy `favicon.ico` and `apple-touch-icon.png` from your WordPress install into the `public/` folder. You can find them at `idealroofingsystem.com/favicon.ico` — right-click, Save As.

✅ **Session 5 done.** The site works and it's yours.

---

## Session 6 — Put it on the internet (privately) (1 hour)

Now we put it online at a temporary address that only you know. Your real site is still untouched.

### 6a. Create a GitHub account and upload the code

GitHub stores your code. Vercel reads it from there.

1. Sign up at **https://github.com** (free).
2. Click the **+** top right → **New repository**.
3. Name: `ideal-roofing-system`. Set it to **Private**. Click **Create**.
4. On the next screen you'll see setup instructions. Ignore them — use these instead, in your terminal, in the project folder:

```
git init
git add .
git commit -m "Initial migration from WordPress"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/ideal-roofing-system.git
git push -u origin main
```

Replace `YOUR-USERNAME` with your actual GitHub username.

**If it asks for a password:** GitHub doesn't accept account passwords here. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new token → tick `repo` → generate. Copy that token and paste it as the password.

**If `git` isn't recognised:** install it from **https://git-scm.com**, restart your terminal, try again.

> Your `.env.local` file does **not** get uploaded — it's in `.gitignore` on purpose. Passwords and keys should never go into GitHub.

### 6b. Deploy to Vercel

1. Sign up at **https://vercel.com** — choose **Continue with GitHub**.
2. Click **Add New** → **Project**.
3. Find `ideal-roofing-system` in the list → **Import**.
4. Before clicking Deploy, expand **Environment Variables** and add these four:

| Name | Value |
|---|---|
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | copy from your `.env.local` file |
| `NEXT_PUBLIC_SANITY_DATASET` | `production` |
| `NEXT_PUBLIC_SANITY_API_VERSION` | `2024-10-01` |
| `NEXT_PUBLIC_SITE_URL` | `https://idealroofingsystem.com` |

**Optional, for the comment form** — if you want readers to be able to leave comments:

1. Go to **sanity.io/manage** → your project → **API** → **Tokens** → **Add API token**.
2. Name it `comments`, permission **Editor**, create.
3. Copy the token and add it in Vercel as `SANITY_API_WRITE_TOKEN`.

Skip it and existing comments still display — only the "leave a comment" form is disabled, with a polite message.

5. Click **Deploy**. Wait 2–3 minutes.

**What should happen:** confetti, and a URL like `https://ideal-roofing-system-abc123.vercel.app`. Open it. That's your site, live on the internet, at a temporary address.

> **It won't show up in Google.** The code sends a "do not index" signal on preview deployments. This is deliberate — an indexed staging copy creates a duplicate-content problem that takes months to unwind.

### 6c. Run the safety check

This is the gate. In your terminal:

```
npm run verify -- https://your-actual-vercel-url.vercel.app
```

(Paste your real Vercel URL.)

It checks all 110 of your URLs. **What you want at the end:**

```
  GATE: PASSED - safe to proceed
```

**If it says FAILED**, it lists exactly which URLs are broken. Send me the list.

Now the content check — this is the one that catches missing price tables:

```
node scripts/verify-urls.mjs --diff https://idealroofingsystem.com https://your-vercel-url.vercel.app
```

It compares old and new versions of every page. **What you want:**

```
  NO CONTENT LOSS DETECTED
```

**If it flags pages**, it tells you what's missing — usually "lost 1 table" or "12% fewer words". Send me that output and I'll fix the converter.

### 6d. Lower your DNS TTL — do this NOW, a week before switching

This is the single most important preparation step, and it has to happen a week early.

1. Log into wherever you bought your domain (GoDaddy, Namecheap, Whogohost, etc.).
2. Find **DNS settings** / **DNS management**.
3. Find your `A` record for `@` (or the root domain).
4. Change **TTL** to **300** (seconds). Save.

> **Why a week early:** TTL means "how long the internet is allowed to cache this DNS answer." If it's currently set to 24 hours, the world will keep using the old answer for up to 24 hours after you change it. Setting it to 300 now means that by next week, everyone will be checking every 5 minutes — so when you switch, it happens fast, and if you need to roll back, that's fast too.
>
> Skip this and a rollback takes hours instead of minutes.

✅ **Session 6 done.** Now wait a week for the TTL change to propagate.

---

## Session 7 — The switch (1 hour + 48 hours of watching)

**Do this on a Tuesday or Wednesday morning.** Never Friday. Never before a holiday or a trip. You want to be at your desk and available for the next two days.

### 7a. Final prep (the morning of)

- Stop editing WordPress.
- Re-run both verification commands from 6c one last time.
- If you published anything new to WordPress since Session 2, redo Sessions 2a → 4c to pick it up.

### 7b. Add your domain in Vercel

1. Vercel → your project → **Settings** → **Domains**.
2. Add `idealroofingsystem.com`.
3. Add `www.idealroofingsystem.com`.
4. Vercel shows you exactly which DNS records to create. It'll be something like:
   - `A` record, name `@`, value `76.76.21.21`
   - `CNAME` record, name `www`, value `cname.vercel-dns.com`

> **Keep the same main version you use now.** If your site currently lives at `idealroofingsystem.com` without the `www`, keep it that way. Switching between www and non-www during a migration means two changes at once, and if rankings move you won't know which one caused it.

### 7c. Change your DNS

At your domain registrar, update the records to match what Vercel showed you. Save.

### 7d. Wait, then verify

Wait 10–20 minutes. Vercel will show a green tick next to your domain when the SSL certificate is ready.

Then run the check against your real domain:

```
npm run verify -- https://idealroofingsystem.com
```

You want `GATE: PASSED` again.

Then open your site in a browser and click around. Check a price page. Check the blog. Check it on your phone.

### 7e. Tell Google (within the hour)

1. **Google Search Console** → **Sitemaps** → add `https://idealroofingsystem.com/sitemap.xml` → Submit.
   - **Leave the old `sitemap_index.xml` entry there.** It now redirects to the new one, which is exactly the signal Google should see.
2. **URL Inspection** (top search bar) → paste each of these → click **Request Indexing**. One at a time, they queue:
   - `https://idealroofingsystem.com/`
   - `https://idealroofingsystem.com/price-of-aluminium-roofing-sheets-in-2026/`
   - `https://idealroofingsystem.com/price-of-stone-coated-gerard-in-lagos-2025/`
   - `https://idealroofingsystem.com/price-of-pvc-rain-gutter-water-collector/`
   - `https://idealroofingsystem.com/pricelist/`
   - `https://idealroofingsystem.com/blogs-and-projects/`
3. Do the same in **Bing Webmaster Tools**.
4. Check **Google Analytics** → Realtime. You should see yourself. If it's empty after 15 minutes, your tracking isn't firing — tell me.

### 7f. The rules for the next 60 days

**Do not:**
- change any URL or slug
- delete tag pages ("cleaning up thin content")
- redesign anything
- switch between www and non-www
- "tidy up" old posts

**Why:** you've just changed one big variable. If rankings move — up or down — you need to know it was the migration. Change three things at once and you learn nothing. All of the above are worth doing eventually. Just not now.

**Do:**
- keep paying for WordPress hosting for 30 more days (that's your rollback)
- keep publishing new content as normal

✅ **Session 7 done.** You're live.

---

## Session 8 — Watch it for a month

### Every day for two weeks (5 minutes)

Google Search Console:
- **Indexing → Pages**: a few new "Not found (404)" is normal — old attachment URLs. Dozens is not; tell me.
- **Performance**: compare last 7 days to your Session 2d baseline.

### What normal looks like

Impressions dip **5–15% in weeks 1–2** while Google recrawls everything. Then recovery, usually *exceeding* the old baseline by week 4–6 — because the site is genuinely much faster now and page speed is a ranking factor.

**Don't panic in week 1.** A dip is expected. It's the shape that matters, not the first data point.

### What isn't normal

- A specific important URL disappearing from Google entirely
- Decline still getting worse after week 4
- A 30%+ drop that doesn't recover at all

Any of those means a technical fault, not recrawl noise. Tell me and we'll diagnose it.

### Weekly

```
npm run verify -- https://idealroofingsystem.com
```

**Check the comment queue.** Studio → **Comments** → sort by "Awaiting approval". New comments show a ● marker and are invisible on the site until you tick **Approved**. Spam gets filtered before it reaches you, but read what does arrive — comments on the calculator page are genuine leads.

### At 30 days

If everything's stable, cancel your WordPress hosting. **Before you do:**

1. Upload your `uploads` zip (from Session 2b) to Vercel Blob or Cloudflare R2.
2. Set `MEDIA_ORIGIN` in Vercel's environment variables to point at it.
3. Redeploy and check that images still load.

> **This step is not optional.** Until you do it, your images are still being served by WordPress. Cancel the hosting first and every image on your site breaks at once.

Keep the export XML and the uploads zip forever.

### At 60 days

*Now* you can improve things. Top of the list: you have 54 tag pages for 39 posts, and several tags have exactly one post. Those are thin, near-duplicate pages. Consolidating them is a genuine win — as a separate project, with its own before-and-after measurement.

---

## If something goes wrong

### The panic button

If the site is broken, showing errors, or traffic collapses in the first 48 hours:

**Go to your domain registrar and change the DNS records back to your old WordPress host's values.**

Write those old values down *before* Session 7c so you have them. With TTL at 300, you're back on WordPress within about 10 minutes.

**Roll back if:** the site shows errors everywhere, the wrong content is served, a top page 404s, or traffic drops more than 30% for a full 24 hours.

**Don't roll back for:** a 10% dip in week 1 (normal), a single odd-looking page (fix it forward), or a small design difference.

### Common problems

| Symptom | Cause | Fix |
|---|---|---|
| `command not found: node` | Node not installed, or terminal not restarted | Reinstall Node, restart computer |
| `npm install` fails with red errors | Network or permissions | Try again; if it persists, send me the error |
| Images don't load | `MEDIA_ORIGIN` pointing somewhere wrong | Leave it unset until WordPress is decommissioned |
| A page is blank | Content didn't import | Open it in `/studio` and check |
| `verify` shows redirects everywhere | `trailingSlash` got changed | Check `next.config.mjs` still says `trailingSlash: true` |
| Studio won't load | Env vars missing in Vercel | Check Settings → Environment Variables |

### When to get a second pair of eyes

Sessions 1–6 are safe to experiment with — nothing is live, and you can always start over. If you break something, delete the folder and begin again.

**Session 7 is the one that matters.** If you're not confident at the DNS step, that's the single hour worth having a developer sit with you. It's a 20-minute job for someone who's done it before, and getting it wrong is the one mistake in this whole process that's visible to the public.

---

## Glossary

| Term | Plain English |
|---|---|
| **Terminal / PowerShell** | Text window where you type commands |
| **Node.js** | The engine that runs the website code |
| **npm** | Installs the code libraries the site needs |
| **Next.js** | The framework the new site is built with |
| **Sanity** | Your new CMS — replaces the WordPress editor |
| **Vercel** | Your new host — replaces your web hosting |
| **GitHub** | Where your code is stored |
| **Repository / repo** | A project folder on GitHub |
| **Deploy** | Publish the code so it's live |
| **DNS** | The internet's address book — maps your domain to a server |
| **TTL** | How long the internet caches a DNS answer |
| **301 redirect** | "This page moved permanently" — passes ranking value along |
| **404** | "Page not found" |
| **Canonical** | Tag saying "this is the real URL for this content" |
| **Slug** | The last part of a URL — `price-of-alu-zinc-in-lagos` |
| **Trailing slash** | The `/` at the end of a URL. Yours have one. Keep it that way. |
| **Sitemap** | A file listing all your pages, for search engines |
| **Core Web Vitals** | Google's page speed scores — a ranking factor |
| **Environment variable** | A setting (like a password) kept outside the code |

---

## The whole thing on one page

```
WEEK 1
  Session 1  Install Node + VS Code                    45 min
  Session 2  Export WordPress content + images         30 min
  Session 3  npm install, create Sanity account        45 min
  Session 4  Import content, check the numbers         30 min
  Session 5  Run it locally, CHECK YOUR PRICE TABLES    1 hr
  Session 6  Deploy to Vercel, run verify, DROP TTL     1 hr
             ↑ nothing above touches your live site

WEEK 2
             wait for TTL to propagate

  Session 7  Tuesday morning: switch DNS                1 hr
             submit sitemap, request indexing
             then watch for 48 hours

WEEK 3-6
  Session 8  Check Search Console daily, then weekly

DAY 30       Move images off WordPress, cancel hosting
DAY 60       Now you can start improving things
```

Take it one session at a time. If anything doesn't match what this guide says should happen, stop and ask before continuing — that's always cheaper than pushing through.
