import { DeleteNoteButton } from "@/components/notes/delete-note-button";
import { NoteForm } from "@/components/notes/note-form";
import type { OrgScope } from "@/lib/org-scope";

const dateFormat = new Intl.DateTimeFormat("es", { dateStyle: "medium", timeStyle: "short" });

/**
 * The example screen: an organization's notes. It shows the read path every
 * screen takes — a server component, given the request's organization scope,
 * reading through supabase-js with the person's token so RLS decides what
 * comes back.
 */
export async function NotesView({ scope }: { scope: OrgScope }) {
  const { data: notes, error } = await scope.supabase
    .from("note")
    .select("id, body, created_at, created_by, author:user!note_created_by_user_id_fk(name)")
    .order("created_at", { ascending: false });
  if (error) throw error;

  return (
    <div className="space-y-8">
      <h1 className="page-title">{scope.org.name}</h1>

      {scope.can({ note: ["create"] }) && <NoteForm orgId={scope.org.id} />}

      {notes.length === 0 ? (
        <p className="text-muted-foreground">Todavía no hay notas.</p>
      ) : (
        <ul aria-label="Notas" className="divide-y rounded-lg border">
          {notes.map((note) => (
            <li key={note.id} className="flex items-start justify-between gap-4 px-4 py-3">
              <div className="space-y-1">
                <p className="whitespace-pre-wrap">{note.body}</p>
                <p className="text-muted-foreground text-sm">
                  {note.author?.name} · {dateFormat.format(new Date(note.created_at))}
                </p>
              </div>
              <DeleteNoteButton orgId={scope.org.id} noteId={note.id} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
