"use client";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TableCell, TableRow } from "@/components/ui/table";
import { Pencil, Trash2, Check, X, Loader2 } from "lucide-react";

type Client = { id: string; name: string; email: string; phone: string; address: string };

export default function ClientRow({
  client,
  updateAction,
  deleteAction
}: {
  client: Client;
  updateAction: (id: string, data: { name: string; email: string; phone: string; address: string }) => Promise<void>;
  deleteAction: (id: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(client);
  const [pending, startTransition] = useTransition();

  if (editing) {
    return (
      <TableRow>
        <TableCell><Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></TableCell>
        <TableCell><Input value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} /></TableCell>
        <TableCell><Input value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} /></TableCell>
        <TableCell><Input value={draft.address} onChange={(e) => setDraft({ ...draft, address: e.target.value })} /></TableCell>
        <TableCell className="text-right">
          <Button variant="ghost" size="sm" disabled={pending} onClick={() => {
            startTransition(async () => {
              await updateAction(client.id, draft);
              setEditing(false);
            });
          }}>
            {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
          </Button>
          <Button variant="ghost" size="sm" disabled={pending} onClick={() => { setDraft(client); setEditing(false); }}>
            <X className="h-3 w-3" />
          </Button>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <TableRow>
      <TableCell className="font-medium">{client.name}</TableCell>
      <TableCell>{client.email}</TableCell>
      <TableCell>{client.phone}</TableCell>
      <TableCell>{client.address}</TableCell>
      <TableCell className="text-right">
        <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
          <Pencil className="h-3 w-3" />
        </Button>
        <Button variant="ghost" size="sm" disabled={pending} onClick={() => {
          if (!confirm(`Delete client "${client.name}"?`)) return;
          startTransition(async () => { await deleteAction(client.id); });
        }}>
          {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3 text-destructive" />}
        </Button>
      </TableCell>
    </TableRow>
  );
}
