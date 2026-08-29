"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Clock } from "lucide-react";

export default function PendingApprovalPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-2 border-amber-200">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Clock className="w-16 h-16 text-amber-600 animate-pulse" />
          </div>
          <CardTitle className="text-2xl text-amber-900">Approval Pending</CardTitle>
          <CardDescription className="text-lg text-amber-700 mt-2">
            Admission Pending Approval
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-amber-100 border border-amber-300 rounded-lg p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-900">
              <p className="font-semibold mb-1">Your admission is awaiting approval</p>
              <p className="text-amber-800">
                The school administration will review your admission application soon. You will have full dashboard access after approval.
              </p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
            <h3 className="font-semibold text-blue-900">Next steps:</h3>
            <ul className="list-disc list-inside text-sm text-blue-900 space-y-1">
              <li>Wait for admin approval</li>
              <li>Check your email for updates</li>
              <li>Contact the school with any questions</li>
            </ul>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => router.push("/login")}
              variant="default"
              className="w-full"
            >
              Log in again
            </Button>
            <Button
              onClick={() => router.back()}
              variant="outline"
              className="w-full"
            >
              Go back
            </Button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            Your account is active but awaiting approval
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
