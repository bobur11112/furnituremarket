import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu, Search, ShoppingBag, UserRound } from "lucide-react";
import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Catalog", href: "/catalog" },
  { label: "Sell", href: "/seller/dashboard" },
  { label: "Profile", href: "/profile" },
];

function NavItem({ href, label, onClick }: { href: string; label: string; onClick?: () => void }) {
  return (
    <NavLink
      to={href}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          "text-sm font-medium text-muted-foreground transition-colors hover:text-primary",
          isActive && "text-primary",
        )
      }
    >
      {label}
    </NavLink>
  );
}

export function Header() {
  const { totalQuantity, openCart } = useCart();
  const { user, profile } = useAuth();
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => setScrolled(latest > 24));

  return (
    <motion.header
      initial={{ y: -18, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={cn(
        "sticky top-0 z-40 border-b border-[var(--border-subtle)] bg-background/78 backdrop-blur transition-shadow",
        scrolled && "shadow-card",
      )}
    >
      <div className="container flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open navigation">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80">
              <SheetHeader>
                <SheetTitle className="font-display text-3xl">Möbel</SheetTitle>
                <SheetDescription>Curated furniture for rooms with a point of view.</SheetDescription>
              </SheetHeader>
              <nav className="mt-8 grid gap-5">
                {navItems.map((item) => (
                  <NavItem key={item.href} {...item} onClick={() => setMobileOpen(false)} />
                ))}
              </nav>
            </SheetContent>
          </Sheet>

          <Link to="/" className="font-display text-3xl font-bold tracking-normal text-foreground" aria-label="Möbel home">
            Möbel
          </Link>
        </div>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary navigation">
          {navItems.map((item) => (
            <NavItem key={item.href} {...item} />
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild aria-label="Search catalog">
            <Link to="/catalog">
              <Search className="h-5 w-5" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" onClick={openCart} className="relative" aria-label="Open cart">
            <ShoppingBag className="h-5 w-5" />
            {totalQuantity > 0 ? (
              <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-xs font-bold text-primary-foreground">
                {totalQuantity}
              </span>
            ) : null}
          </Button>
          <Button variant="outline" size="sm" asChild className="hidden sm:inline-flex">
            <Link to={user ? "/profile" : "/auth"}>
              <UserRound className="h-4 w-4" />
              {profile?.full_name ?? (user ? "Account" : "Sign in")}
            </Link>
          </Button>
        </div>
      </div>
    </motion.header>
  );
}
