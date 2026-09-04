# School Management System Client

The frontend client for a role-based School Management System. It provides separate workflows for school administrators, staff, teachers, students, parents, and other operational roles.

## What It Includes

- Role-based dashboards and protected routes.
- Student, teacher, class, subject, and staff management.
- Online admission applications and approval workflows.
- Attendance, timetable, homework, exams, grading, and results.
- Fee collection, payment history, overdue fees, refunds, and reports.
- Notices and real-time notifications.
- HR workflows including leave, payroll, onboarding, and appraisals.
- Library, visitors, inquiries, and receptionist workflows.
- Responsive UI with charts, tables, dialogs, loading states, and dark-mode support.

## Supported Roles

The application contains role-aware experiences for:

- Super Admin
- School Admin
- Accountant
- HR
- Teacher
- Exam Controller
- Student
- Parent

Permissions are defined centrally in `src/config/roles.ts` and enforced by the dashboard and module workflows.

## Technology

| Area | Technology |
| --- | --- |
| Framework | Next.js 16 with App Router |
| Language | TypeScript |
| UI | React 19, Tailwind CSS 4, shadcn/ui, Radix UI |
| Data fetching | TanStack Query 5 |
| Client state | Zustand 5 |
| Forms and validation | React Hook Form, Zod |
| HTTP client | Axios |
| Authentication | Access and refresh tokens via cookies/local storage |
| Real-time updates | Socket.IO Client |
| Charts | Recharts |
| Animation | Framer Motion |

## Requirements

- Node.js 18 or later
- npm, pnpm, or another Node.js package manager
- A running SMS backend API
- A running Socket.IO server when real-time notifications are required

## Local Setup

1. Clone the repository and open the project directory.

2. Install dependencies:

	```bash
	npm install
	```

3. Create a `.env.local` file in the project root:

	```env
	NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
	NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
	```

	`NEXT_PUBLIC_API_URL` is used as the Axios base URL. `NEXT_PUBLIC_SOCKET_URL` is used by the real-time notification client. Update both values to match the backend environment.

4. Start the development server:

	```bash
	npm run dev
	```

5. Open [http://localhost:3000](http://localhost:3000) in a browser.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run lint` | Run ESLint |
| `npm run build` | Create a production build |
| `npm run start` | Start the production server |

Before opening a pull request, run:

```bash
npm run lint
npm run build
```

## Project Layout

```text
src/
├── app/
│   ├── dashboard/          # Role-based dashboard routes
│   ├── modules/            # Feature modules and reusable workflows
│   ├── components/         # Shared UI and layout components
│   ├── providers/          # Query and smooth-scroll providers
│   ├── login/              # Staff login
│   ├── register/           # Registration
│   └── student-login/      # Student login
├── components/             # Shared application components and UI primitives
├── config/                 # Roles and permission definitions
├── hooks/                  # Reusable React hooks
├── lib/                    # Axios, validation, and utility helpers
├── middleware/             # Authentication and route protection logic
├── service/                # API service functions
├── store/                  # Zustand stores
└── tyPes/                  # Shared TypeScript types
```

## Authentication

The Axios client automatically reads access and refresh tokens from cookies or local storage. When an API request returns `401`, it attempts to refresh the session and retries the original request. If refreshing fails, the user is redirected to `/login`.

Protected application areas are configured in `src/middleware.ts`. Backend authentication, CORS, cookie settings, and role authorization must be configured consistently with this frontend.

## Backend Integration

This repository is the client application only. The backend must provide the API routes expected by the feature modules, authentication endpoints, and notification transport. Keep the following values aligned between client and server:

- API base URL
- Socket.IO URL
- CORS origins
- Credential/cookie settings
- Access-token and refresh-token behavior

## Production

Build and start the application with:

```bash
npm run build
npm run start
```

Set production environment variables before building. Since the API and Socket.IO URLs use the `NEXT_PUBLIC_` prefix, they are exposed to the browser and should contain URLs only, never secrets.

## Contributing

1. Create a feature branch.
2. Keep changes scoped to the relevant module.
3. Run lint and build checks locally.
4. Open a pull request with a short description of the user-facing change.
