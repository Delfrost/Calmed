# CalMed — Healthcare SaaS & Polyclinic Operating System

A modern, full-stack Healthcare Operating System built for polyclinics, hospitals, and pharmacies. CalMed unifies Electronic Health Records (EHR), IPD & OPD management, AI clinical decision support, billing, pharmacy inventory, and role-based staff workflows.

---

## 🚀 Key Modules & Capabilities

- **👨‍⚕️ Doctor Portal**: Real-time queue, patient history, vitals charts, e-prescriptions, and AI Clinical Assistant (SOAP notes, ICD-10 coding, drug interactions, regimen suggestions).
- **🏥 IPD Management**: Inpatient admissions, bed allocations across wards (General, ICU, Private, Semi-Private), surgery scheduling (OT), daily progress notes, and TPA pre-authorizations/claims.
- **👩‍⚕️ Nurse Station**: Medication Administration Record (e-MAR), vitals tracking, shift handovers with automated SBAR notes, and doctor order execution.
- **💼 Reception & Front Desk**: Multi-doctor appointment scheduling, walk-in tokens, bed allocations, IPD/OPD invoice generation, and insurance coverage.
- **💊 Pharmacy**: Stock management, inventory reorder alerts, and one-click prescription dispensing.
- **📊 Admin**: Clinic configuration, doctor commission splits, staff management, and analytics.
- **🌐 Patient Portal**: Appointment booking, prescription download, lab reports, and telemedicine consultations via integrated video calling.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, Server Components & Server Actions)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Database & ORM**: [PostgreSQL](https://www.postgresql.org/) & [Prisma ORM](https://www.prisma.io/)
- **Authentication**: [Auth.js / NextAuth v5](https://authjs.dev/) (Role-based JWT sessions)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons & Animation**: [Lucide React](https://lucide.dev/) & [Motion](https://motion.dev/)
- **AI Engine**: [Google Gemini 2.0 Flash](https://ai.google.dev/) (with offline template fallbacks)
- **Containerization**: [Docker & Docker Compose](https://www.docker.com/)

---

## 📋 Prerequisites

Ensure you have the following installed on your system:
- **Node.js**: v20.x or higher ([Download Node.js](https://nodejs.org/))
- **npm** (comes with Node.js) or **pnpm**
- **Docker** & **Docker Compose** ([Download Docker Desktop](https://www.docker.com/products/docker-desktop/))
- **Git**

---

## ⚡ Quick Start Guide

### 1. Clone the Repository

```bash
git clone https://github.com/Delfrost/Calmed.git
cd Calmed
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy the example environment configuration into `.env`:

```bash
# On Linux/macOS
cp .env.example .env

# On Windows PowerShell
copy .env.example .env
```

The default values in `.env.example` work out of the box with the provided Docker setup:
```env
DATABASE_URL="postgresql://postgres:test123@localhost:5432/healthcare_saas?schema=public"
AUTH_SECRET="medflow-dev-secret-a7f3b2c9e1d45690"
AUTH_URL="http://localhost:3000"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="medflow-dev-secret-a7f3b2c9e1d45690"
DEFAULT_CLINIC_ID="clinic-001"
GEMINI_API_KEY="" # Optional: Add your key for live Gemini AI responses
```

---

## 🐳 Docker PostgreSQL Setup

CalMed requires a PostgreSQL database instance. You can launch one using either Docker Compose or the standalone Docker CLI.

### Option A: Using Docker Compose (Recommended)

Start the database in the background:
```bash
docker compose up -d
```

To verify the database is up and healthy:
```bash
docker compose ps
```

To stop the database when you are done:
```bash
docker compose down
```

### Option B: Using Standalone Docker CLI

If you prefer using `docker run` directly:

```bash
docker run -d \
  --name calmed-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=test123 \
  -e POSTGRES_DB=healthcare_saas \
  -p 5432:5432 \
  -v calmed_pgdata:/var/lib/postgresql/data \
  postgres:16-alpine
```

---

## 🗄️ Database Initialization & Seeding

Once your PostgreSQL Docker container is running, push the schema migrations and seed the database with demo clinical data:

```bash
# 1. Generate Prisma Client types
npm run db:generate

# 2. Push schema to database
npm run db:push

# 3. Seed demo data (clinic, doctors, nurses, patients, beds, prescriptions)
npm run db:seed
```

> **Tip:** You can view and edit database records visually using Prisma Studio:
> ```bash
> npm run db:studio
> ```
> Prisma Studio will be available at [http://localhost:5555](http://localhost:5555).

---

## 💻 Running the Application

Start the local development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Demo Login Accounts

The database seed provides pre-configured staff accounts for testing each role:

| Role | Email | Password | Dashboard Path |
| :--- | :--- | :--- | :--- |
| **Doctor (Cardiology)** | `doctor@medflow.in` | `doctor123` | `/doctor` |
| **Doctor (General)** | `priya@medflow.in` | `doctor123` | `/doctor` |
| **Nurse** | `nurse@medflow.in` | `nurse123` | `/nurse` |
| **Receptionist** | `receptionist@medflow.in` | `reception123` | `/receptionist` |
| **Pharmacist** | `pharmacist@medflow.in` | `pharma123` | `/pharmacist` |
| **Admin** | `admin@medflow.in` | `admin123` | `/admin` |

---

## 📁 Project Structure

```text
├── prisma/
│   ├── schema.prisma        # Database schema definitions & models
│   ├── seed.ts              # Demo data seed script
│   └── migrations/          # SQL migration history
├── src/
│   ├── app/
│   │   ├── (auth)/          # Authentication pages (login)
│   │   ├── (dashboard)/     # Role-based protected dashboards
│   │   │   ├── admin/       # Administrator console
│   │   │   ├── doctor/      # Doctor EHR, IPD, Telemedicine
│   │   │   ├── nurse/       # Handover, MAR, Vitals
│   │   │   ├── pharmacist/  # Inventory, Dispensing
│   │   │   └── receptionist/# Appointments, IPD Admissions, Billing
│   │   ├── api/             # Next.js route handlers
│   │   ├── patient/         # Public patient portal
│   │   └── layout.tsx       # Root application layout
│   ├── components/          # Shared & domain-specific UI components
│   ├── lib/                 # Auth config, database client, AI prompts
│   ├── middleware.ts        # NextAuth authentication & role routing
│   └── types/               # TypeScript data models and interfaces
├── docker-compose.yml       # Docker configuration for PostgreSQL
├── .env.example             # Template environment variables
└── README.md
```

---

## 🛠️ Helpful Commands

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts Next.js development server with Turbopack |
| `npm run build` | Builds the production application |
| `npm run start` | Runs the production build |
| `npm run lint` | Runs ESLint checks |
| `npm run db:generate` | Generates TypeScript types from Prisma schema |
| `npm run db:push` | Pushes Prisma schema changes to PostgreSQL |
| `npm run db:migrate` | Creates and applies Prisma migrations |
| `npm run db:seed` | Populates database with sample clinic data |
| `npm run db:studio` | Opens visual database explorer at `localhost:5555` |

---

## ❓ Troubleshooting

- **Port 5432 already in use**: If you already have a local PostgreSQL service running, either stop it or change the port mapping in `docker-compose.yml` (e.g., `"5433:5432"`) and update `DATABASE_URL` in `.env` accordingly.
- **Docker container not starting**: Run `docker logs calmed-postgres` to inspect PostgreSQL startup errors.
- **Prisma Client out of sync**: If schema changes are not reflected in code, run `npm run db:generate` followed by restarting your dev server.

---

## 📄 License

Private & Proprietary. All rights reserved.
