import { requireAdminServerAccess } from "@/lib/admin-guard";
import { getSupabaseServerClient } from "@/lib/supabase-server";

interface ProfileRow {
  id: string;
  email: string | null;
  role: string | null;
  full_name?: string | null;
  account_status?: string | null;
  profile_completed?: boolean | null;
}

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  await requireAdminServerAccess();
  const supabase = await getSupabaseServerClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("email", { ascending: true })
    .returns<ProfileRow[]>();

  return (
    <main className="container section">
      <header className="page-header">
        <p className="chip">Usuarios</p>
        <h1>Perfiles y roles</h1>
        <p className="section-subtitle">Vista centralizada de cuentas internas y permisos.</p>
      </header>

      <section className="card">
        {error ? <p className="error">No se pudo cargar perfiles: {error.message}</p> : null}
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Email</th>
                <th>Role</th>
                <th>Estado</th>
                <th>Perfil completo</th>
                <th>ID</th>
              </tr>
            </thead>
            <tbody>
              {(data ?? []).map((profile) => (
                <tr key={profile.id}>
                  <td>{profile.full_name ?? "-"}</td>
                  <td>{profile.email ?? "-"}</td>
                  <td>{profile.role ?? "user"}</td>
                  <td>{profile.account_status ?? "active"}</td>
                  <td>{profile.profile_completed ? "Sí" : "No"}</td>
                  <td>{profile.id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
