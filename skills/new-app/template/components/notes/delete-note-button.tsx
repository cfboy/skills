"use client";

import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { deleteNote } from "@/actions/notes";
import { useServerAction } from "@/lib/use-server-action";

export function DeleteNoteButton({ orgId, noteId }: { orgId: string; noteId: string }) {
  const remove = useServerAction(deleteNote, { success: "Nota borrada." });

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Borrar nota"
      disabled={remove.isPending}
      onClick={() => remove.mutate({ orgId, noteId })}
    >
      <Trash2 aria-hidden />
    </Button>
  );
}
