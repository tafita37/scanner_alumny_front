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
   etapes : [{ n, label }] · courante : numéro de l'étape active
   atteinte : étape la plus avancée déjà atteinte (défaut : courante)
   onAller : si fourni, les étapes déjà atteintes deviennent cliquables pour y revenir */
export function Steps({ etapes, courante, atteinte = courante, onAller, className = "" }) {
  return (
    <div className={`steps ${className}`.trim()}>
      {etapes.map((e, i) => {
        const faite = e.n < atteinte && e.n !== courante;
        const accessible = e.n <= atteinte && e.n !== courante;
        const classes = "step" + (e.n === courante ? " is-on" : faite ? " is-done" : "");
        const contenu = (
          <>
            <span className="step-n">{faite ? "✓" : e.n}</span>
            <span className="step-t">{e.label}</span>
          </>
        );
        return (
          <Fragment key={e.n}>
            {i > 0 && <span className="step-sep" />}
            {accessible && onAller ? (
              <button type="button" className={classes} onClick={() => onAller(e.n)} title={`Aller à l'étape ${e.n}`}>
                {contenu}
              </button>
            ) : (
              <div className={classes} aria-current={e.n === courante ? "step" : undefined}>{contenu}</div>
            )}
          </Fragment>
        );
      })}
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

/* Champ de formulaire : label + contrôle + indication éventuelle.
   error : message d'erreur affiché à la place de l'indication. */
export function Field({ label, hint, hintClassName = "hint", error, htmlFor, className = "", children }) {
  return (
    <div className={`field ${error ? "is-err " : ""}${className}`.trim()}>
      {label && <label htmlFor={htmlFor}>{label}</label>}
      {children}
      {error ? <span className="hint hint-err">{error}</span> : hint && <span className={hintClassName}>{hint}</span>}
    </div>
  );
}
