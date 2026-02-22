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

### Public site

- 🖼️ Hero section with photo / video (not versioned yet)
- 🕰️ Wedding program timeline (not versioned yet)
- 🗺️ Interactive map (hotel, ceremony, party)
- 📨 RSVP (code-based invitations) (coming)
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
