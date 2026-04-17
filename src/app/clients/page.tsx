import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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

export default async function Clients() {
  const clients = await prisma.client.findMany({ orderBy: { name: "asc" } });
  return (
    <div className="space-y-6 max-w-4xl">
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
            <TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Phone</TableHead><TableHead>Address</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell>{c.email}</TableCell>
                <TableCell>{c.phone}</TableCell>
                <TableCell>{c.address}</TableCell>
              </TableRow>
            ))}
            {clients.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No clients yet.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
