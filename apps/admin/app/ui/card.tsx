import { ReactNode } from "react";

type CardProps = {
  title?: string;
  value?: string;
  children?: ReactNode;
};

export function Card({ title, value, children }: CardProps) {
  return (
    <section className="card">
      {title ? <p className="card-title">{title}</p> : null}
      {value ? <p className="card-value">{value}</p> : null}
      {children}
    </section>
  );
}
