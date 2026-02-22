<div align="center">

<img src="./giftarmaal.png" alt="Giftarmaal logo" width="600" />

# 💍 Giftarmaal

**A modern wedding website boilerplate**  
_Svelte frontend · NestJS backend · PostgreSQL_

✨ Modern · ⚡ Fast · 🧠 Minimal dependencies

</div>

---

## ✨ What is Giftarmaal?

**Giftarmaal** is a modern, self-hostable wedding website boilerplate with batteries included.  
It can be deployed with a simple Makefile command and hosted on any Docker-compliant platform — or even on a Raspberry Pi in a closet at home.

The motivation behind the project is to give couples (and developers) a clean, extensible starting point for their wedding website.  
The design uses simple Svelte components with inline HTML/scripts, plus a shared `Template.svelte` to avoid duplication.

**Content** is stored in the database as structured blocks, giving you full control over _content_ while intentionally not letting you break the _design_.  
That’s deliberate — flexibility where it matters, consistency where it counts.

To support extensibility, the system is built around three core domains:

---

## 📚 Core Data Domains

### 1. 👥 Persons

Anyone connected to the wedding belongs here: guests, toastmasters, bride/groom, vendors.  
Promote or assign roles to allow:

- Guest list exports
- Thank-you card lists
- Emergency contact sheets
- “Who’s who” directory
- Future features (email, push, PDF exports)

---

### 2. 📦 ContentBlock

Where all page content lives.  
Managed through an admin UI at `/handtere` (temporary).

Blocks can be:

- Sections
- Headings
- WYSIWYG text
- Grids
- Nested blocks

The frontend simply loops through them and renders with pre-defined Svelte components.

---

### 3. 🐦 Message

A lightweight feed for quick wedding updates — like tweets, but without asking guests to join X.

Not yet surfaced in the UI, but intended for:

- Last-minute notifications
- Weather updates
- Transportation info
- Push / email integrations (future)

---

## 🏗️ Tech Stack

- ✅ **Svelte** — fast, elegant UI
- ✅ **NestJS** — modular backend
- ✅ **PostgreSQL** — single source of truth
- ✅ **SSE (Server-Sent Events)** — realtime updates
- ✅ **Docker-first** — predictable, portable, reproducible

### Frontend

- 🧡 Svelte (no SvelteKit required)
- ⚡ Vite dev server
- 🗺️ Leaflet + OSM maps (no API keys)

### Backend

- 🐦 NestJS
- 🔁 Server-Sent Events (SSE)
- 🧩 Feature-oriented module structure
- 🗄️ PostgreSQL

### Infra

- 🐳 Docker & Docker Compose
- 🛠️ pnpm
- 🧪 Suitable for Fly.io, VPS, or home server

---

## 🚀 Features (Current & Planned)

- 🖼️ Full-bleed hero section
- 🕰️ Wedding program timeline
- 📸 Guest profile images (upload via admin)
- 📋 Guest management w/ roles
- 📨 RSVP via invitation codes (in progress)
- ⚡ Live updates via SSE

### Admin (work in progress)

- 🛠️ Edit program & locations
- 📸 Manage images
- 👥 Manage guest list
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

### Init Prisma and Generate Client

```console
docker compose exec api sh -lc "cd /app && npx -y pnpm@9.12.2 pnpm --filter api exec prisma migrate dev --name init"
```

### Run migrations

```console
docker compose exec api sh -lc "cd /app && npx -y pnpm@9.12.2 pnpm prisma migrate deploy"
```
