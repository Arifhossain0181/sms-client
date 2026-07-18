# SMS Client

A modern, role-based School Management System frontend built with Next.js. Designed for Super Admin, School Admin, HR, Accountant, Librarian, Receptionist, Exam Controller, Teachers, Students, and Parents.

## Features

### Multi-Role Dashboards
- Super Admin, School Admin, HR, Accountant, Librarian, Receptionist, Exam Controller, Teacher, Student, and Parent dashboards.

### Student Management
- Student registration, profile management, and search.

### Teacher Management
- Teacher onboarding, profile management, and teaching applications.

### Academic Operations
- Class and subject management.
- Timetable creation and grid view.
- Attendance marking and tracking.

### Examinations & Results
- Exam creation and listing.
- Result entry and per-student result views.

### Finance
- Fee management with cash payment and online payment modals.

### Admissions
- Online admission application form.
- Admin admission review and approval.

### Notices & Notifications
- Notice creation and display.
- Real-time in-app notifications via Socket.IO.

### Analytics
- Attendance and revenue charts.
- Upcoming exams, recent admissions, and fee collection widgets.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| UI Components | shadcn/ui, Radix UI |
| State Management | Zustand |
| Data Fetching | TanStack Query v5 |
| Forms | React Hook Form + Zod |
| Real-time | Socket.IO Client |
| HTTP | Axios |
| Animation | Framer Motion |
| Scroll | Lenis |

## Prerequisites

- Node.js >= 18
- npm or pnpm
- SMS Backend API running

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` in the project root:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

3. Run the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000).

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## Project Structure

```
src/
├── app/
│   ├── modules/
│   │   ├── admission/       # Admission forms, lists, services
│   │   ├── attendence/      # Attendance marking and tables
│   │   ├── auth/            # Login and registration forms
│   │   ├── class/           # Class management
│   │   ├── exam/            # Exam management
│   │   ├── fees/            # Fee management and payments
│   │   ├── nitfication/     # Notifications and socket provider
│   │   ├── notice/          # Notice board
│   │   ├── result/          # Result management
│   │   ├── share/           # Shared layout components (navbar, footer)
│   │   ├── student/         # Student management
│   │   ├── subject/         # Subject management
│   │   ├── teachers/        # Teacher management
│   │   ├── teachingApplication/ # Teaching job applications
│   │   └── timetable/       # Timetable management
│   ├── dashboard/
│   │   ├── components/      # Dashboard widgets and sidebar
│   │   ├── super-admin/     # Super admin dashboard
│   │   ├── school-admin/    # School admin dashboard
│   │   ├── hr/              # HR dashboard
│   │   ├── accountant/      # Accountant dashboard
│   │   ├── librarian/       # Librarian dashboard
│   │   ├── receptionist/    # Receptionist dashboard
│   │   ├── exam-controller/ # Exam controller dashboard
│   │   ├── teachers/        # Teacher dashboard
│   │   ├── students/        # Student dashboard
│   │   ├── parent/          # Parent dashboard
│   │   └── ...
│   ├── providers/           # Query and Lenis providers
│   └── layout.tsx           # Root layout
├── hooks/                   # Custom React hooks
├── lib/                     # Axios config, utilities, validation
├── middleware/              # Route protection middleware
├── service/                 # Auth and notification services
├── store/                   # Zustand stores
└── tyPes/                   # TypeScript type definitions
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL |
| `NEXT_PUBLIC_SOCKET_URL` | Socket.IO server URL |

## Contributing

1. Fork the repository.
2. Create a feature branch.
3. Commit your changes.
4. Push to the branch.
5. Open a Pull Request.
