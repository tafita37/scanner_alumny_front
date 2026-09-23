/* Carte de surface : <Card tint="blue" flat> … </Card> */
export default function Card({ tint, flat = false, as: Tag = "section", className = "", children, ...props }) {
  const classes = [
    "card",
    tint ? `card-tint-${tint}` : "",
    flat ? "card-flat" : "",
    className
  ].filter(Boolean).join(" ");
  return <Tag className={classes} {...props}>{children}</Tag>;
}

/* En-tête de carte : titre + actions/badges alignés à droite. */
export function CardHead({ className = "", children, ...props }) {
  return <div className={`card-head ${className}`.trim()} {...props}>{children}</div>;
}
