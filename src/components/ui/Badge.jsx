import { STATUT_TON } from "@/data/al";

/* <Badge tone="ok" dot>rapport généré</Badge> */
export default function Badge({ tone, dot = false, className = "", children, ...props }) {
  const classes = ["badge", tone ? `badge-${tone}` : "", className].filter(Boolean).join(" ");
  return (
    <span className={classes} {...props}>
      {dot && <i className="dot" />}
      {children}
    </span>
  );
}

/* Badge de statut : la teinte découle du statut métier (AL.statutTon). */
export function StatusBadge({ statut, dot = true }) {
  return <Badge tone={STATUT_TON[statut] || "ink"} dot={dot}>{statut}</Badge>;
}
