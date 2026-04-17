import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileText, ScrollText, Truck, Users, Package, Settings, Mail } from "lucide-react";

const cards = [
  { href: "/invoices/new", title: "New Invoice", desc: "Create an invoice with AI", icon: FileText },
  { href: "/quotations/new", title: "New Quotation", desc: "Draft a price quote", icon: ScrollText },
  { href: "/waybills/new", title: "New Waybill", desc: "Prepare delivery paperwork", icon: Truck },
  { href: "/letters/new", title: "New Letter", desc: "Draft a custom letter with AI", icon: Mail },
  { href: "/clients", title: "Clients", desc: "Manage client records", icon: Users },
  { href: "/products", title: "Products", desc: "Catalog for faster drafts", icon: Package },
  { href: "/settings", title: "Company Settings", desc: "Logo, address, tax info", icon: Settings }
];

export default function Home() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Prepare quotations, invoices, and waybills with AI assistance.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c) => (
          <Link key={c.href} href={c.href}>
            <Card className="hover:bg-accent/40 transition-colors h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10"><c.icon className="h-5 w-5" /></div>
                  <CardTitle>{c.title}</CardTitle>
                </div>
                <CardDescription>{c.desc}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
