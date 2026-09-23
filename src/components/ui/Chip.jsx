"use client";

/* Pastille cliquable. */
export default function Chip({ active = false, className = "", children, ...props }) {
  return (
    <button
      type="button"
      className={["chip", active ? "is-on" : "", className].filter(Boolean).join(" ")}
      aria-pressed={active}
      {...props}
    >
      {children}
    </button>
  );
}

/* Groupe de pastilles à sélection unique — le filtre le plus courant de l'outil.
   options : [{ value, label }] ou ["BTP", "Services"] */
export function ChipFilter({ options, value, onChange, className = "row gap-s wrap mb" }) {
  return (
    <div className={className}>
      {options.map(opt => {
        const o = typeof opt === "string" ? { value: opt, label: opt } : opt;
        return (
          <Chip key={o.value} active={value === o.value} onClick={() => onChange(o.value)}>
            {o.label}
          </Chip>
        );
      })}
    </div>
  );
}
