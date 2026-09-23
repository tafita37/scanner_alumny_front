/* ============================================================
   Petits composants transverses de la charte Alumny
   ============================================================ */

import { Fragment } from "react";

/* Barre de progression : <Bar value={62} tint="gold" /> */
export function Bar({ value = 0, tint, className = "" }) {
  const classes = ["bar", tint ? `bar-${tint}` : "", className].filter(Boolean).join(" ");
  return <div className={classes}><i style={{ width: `${value}%` }} /></div>;
}

/* Zone réservée à un visuel non encore fourni (hachures de la maquette). */
export function Placeholder({ className = "", style, children, ...props }) {
  return <div className={`ph ${className}`.trim()} style={style} {...props}>{children}</div>;
}

export function Spinner({ className = "", style }) {
  return <span className={`spin ${className}`.trim()} style={style} aria-hidden="true" />;
}

export function Divider({ className = "" }) {
  return <hr className={`divider ${className}`.trim()} />;
}

/* Conteneur de tableau : défilement horizontal maîtrisé sur mobile. */
export function TableWrap({ className = "", children }) {
  return <div className={`table-wrap ${className}`.trim()}>{children}</div>;
}

export function Table({ className = "", children, ...props }) {
  return <table className={`tbl ${className}`.trim()} {...props}>{children}</table>;
}

/* Fil d'étapes de l'assistant d'onboarding.
   etapes : [{ n, label }] · courante : numéro de l'étape active */
export function Steps({ etapes, courante, className = "" }) {
  return (
    <div className={`steps ${className}`.trim()}>
      {etapes.map((e, i) => (
        <Fragment key={e.n}>
          {i > 0 && <span className="step-sep" />}
          <div className={"step" + (e.n === courante ? " is-on" : e.n < courante ? " is-done" : "")}>
            <span className="step-n">{e.n < courante ? "✓" : e.n}</span>
            <span className="step-t">{e.label}</span>
          </div>
        </Fragment>
      ))}
    </div>
  );
}

/* Interrupteur de la charte (paramètres, sécurité). */
export function Switch({ checked, onChange, disabled = false, "aria-label": ariaLabel }) {
  return (
    <label className="switch">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        aria-label={ariaLabel}
        onChange={e => onChange?.(e.target.checked)}
      />
      <span />
    </label>
  );
}

/* Champ de formulaire : label + contrôle + indication éventuelle. */
export function Field({ label, hint, hintClassName = "hint", htmlFor, className = "", children }) {
  return (
    <div className={`field ${className}`.trim()}>
      {label && <label htmlFor={htmlFor}>{label}</label>}
      {children}
      {hint && <span className={hintClassName}>{hint}</span>}
    </div>
  );
}
