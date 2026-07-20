import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { UserPlus, Trash2, Shield, User as UserIcon, Loader2, ArrowLeft } from "lucide-react";
import { api, formatApiErrorDetail } from "@/lib/api";
import Layout from "@/components/Layout";
import { useAuth } from "@/context/AuthContext";

export default function AdminPortal() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState(null);
  const [form, setForm] = useState({ username: "", password: "", name: "", role: "user" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/users");
      setUsers(data);
    } catch {
      setUsers([]);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const create = async (e) => {
    e.preventDefault();
    if (!form.username.trim() || !form.password) {
      toast.error("Username and password are required");
      return;
    }
    setSaving(true);
    try {
      await api.post("/users", form);
      toast.success(`User "${form.username.trim().toLowerCase()}" created`);
      setForm({ username: "", password: "", name: "", role: "user" });
      load();
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail) || "Failed to create user");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id, username) => {
    try {
      await api.delete(`/users/${id}`);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      toast.success(`Deleted "${username}"`);
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail) || "Delete failed");
    }
  };

  return (
    <Layout>
      <Link to="/" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground" data-testid="admin-back-to-modules">
        <ArrowLeft className="h-4 w-4" /> Modules
      </Link>
      <div className="mb-10">
        <p className="text-[0.7rem] uppercase tracking-[0.25em] text-muted-foreground">User management</p>
        <h1 className="mt-2 font-heading text-4xl font-semibold leading-none tracking-tight text-foreground sm:text-5xl">
          Admin Portal
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
        {/* Create form */}
        <div className="lg:col-span-2">
          <div className="border border-border bg-surface p-6">
            <h2 className="flex items-center gap-2 font-heading text-lg font-semibold tracking-tight text-foreground">
              <UserPlus className="h-5 w-5 text-primary" /> Create account
            </h2>
            <form onSubmit={create} className="mt-6 space-y-4" data-testid="create-user-form">
              <div>
                <label className="mb-2 block text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground">Username</label>
                <input
                  data-testid="new-username-input"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  className="h-11 w-full border border-border bg-background px-3 text-foreground outline-none transition-colors focus:border-primary"
                  placeholder="jdoe"
                />
              </div>
              <div>
                <label className="mb-2 block text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground">Full name</label>
                <input
                  data-testid="new-name-input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="h-11 w-full border border-border bg-background px-3 text-foreground outline-none transition-colors focus:border-primary"
                  placeholder="Jane Doe"
                />
              </div>
              <div>
                <label className="mb-2 block text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground">Password</label>
                <input
                  data-testid="new-password-input"
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="h-11 w-full border border-border bg-background px-3 text-foreground outline-none transition-colors focus:border-primary"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="mb-2 block text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground">Account type</label>
                <select
                  data-testid="new-role-select"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="h-11 w-full border border-border bg-background px-3 text-foreground outline-none transition-colors focus:border-primary"
                >
                  <option value="user">General user</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <button
                data-testid="create-user-button"
                type="submit"
                disabled={saving}
                className="flex h-11 w-full items-center justify-center gap-2 bg-primary font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />} Create user
              </button>
            </form>
          </div>
        </div>

        {/* Users list */}
        <div className="lg:col-span-3">
          <div className="border border-border">
            <div className="flex items-center justify-between border-b border-border bg-surface px-5 py-3">
              <span className="text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground">Accounts</span>
              <span className="font-mono text-sm text-foreground" data-testid="user-count">{users ? users.length : "…"}</span>
            </div>
            {users === null ? (
              <p className="px-5 py-10 text-center text-sm text-muted-foreground">Loading…</p>
            ) : (
              <div className="divide-y divide-border" data-testid="users-list">
                {users.map((u) => (
                  <div key={u.id} className="flex items-center gap-4 bg-background px-5 py-4" data-testid={`user-row-${u.username}`}>
                    <div className={`grid h-10 w-10 shrink-0 place-items-center ${u.role === "admin" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                      {u.role === "admin" ? <Shield className="h-5 w-5" /> : <UserIcon className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-foreground">{u.name || u.username}</p>
                      <p className="truncate text-xs text-muted-foreground">@{u.username}</p>
                    </div>
                    <span className={`hidden text-[0.7rem] uppercase tracking-[0.15em] sm:inline ${u.role === "admin" ? "text-primary" : "text-muted-foreground"}`}>
                      {u.role === "admin" ? "Admin" : "General user"}
                    </span>
                    {u.id === me?.id ? (
                      <span className="text-xs text-muted-foreground">You</span>
                    ) : (
                      <button
                        data-testid={`delete-user-${u.username}`}
                        onClick={() => remove(u.id, u.username)}
                        className="grid h-9 w-9 place-items-center border border-border bg-surface text-muted-foreground transition-colors hover:border-destructive hover:text-destructive"
                        aria-label="Delete user"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
