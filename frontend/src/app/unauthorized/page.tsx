import { AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0D0D0D]">
      <div className="text-center">
        <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
          <AlertTriangle size={32} className="text-red-500" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Access Denied</h1>
        <p className="text-zinc-500 max-w-sm mx-auto mb-8">
          You do not have the required permissions to view this secure routing area. Your attempt has been logged.
        </p>
        <Link href="/dashboard-router" className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-medium hover:bg-white/10 transition">
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
