import Image from "next/image";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4 py-12 text-foreground">
      <section className="w-full max-w-md rounded-[1.75rem] border border-border bg-card/80 p-6 text-center shadow-2xl shadow-black/30">
        <Image
          alt=""
          className="mx-auto"
          height={56}
          priority
          src="/quantum-logo.svg"
          width={56}
        />
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
          Page not found
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">
          This Quantum page does not exist.
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Start a new conversation or return to your current chat workspace.
        </p>
        <Link
          className="mt-6 inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          href="/"
        >
          Back to Quantum
        </Link>
      </section>
    </main>
  );
}
