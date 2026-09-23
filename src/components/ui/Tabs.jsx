"use client";

/* Onglets contrôlés : items = [{ id, label }] */
export default function Tabs({ items, value, onChange, className = "" }) {
  return (
    <div className={`tabs ${className}`.trim()} role="tablist">
      {items.map(t => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={value === t.id}
          className={"tab" + (value === t.id ? " is-on" : "")}
          onClick={() => onChange(t.id)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

/* Panneau associé : masqué par la classe .hidden, comme dans la maquette. */
export function TabPanel({ active, children }) {
  return <div className={active ? undefined : "hidden"}>{children}</div>;
}
