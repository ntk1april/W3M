# W3M – Where Ma Money Missing 💰

A modern, full-stack personal finance tracker built with Next.js 15, Supabase, and Prisma.

## 🚀 Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment variables
Copy and fill in your Supabase credentials:
```bash
cp .env.example .env.local
```

Then edit `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
```

### 3. Push database schema
```bash
npm run db:push
```

### 4. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🎯 Features

- **Dashboard** — Balance overview, expense summary, spending calendar, charts
- **Accounts** — Bank, Wallet, Cash accounts with custom colors
- **Transactions** — Income/Expense tracking with categories
- **Reports** — Charts with custom date filtering
- **Search** — Real-time transaction search
- **Settings** — Dark mode, CSV export, data backup

## 🛠 Tech Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, TailwindCSS v4
- **Backend**: Next.js Route Handlers, Prisma ORM
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (Email + Google)
- **Charts**: Recharts
- **State**: Zustand + TanStack React Query

## 📋 Available Commands

| Command | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run db:push` | Push schema to database |
| `npm run db:studio` | Open Prisma Studio GUI |
