import Link from "next/link";

export default function NotFound() {
  return (
    <div className="space-y-2">
      <h1 className="page-title">No encontramos esa página</h1>
      <p className="text-muted-foreground">
        O no existe, o no tienes acceso a ella.{" "}
        <Link href="/" className="tap-target underline underline-offset-4">
          Volver al inicio
        </Link>
      </p>
    </div>
  );
}
