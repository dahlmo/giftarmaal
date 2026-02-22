<div align="center">

<img src="./giftarmaal.png" alt="Giftarmaal logo" width="600" />

# 💍 Giftarmaal

**A modern wedding website boilerplate**  
_Svelte frontend · NestJS backend · PostgreSQL_

✨ Modern · ⚡ Fast · 🧠 Minimal dependencies

</div>

---

## ✨ What is Giftarmaal?

**Giftarmaal** is a modern, self-hostable wedding website boilerplate with batteries included. Can be set up with a simple makefile command and hosted via any Docker-compliant hosting service. Or on a Raspberry Pi in your closet at home.

Motivation was to have a simple boilerplate for others to get up and running with a nice wedding website with just the amount of adaptability that you might need. The design is pretty much just simple Svelte files with inline scripts/HTML but with a Template.svelte as well that helps you reduce duplication. _Content_ is served directly via the database in set building blocks that allow you to customize the _content_ but _not_ the design – which is a deliberate design choice.

To allow for extensibility there's three data domains;

1. Persons

Any person that has _something_ to do with the wedding, is a part of this. Most are "guests" that make it to the _guest list_ while you can promote the guests to _toast master_, and hey – even _bride_ and _groom_. This allows for nice upcoming features such as PDF-export for guest lists, thank-you-cards and emergency contacts etc. as well as it gives you a nice online contact book during the preparations and the actual wedding day.

2. ContentBlock

Is where your content lives, divided in structured blocks that you define via the admin page currently hosted at `/handtere` (to be changed). The frontend checks for blocks and will iterate through the blocks and show sections, blocks and even nested sections of your data that you can define via the `SimpleWysiwyg` editor.

3. Message

Any wedding is full of surprises, and one of the main motivtions for the project was to have some simple way of informing guests about any relevant changes. Sort of like "tweets" but without having to ask guests to use X. This is currently not shown anywhere, but this might be a basis for upcoming notifcations both on the website, via Push and/or E-mail. Let's see.

---

## 🏗️ Tech Stack

- ✅ **Svelte** for fast, elegant UI
- ✅ **NestJS** for a modular, maintainable backend
- ✅ **PostgreSQL** as the single source of truth
- ✅ **SSE (Server-Sent Events)** for live updates
- ✅ **Docker-first** for predictable environments

### Frontend

- 🧡 **Svelte** (no SvelteKit required)
- ⚡ Vite build tool / dev server
- 🗺️ Leaflet + OSM (no API keys) for mapping

### Backend

- 🐦 **NestJS**
- 🔁 Server-Sent Events (SSE) for realtime updates
- 🧩 Modular architecture (features, not spaghetti)
- 🗄️ PostgreSQL

### Infra

- 🐳 Docker / Docker Compose
- 🛠️ pnpm
- 🧪 Ready for Fly.io / VPS / home server

---

## 🚀 Features (Current & Planned)

- 🖼️ Hero section with photo
- 🕰️ Wedding program timeline
- 📸 Upload pictures of your guests
- 📋 Guest list management w/multiple roles
- 📨 RSVP (code-based invitations) (halfway)
- ⚡ Live updates via SSE

### Admin (work in progress)

- 🛠️ Edit program & locations
- 📸 Upload & manage images (coming)
- 👥 Manage guest list (coming)
- 🔐 Simple auth (no OAuth madness) (coming)

---

## 🧩 Project Structure (Monorepo)

```text
apps/
 ├─ web/        # Svelte frontend
 └─ api/        # NestJS backend
packages/
 └─ shared/     # Shared types & utilities
```

## Howto?

# Init Prisma and Generate Client

```console
docker compose exec api sh -lc "cd /app && npx -y pnpm@9.12.2 pnpm --filter api exec prisma migrate dev --name init"
```

# Run migrations

```console
docker compose exec api sh -lc "cd /app && npx -y pnpm@9.12.2 pnpm prisma migrate deploy"
```
