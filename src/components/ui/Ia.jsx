/* ============================================================
   Signature IA — l'or de la charte marque les briques d'intelligence.
   Le niveau P0/P1/P2 indique la FAISABILITÉ, pas une étape produit.
   ============================================================ */

export function IaPhase({ phase = 0 }) {
  return <span className={`ia-p p${phase}`}>P{phase}</span>;
}

export function IaTag({ children, phase = 0 }) {
  return (
    <span className="ia">
      {children}
      <IaPhase phase={phase} />
    </span>
  );
}

export function IaBlock({ className = "", children, ...props }) {
  return <section className={`ia-block ${className}`.trim()} {...props}>{children}</section>;
}

export function IaOut({ className = "", children, ...props }) {
  return <div className={`ia-out ${className}`.trim()} {...props}>{children}</div>;
}

export function IaSrc({ children }) {
  return <span className="ia-src">{children}</span>;
}

/* Barre de confiance : <IaConf value={0.91} /> */
export function IaConf({ value, className = "" }) {
  return (
    <span className={`ia-conf ${className}`.trim()}>
      confiance <i><b style={{ width: `${Math.round(value * 100)}%` }} /></i>{" "}
      {value.toFixed(2).replace(".", ",")}
    </span>
  );
}
