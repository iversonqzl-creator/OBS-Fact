import { Link, useLocation, useNavigate } from "react-router-dom";
import { FileText, LogOut, LayoutGrid, Shield } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const nav = [
    { to: "/", label: "Modules", icon: LayoutGrid },
    ...(user?.role === "admin" ? [{ to: "/admin", label: "Admin", icon: Shield }] : []),
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-3" data-testid="brand-link">
              <div className="grid h-9 w-9 place-items-center bg-primary text-primary-foreground">
                <FileText className="h-4 w-4" />
              </div>
              <span className="font-heading text-base font-semibold tracking-tight text-foreground">WANOSC-Toolbox</span>
            </Link>
            <nav className="hidden items-center gap-1 sm:flex">
              {nav.map((n) => {
                const active = location.pathname === n.to;
                const Icon = n.icon;
                return (
                  <Link
                    key={n.to}
                    to={n.to}
                    data-testid={`nav-${n.label.toLowerCase()}`}
                    className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors ${active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
                  >
                    <Icon className="h-4 w-4" /> {n.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">{user?.username}</span>
            <ThemeToggle />
            <button
              data-testid="logout-button"
              onClick={() => { logout(); navigate("/login"); }}
              className="flex h-10 items-center gap-2 border border-border bg-surface px-4 text-sm text-foreground transition-colors hover:bg-muted"
            >
              <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}
