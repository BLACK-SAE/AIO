"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FileText, ScrollText, Truck, Users, Package, Settings, Home, Mail, LogOut } from "lucide-react";

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

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/login") return null;

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="w-60 border-r bg-card hidden md:flex flex-col">
      <div className="p-6 border-b">
        <Link href="/" className="font-bold text-lg">AIO Docs</Link>
        <p className="text-xs text-muted-foreground mt-1">Document AI</p>
      </div>
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
