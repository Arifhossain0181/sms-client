"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/axios";
import { useAuth } from "@/hooks/useAuth";
import { formatDate } from "@/lib/utils";

const unwrap = <T,>(res: { data: any }) => (res.data?.data ?? res.data) as T;

type LibraryBook = {
  id: string;
  bookId: string;
  title: string;
  author: string;
  isbn: string;
  issueDate: string;
  dueDate: string;
  returnDate: string | null;
  fine: number;
};

export default function StudentLibraryPage() {
  const { role } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [books, setBooks] = useState<LibraryBook[]>([]);

  useEffect(() => {
    if (role && role !== "STUDENT") {
      window.location.href = "/dashboard";
    }
  }, [role]);

  useEffect(() => {
    const loadBooks = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get("/library/my-books");
        const data = unwrap<LibraryBook[]>(res);
        setBooks(data);
      } catch (err) {
        setError("Failed to load library books");
      } finally {
        setLoading(false);
      }
    };
    loadBooks();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Library</h1>
          <p className="text-sm text-muted-foreground">Books issued to you.</p>
        </div>
        <Link href="/dashboard/student" className="text-sm text-primary hover:underline">
          Back to dashboard
        </Link>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        </div>
      )}

      {!loading && books.length === 0 && (
        <div className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-soft text-center text-sm text-muted-foreground">
          No books currently issued.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {books.map((book) => (
          <div key={book.id} className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-soft space-y-2">
            <h3 className="text-lg font-semibold">{book.title}</h3>
            <p className="text-xs text-muted-foreground">Author: {book.author}</p>
            <p className="text-xs text-muted-foreground">ISBN: {book.isbn}</p>
            <p className="text-xs text-muted-foreground">Issued: {formatDate(book.issueDate)}</p>
            <p className="text-xs text-muted-foreground">Due: {formatDate(book.dueDate)}</p>
            {book.returnDate && (
              <p className="text-xs text-muted-foreground">Returned: {formatDate(book.returnDate)}</p>
            )}
            {book.fine > 0 && (
              <p className="text-xs text-rose-600 font-medium">Fine: ৳{book.fine.toFixed(2)}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
