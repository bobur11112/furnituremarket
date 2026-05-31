import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Instagram, Menu, Search, ShoppingBag } from "lucide-react";
import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useCart } from "@/hooks/useCart";
import { useLocale } from "@/contexts/LocaleContext";
import { cn } from "@/lib/utils";

function NavItem({ href, label, onClick }: { href: string; label: string; onClick?: () => void }) {
  return (
    <NavLink to={href} onClick={onClick} className={({ isActive }) => cn("text-sm font-medium text-muted-foreground transition-colors hover:text-primary", isActive && "text-primary")}>
      {label}
    </NavLink>
  );
}

export function Header() {
  const { totalQuantity, openCart } = useCart();
  const { locale, setLocale, t } = useLocale();
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  useMotionValueEvent(scrollY, "change", (latest) => setScrolled(latest > 24));
  const navItems = [{ label: t("catalog"), href: "/catalog" }];

  return (
    <motion.header initial={{ y: -18, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className={cn("sticky top-0 z-40 border-b border-border bg-background/92 backdrop-blur transition-shadow", scrolled && "shadow-card")}>
      <div className="container flex h-16 items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild><Button variant="ghost" size="icon" className="md:hidden" aria-label={t("openNavigation")}><Menu className="h-5 w-5" /></Button></SheetTrigger>
            <SheetContent side="left" className="w-80">
              <SheetHeader>
                <SheetTitle className="text-2xl font-bold tracking-[0.18em]">BIGART</SheetTitle>
                <SheetDescription>{t("mobileDescription")}</SheetDescription>
              </SheetHeader>
              <nav className="mt-8 grid gap-5">
                {navItems.map((item) => <NavItem key={item.href} {...item} onClick={() => setMobileOpen(false)} />)}
                <a href="https://www.instagram.com/bigart_uz" target="_blank" rel="noreferrer" className="text-sm font-medium text-muted-foreground hover:text-primary">{t("instagram")}</a>
              </nav>
            </SheetContent>
          </Sheet>
          <Link to="/" className="text-xl font-bold tracking-[0.2em] text-foreground sm:text-2xl" aria-label="BIGART">BIGART</Link>
        </div>
        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary navigation">
          {navItems.map((item) => <NavItem key={item.href} {...item} />)}
          <a href="https://www.instagram.com/bigart_uz" target="_blank" rel="noreferrer" className="text-sm font-medium text-muted-foreground hover:text-primary">{t("instagram")}</a>
        </nav>
        <div className="flex items-center gap-1">
          <div className="flex items-center rounded-md border border-border p-0.5">
            {(["ru", "uz"] as const).map((item) => <button key={item} type="button" onClick={() => setLocale(item)} className={cn("px-2 py-1 text-[11px] font-semibold uppercase transition-colors", locale === item ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>{item}</button>)}
          </div>
          <Button variant="ghost" size="icon" asChild aria-label={t("searchCatalog")}><Link to="/catalog"><Search className="h-5 w-5" /></Link></Button>
          <Button variant="ghost" size="icon" onClick={openCart} className="relative" aria-label={t("openCart")}>
            <ShoppingBag className="h-5 w-5" />
            {totalQuantity > 0 ? <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-xs font-bold text-primary-foreground">{totalQuantity}</span> : null}
          </Button>
          <Button variant="ghost" size="icon" asChild className="hidden sm:inline-flex" aria-label="Instagram"><a href="https://www.instagram.com/bigart_uz" target="_blank" rel="noreferrer"><Instagram className="h-5 w-5" /></a></Button>
        </div>
      </div>
    </motion.header>
  );
}
