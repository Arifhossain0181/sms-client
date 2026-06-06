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
          <CardTitle className="text-2xl text-amber-900">অনুমোদন অপেক্ষমাণ</CardTitle>
          <CardDescription className="text-lg text-amber-700 mt-2">
            Admission Pending Approval
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-amber-100 border border-amber-300 rounded-lg p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-900">
              <p className="font-semibold mb-1">আপনার ভর্তি অনুমোদনের অপেক্ষায় আছে</p>
              <p className="text-amber-800">
                স্কুল কর্তৃপক্ষ শীঘ্রই আপনার ভর্তি আবেদন পর্যালোচনা করবেন। অনুমোদন হওয়ার পর আপনি সম্পূর্ণ ড্যাশবোর্ড অ্যাক্সেস করতে পারবেন।
              </p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
            <h3 className="font-semibold text-blue-900">পরবর্তী ধাপ:</h3>
            <ul className="list-disc list-inside text-sm text-blue-900 space-y-1">
              <li>Admin অনুমোদনের জন্য অপেক্ষা করুন</li>
              <li>আপনার ইমেইল চেক করুন সম্পূর্ণ খবরের জন্য</li>
              <li>যেকোনো প্রশ্নের জন্য স্কুলের সাথে যোগাযোগ করুন</li>
            </ul>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => router.push("/login")}
              variant="default"
              className="w-full"
            >
              পুনরায় লগইন করুন
            </Button>
            <Button
              onClick={() => router.back()}
              variant="outline"
              className="w-full"
            >
              ফিরে যান
            </Button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            আপনার অ্যাকাউন্ট সক্রিয় রয়েছে কিন্তু অনুমোদনের জন্য অপেক্ষমাণ
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
