"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/axios";
import { useLenis } from "@/hooks/useLenis";
import type { Role } from "@/tyPes/auth.tyPes";
import { BookOpen, BookMarked, AlertTriangle } from "lucide-react";

type Book = {
  id: string;
  title: string;
  author: string;
  isbn: string;
  status: string;
  dueDate?: string;
};

const roleLabels: Record<Role, string> = {
  SUPER_ADMIN: "Super Admin",
  SCHOOL_ADMIN: "School Admin",
 
  ACCOUNTANT: "Accountant",
  LIBRARIAN: "Librarian",
  TEACHER: "Teacher",
  STUDENT: "Student",
  PARENT: "Parent",
  RECEPTIONIST: "Receptionist",
  EXAM_CONTROLLER: "Exam Controller",
  HR: "HR",
};

export default function LibrarianDashboard() {
  useLenis();
  const router = useRouter();
  const { role } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [overdueCount, setOverdueCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (role && role !== "LIBRARIAN") {
      router.replace("/dashboard");
    }
  }, [role, router]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [booksRes, overdueRes] = await Promise.all([
          api.get("/library/books"),
          api.get("/library/overdue"),
        ]);
        const booksPayload = booksRes.data?.data ?? booksRes.data;
        const overduePayload = overdueRes.data?.data ?? overdueRes.data;
        setBooks(Array.isArray(booksPayload) ? booksPayload : []);
        setOverdueCount(overduePayload?.count ?? 0);
      } catch {
        setBooks([]);
        setOverdueCount(0);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
          {roleLabels.LIBRARIAN} Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">
          Book management, issue/return, and search.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Total Books
            </p>
            <BookOpen className="h-4 w-4 text-sky-500" />
          </div>
          <p className="mt-2 text-2xl font-semibold">{books.length}</p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Issued
            </p>
            <BookMarked className="h-4 w-4 text-amber-500" />
          </div>
          <p className="mt-2 text-2xl font-semibold">
            {books.filter((b) => b.status === "ISSUED").length}
          </p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Overdue
            </p>
            <AlertTriangle className="h-4 w-4 text-rose-500" />
          </div>
          <p className="mt-2 text-2xl font-semibold">{overdueCount}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-soft">
        <h3 className="text-lg font-semibold">Book Inventory</h3>
        <div className="mt-4">
          {loading && (
            <p className="text-xs text-muted-foreground">Loading books...</p>
          )}
          {!loading && books.length === 0 && (
            <p className="text-xs text-muted-foreground">No books in inventory.</p>
          )}
          <div className="divide-y divide-border/60">
            {books.map((book) => (
              <div
                key={book.id}
                className="flex items-center justify-between py-3"
              >
                <div>
                  <p className="text-sm font-medium">{book.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {book.author} · ISBN: {book.isbn}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {book.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
