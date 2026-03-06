import { AdminLogoutButton } from "@/components/custom/admin-logout-button";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <AdminLogoutButton />
    </>
  );
}
