"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function DashboardIndex() {
	const router = useRouter();
	const { role } = useAuth();

	useEffect(() => {
		if (!role) return;
		if (role === "ADMIN") router.replace("/dashboard/admin");
		else if (role === "TEACHER") router.replace("/dashboard/teacher");
		else router.replace("/dashboard/student");
	}, [role, router]);

	return null;
}
