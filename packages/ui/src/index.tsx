import type { ButtonHTMLAttributes, PropsWithChildren } from "react";
export function Button({
  children,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={`gf-button ${className}`} {...props}>
      {children}
    </button>
  );
}
export function Panel({
  children,
  className = "",
}: PropsWithChildren<{ className?: string }>) {
  return <section className={`gf-panel ${className}`}>{children}</section>;
}
export const formatMoney = (value: number) =>
  `${new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)} M€`;
