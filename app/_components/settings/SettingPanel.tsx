import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export function SettingPanel({
  children,
  description,
  icon: Icon,
  title,
}: {
  children: ReactNode;
  description: string;
  icon: LucideIcon;
  title: string;
}) {
  return (
    <section className="rounded-[1.35rem] border border-border bg-card/80 p-4 shadow-xl shadow-black/10 sm:p-5">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-primary">
          <Icon size={17} />
        </span>
        <div>
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
      {children}
    </section>
  );
}

export function ToggleRow({
  checked,
  description,
  icon: Icon,
  label,
  onChange,
}: {
  checked: boolean;
  description: string;
  icon: LucideIcon;
  label: string;
  onChange: (enabled: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center gap-4 rounded-2xl border border-border bg-muted/20 p-4 text-left transition hover:bg-muted/40"
      aria-pressed={checked}
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.05] text-primary">
        <Icon size={16} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-foreground">
          {label}
        </span>
        <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">
          {description}
        </span>
      </span>
      <span
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${
          checked ? "bg-primary" : "bg-muted"
        }`}
      >
        <span
          className={`absolute top-1 size-4 rounded-full bg-white shadow transition ${
            checked ? "left-6" : "left-1"
          }`}
        />
      </span>
    </button>
  );
}
