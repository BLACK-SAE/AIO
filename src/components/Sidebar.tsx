"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FileText, ScrollText, Truck, Users, Package, Settings, Home, Mail, LogOut, Building2, ChevronDown } from "lucide-react";

const nav = [
  { href: "/", label: "Home", icon: Home },
  { href: "/invoices", label: "Invoices", icon: FileText },
  { href: "/quotations", label: "Quotations", icon: ScrollText },
  { href: "/waybills", label: "Waybills", icon: Truck },
  { href: "/letters", label: "Letters", icon: Mail },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/products", label: "Products", icon: Package },
  { href: "/settings", label: "Settings", icon: Settings }
];

type Co = { id: string; name: string; isActive: boolean };

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [companies, setCompanies] = useState<Co[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (pathname === "/login") return;
    fetch("/api/companies").then((r) => r.json()).then(setCompanies).catch(() => {});
  }, [pathname]);

  if (pathname === "/login") return null;

  const active = companies.find((c) => c.isActive) || companies[0];

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  async function switchCo(id: string) {
    setOpen(false);
    await fetch("/api/companies/switch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id })
    });
    router.refresh();
    setCompanies((cs) => cs.map((c) => ({ ...c, isActive: c.id === id })));
  }

  return (
    <aside className="w-60 border-r bg-card hidden md:flex flex-col">
      <div className="p-6 border-b">
        <Link href="/" className="font-bold text-lg">AIO Docs</Link>
        <p className="text-xs text-muted-foreground mt-1">Document AI</p>
      </div>

      {companies.length > 0 && (
        <div className="px-3 py-3 border-b relative">
          <button
            onClick={() => setOpen((o) => !o)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm bg-accent/50 hover:bg-accent text-left"
          >
            <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <div className="text-xs text-muted-foreground">Active company</div>
              <div className="font-medium truncate">{active?.name || "—"}</div>
            </div>
            <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
          </button>
          {open && (
            <div className="absolute left-3 right-3 top-full mt-1 bg-popover border rounded-md shadow-lg z-10 py-1 max-h-72 overflow-auto">
              {companies.map((c) => (
                <button
                  key={c.id}
                  onClick={() => switchCo(c.id)}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-accent flex items-center gap-2 ${c.isActive ? "bg-accent/50 font-medium" : ""}`}
                >
                  <Building2 className="h-3 w-3 text-muted-foreground" />
                  <span className="truncate">{c.name}</span>
                  {c.isActive && <span className="ml-auto text-[10px] text-muted-foreground">●</span>}
                </button>
              ))}
              <div className="border-t mt-1 pt-1">
                <Link
                  href="/settings"
                  onClick={() => setOpen(false)}
                  className="block px-3 py-2 text-sm text-muted-foreground hover:bg-accent"
                >
                  Manage companies →
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      <nav className="p-3 space-y-1 flex-1">
        {nav.map((n) => (
          <Link key={n.href} href={n.href}
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-accent hover:text-accent-foreground">
            <n.icon className="h-4 w-4" /> {n.label}
          </Link>
        ))}
      </nav>
      <div className="p-3 border-t">
        <button onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-accent hover:text-accent-foreground text-muted-foreground">
          <LogOut className="h-4 w-4" /> Lock
        </button>
      </div>
    </aside>
  );
}
