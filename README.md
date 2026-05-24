# SMS Frontend

School Management System (SMS) frontend built with Next.js. This app provides role-based dashboards and modules for common school operations.

## Main Features

- Role-based access for Admin, Teacher, and Student
- Authentication with access/refresh token flow
- Dashboards for different roles
- Student management
- Teacher management
- Class and section management
- Subject management
- Admission and teaching application flows
- Attendance tracking
- Exams and results
- Fees and payments
- Notices and notifications (real-time)
- Timetable

## Tech Stack

- Next.js (App Router)
- React, TypeScript, Tailwind CSS
- TanStack Query for data fetching and caching
- Zustand for client state
- Socket.IO client for real-time notifications
- Axios for API calls

## Getting Started

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

## Environment Variables

Create a .env.local file in the project root:

```bash
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

## Scripts

- dev: Start Next.js dev server
- build: Create production build
- start: Run production server
- lint: Run ESLint
