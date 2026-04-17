import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2 } from "lucide-react";

export const dynamic = "force-dynamic";

async function add(formData: FormData) {
  "use server";
  await prisma.product.create({
    data: {
      name: String(formData.get("name") || ""),
      description: String(formData.get("description") || "") || null,
      unitPrice: Number(formData.get("unitPrice") || 0),
      unit: String(formData.get("unit") || "") || null
    }
  });
  revalidatePath("/products");
}

async function remove(formData: FormData) {
  "use server";
  await prisma.product.delete({ where: { id: String(formData.get("id")) } });
  revalidatePath("/products");
}

export default async function Products() {
  const items = await prisma.product.findMany({ orderBy: { name: "asc" } });
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Products / Services</h1>
        <p className="text-muted-foreground text-sm">{items.length} total</p>
      </div>
      <Card>
        <CardContent className="pt-6">
          <form action={add} className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input name="name" placeholder="Name" required />
            <Input name="unit" placeholder="Unit (e.g. bag, hr)" />
            <Input name="unitPrice" type="number" step="0.01" placeholder="Unit Price" required />
            <Input name="description" placeholder="Description" />
            <Button type="submit" className="md:col-span-2">Add Product</Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <Table>
          <TableHeader>
            <TableRow><TableHead>Name</TableHead><TableHead>Unit</TableHead><TableHead className="text-right">Price</TableHead><TableHead>Description</TableHead><TableHead></TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {items.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell>{p.unit}</TableCell>
                <TableCell className="text-right">{Number(p.unitPrice).toLocaleString()}</TableCell>
                <TableCell>{p.description}</TableCell>
                <TableCell className="text-right">
                  <form action={remove}>
                    <input type="hidden" name="id" value={p.id} />
                    <Button type="submit" variant="ghost" size="icon"><Trash2 className="h-3 w-3 text-destructive" /></Button>
                  </form>
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No products yet.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
