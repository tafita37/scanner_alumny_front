/* Encadré explicatif : <Note tone="gold" ico="⚠">…</Note> */
export default function Note({ tone, ico, className = "", children }) {
  const classes = ["note", tone ? `note-${tone}` : "", className].filter(Boolean).join(" ");
  return (
    <div className={classes}>
      {ico && <span className="note-ico">{ico}</span>}
      <span>{children}</span>
    </div>
  );
}
