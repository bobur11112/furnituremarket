import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="border-t border-[var(--border-subtle)] bg-background/70">
      <div className="container grid gap-8 py-10 md:grid-cols-[1.3fr_1fr_1fr]">
        <div>
          <Link to="/" className="font-display text-3xl font-bold">
            Möbel
          </Link>
          <p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">
            Editorial furniture marketplace for refined homes, independent ateliers, and collectors who care about material truth.
          </p>
        </div>
        <div className="grid gap-2 text-sm">
          <p className="font-semibold text-foreground">Marketplace</p>
          <Link className="text-muted-foreground hover:text-primary" to="/catalog">
            Catalog
          </Link>
          <Link className="text-muted-foreground hover:text-primary" to="/seller/dashboard">
            Seller dashboard
          </Link>
        </div>
        <div className="grid gap-2 text-sm">
          <p className="font-semibold text-foreground">Care</p>
          <p className="text-muted-foreground">Concierge sourcing</p>
          <p className="text-muted-foreground">Insured delivery</p>
        </div>
      </div>
    </footer>
  );
}
