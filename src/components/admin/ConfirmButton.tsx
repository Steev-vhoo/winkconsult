"use client";

/** A submit button that asks for confirmation first. */
export function ConfirmButton({ message, children, className = "btn btn-danger btn-sm" }: { message: string; children: React.ReactNode; className?: string }) {
  return (
    <button type="submit" className={className} onClick={(e) => { if (!confirm(message)) e.preventDefault(); }}>
      {children}
    </button>
  );
}

/** A select that submits its form as soon as it changes (for quick status updates). */
export function AutoSubmitSelect({ name, defaultValue, options, label }: { name: string; defaultValue: string; options: [string, string][]; label: string }) {
  return (
    <select className="inline-select" name={name} defaultValue={defaultValue} aria-label={label}
      onChange={(e) => e.currentTarget.form?.requestSubmit()} style={{ width: "auto", padding: "6px 8px", fontSize: ".84rem" }}>
      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  );
}
