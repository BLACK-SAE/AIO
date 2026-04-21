import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import ClientRow from "@/components/ClientRow";

export const dynamic = "force-dynamic";

async function add(formData: FormData) {
  "use server";
  await prisma.client.create({
    data: {
      name: String(formData.get("name") || ""),
      email: String(formData.get("email") || "") || null,
      phone: String(formData.get("phone") || "") || null,
      address: String(formData.get("address") || "") || null
    }
  });
  revalidatePath("/clients");
}

async function update(id: string, data: { name: string; email: string; phone: string; address: string }) {
  "use server";
  await prisma.client.update({
    where: { id },
    data: {
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      address: data.address || null
    }
  });
  revalidatePath("/clients");
}

async function remove(id: string) {
  "use server";
  await prisma.client.delete({ where: { id } });
  revalidatePath("/clients");
}

export default async function Clients() {
  const clients = await prisma.client.findMany({ orderBy: { name: "asc" } });
  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
        <p className="text-muted-foreground text-sm">{clients.length} total</p>
      </div>
      <Card>
        <CardContent className="pt-6">
          <form action={add} className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input name="name" placeholder="Name" required />
            <Input name="email" placeholder="Email" />
            <Input name="phone" placeholder="Phone" />
            <Input name="address" placeholder="Address" />
            <Button type="submit" className="md:col-span-2">Add Client</Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Address</TableHead>
              <TableHead className="w-32 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((c) => (
              <ClientRow
                key={c.id}
                client={{
                  id: c.id,
                  name: c.name,
                  email: c.email || "",
                  phone: c.phone || "",
                  address: c.address || ""
                }}
                updateAction={update}
                deleteAction={remove}
              />
            ))}
            {clients.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No clients yet.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
