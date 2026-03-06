import { requireAdminServerAccess } from "@/lib/admin-guard";
import { getSupabaseServerClient } from "@/lib/supabase-server";

interface ProfileRow {
  id: string;
  email: string | null;
  role: string | null;
}

export const dynamic = "force-dynamic";

export default async function DashboardAdminUsersPage() {
  await requireAdminServerAccess();
  const supabase = await getSupabaseServerClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("id,email,role")
    .order("email", { ascending: true })
    .returns<ProfileRow[]>();

  if (error) {
    return (
      <section className="card">
        <h2>Users</h2>
        <p className="error">No se pudo cargar perfiles: {error.message}</p>
      </section>
    );
  }

  return (
    <section className="card">
      <h2>Users</h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Email</th>
              <th>Role</th>
              <th>ID</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((profile) => (
              <tr key={profile.id}>
                <td>{profile.email ?? "-"}</td>
                <td>{profile.role ?? "user"}</td>
                <td>{profile.id}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
