# W3M – Where Ma Money Missing 💰

A modern, full-stack personal finance tracker built with Next.js, Supabase, and Prisma.
Track income, expenses, and transfers across multiple accounts — with a beautiful, fully responsive UI.

---

## 🌐 Live demo

Go to [W3M - Where Ma Money Missing](https://w-3m.vercel.app/) → Login with username `test@test.com` and password `Tt123456`

---

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
DATABASE_URL=postgresql://...        # Transaction mode (port 6543) + ?pgbouncer=true
DIRECT_URL=postgresql://...          # Direct connection (port 5432)
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

### 📊 Dashboard

- Total balance overview across all accounts
- Today's income & expense summary cards
- **Spending Calendar** — Visual monthly calendar showing income (green) and expense (red) per day; click any day to see its transactions in a popup
- Income vs. Expense charts (Bar + Pie) with category breakdown
- Recent transactions list with quick edit/delete

### 💳 Accounts

- Create accounts with custom names, icons, colors, and types (Bank, Wallet, Cash, Credit, Savings)
- Track balance per account, automatically updated on every transaction
- Account list with real-time balance display in THB

### 💸 Transactions

- **Income**, **Expense**, and **Transfer** between accounts
- Category support with emoji icons
- Full transaction list with search, type filter, account filter, and date filter
- **Custom date range filter** — pick any From/To dates
- Preset period filters: Today, This Week, This Month, This Year
- Edit and delete transactions with confirmation
- Transfer balance validation — prevents transfers when source account has insufficient funds

### ⚙️ Settings

- Dark / Light mode toggle
- Profile display name update
- CSV export of all transactions
- Category management

### 📱 Responsive Design

- Desktop sidebar navigation
- Mobile bottom navigation bar
- All pages fully responsive (mobile-first)
- Floating Action Button (FAB) positioned above mobile nav bar

---

## 🛠 Tech Stack

| Layer            | Technology                         |
| ---------------- | ---------------------------------- |
| **Framework**    | Next.js 16 (App Router, Turbopack) |
| **Language**     | TypeScript                         |
| **Styling**      | TailwindCSS v4 + Vanilla CSS       |
| **ORM**          | Prisma                             |
| **Database**     | Supabase (PostgreSQL)              |
| **Auth**         | Supabase Auth (Email/Password)     |
| **Charts**       | Recharts                           |
| **Server State** | TanStack React Query               |
| **Client State** | Zustand                            |
| **Forms**        | React Hook Form + Zod              |

---

## 📋 Available Commands

| Command             | Description                    |
| ------------------- | ------------------------------ |
| `npm run dev`       | Start dev server (Turbopack)   |
| `npm run build`     | Production build               |
| `npm run db:push`   | Push Prisma schema to Supabase |
| `npm run db:studio` | Open Prisma Studio GUI         |

---

## 🗂 Project Structure

```
src/
├── app/
│   ├── (auth)/          # Login & Signup pages
│   ├── (page)/          # Protected app pages
│   │   ├── dashboard/   # Main dashboard
│   │   ├── transactions/# Transaction list & filters
│   │   ├── accounts/    # Account management
│   │   └── settings/    # App settings
│   └── api/             # Route handlers (REST API)
├── components/
│   ├── layout/          # Sidebar, Header, navigation
│   └── transactions/    # Add/Edit/Transaction dialogs, FAB
├── hooks/               # TanStack Query hooks (useTransactions, useAccounts, etc.)
├── lib/                 # Prisma client, Supabase client, utils, validations
├── store/               # Zustand stores
└── types/               # TypeScript type definitions
```

---

## 🔐 Authentication

Authentication is handled entirely by **Supabase Auth**. User passwords are never stored in the application database — they live in Supabase's private `auth` schema. The app only stores user-specific data (accounts, transactions) linked by Supabase's `user.id`.

- Password minimum length: **8 characters**
- Protected routes are enforced via Next.js middleware

---

## 🌐 Currency

Now all monetary values are displayed in **Thai Baht (THB ฿)**.
