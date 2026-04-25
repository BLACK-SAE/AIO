import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getActiveCompany } from "@/lib/activeCompany";
import { saveCompany, setActive, deleteCompany } from "./actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CompanyEditor from "@/components/CompanyEditor";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function Settings({ searchParams }: { searchParams: Promise<{ edit?: string; new?: string }> }) {
  const sp = await searchParams;
  const editId = sp.edit;
  const isNew = sp.new !== undefined;

  if (editId) {
    const c = await prisma.company.findUnique({ where: { id: editId } });
    if (!c) redirect("/settings");
    return (
      <div className="space-y-6 max-w-3xl">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm"><Link href="/settings">← Back</Link></Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Company</h1>
          </div>
        </div>
        <CompanyEditor company={c!} action={saveCompany} />
      </div>
    );
  }

  if (isNew) {
    return (
      <div className="space-y-6 max-w-3xl">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm"><Link href="/settings">← Back</Link></Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">New Company</h1>
          </div>
        </div>
        <CompanyEditor company={null} action={saveCompany} />
      </div>
    );
  }

  const companies = await prisma.company.findMany({ orderBy: { createdAt: "asc" } });
  const active = await getActiveCompany();

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Companies</h1>
          <p className="text-muted-foreground text-sm">
            Manage company profiles. The active company is used when creating new documents.
          </p>
        </div>
        <Button asChild><Link href="/settings?new">+ Add Company</Link></Button>
      </div>

      {companies.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No companies yet. Click <strong>+ Add Company</strong> to set one up.
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {companies.map((c) => {
          const isActive = active?.id === c.id;
          return (
            <Card key={c.id} className={isActive ? "ring-2 ring-primary" : ""}>
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-lg">{c.name}</CardTitle>
                  {isActive && <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">ACTIVE</span>}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2 items-start">
                  {c.logoPath ? (
                    <img src={c.logoPath} alt="logo" className="h-14 w-14 object-contain border rounded p-1 bg-white shrink-0" />
                  ) : (
                    <div className="h-14 w-14 border rounded bg-muted shrink-0" />
                  )}
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    {c.address && <div className="line-clamp-2">{c.address}</div>}
                    {c.phone && <div>{c.phone}</div>}
                    {c.email && <div>{c.email}</div>}
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button asChild variant="outline" size="sm"><Link href={`/settings?edit=${c.id}`}>Edit</Link></Button>
                  {!isActive && (
                    <form action={setActive}>
                      <input type="hidden" name="id" value={c.id} />
                      <Button type="submit" variant="secondary" size="sm">Set Active</Button>
                    </form>
                  )}
                  <form action={deleteCompany}>
                    <input type="hidden" name="id" value={c.id} />
                    <Button type="submit" variant="ghost" size="sm" className="text-destructive">Delete</Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
