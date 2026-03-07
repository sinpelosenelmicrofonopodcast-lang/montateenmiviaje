import { redirect } from "next/navigation";

export default function LegacyDashboardAdminLayout({ children }: { children: React.ReactNode }) {
  void children;
  redirect("/admin");
}
