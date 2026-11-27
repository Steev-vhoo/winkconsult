import { ICONS } from "@/lib/icons";

/** Renders one of the project's own inline SVG icons (never user input). */
export function Icon({ name, className }: { name: string; className?: string }) {
  const svg = ICONS[name] ?? ICONS.check;
  return <span className={className ?? "i"} aria-hidden="true" dangerouslySetInnerHTML={{ __html: svg }} />;
}
