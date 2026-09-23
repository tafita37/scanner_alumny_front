/* Panneau de gauche de la connexion : promesse produit + chiffres clés. */

const STATS = [
  ["3", <>moteurs sectoriels<br />BTP · Services · Industrie</>],
  ["10-12", <>pages de rapport<br />générées par le Copilote</>],
  ["100 %", <>anonymisation locale<br />avant tout appel externe</>]
];

export default function LoginArt() {
  return (
    <section className="login-art">
      <div className="art-brand">
        <span className="brand-mark">A</span>
        <span>
          <span className="brand-name">Alumny</span><br />
          <span className="brand-sub">scanner &amp; copilote</span>
        </span>
      </div>

      <div className="art-claim">
        <h1>Chaque euro qui fuit<br />a une trace écrite.</h1>
        <p className="art-lead">
          L&apos;outil interne des consultants Alumny : ingestion des devis, factures et bilans,
          moteur de calcul « Perte Sèche » par secteur, et rapport d&apos;audit prêt à remettre.
        </p>
      </div>

      <div className="art-stats">
        {STATS.map(([valeur, legende], i) => (
          <div key={i}><b>{valeur}</b><span>{legende}</span></div>
        ))}
      </div>

      <p className="art-foot hand">Outil strictement interne — le client final ne reçoit que le PDF.</p>
    </section>
  );
}
