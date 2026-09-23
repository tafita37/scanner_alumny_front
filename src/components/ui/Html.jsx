/* Rendu d'un fragment HTML issu des contenus internes de l'application
   (messages du Copilote, toasts…). Les chaînes proviennent uniquement
   des fichiers de données du projet, jamais d'une saisie utilisateur. */
export default function Html({ html, as: Tag = "span", ...props }) {
  return <Tag {...props} dangerouslySetInnerHTML={{ __html: html }} />;
}
