export const dynamic = "force-dynamic";

import { Sidebar } from "@/components/sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="ms-64 p-8">{children}</main>
    </div>
  );
}
