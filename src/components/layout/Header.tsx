import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Instagram, Menu, Search, ShoppingBag } from "lucide-react";
import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useCart } from "@/hooks/useCart";
import { useLocale } from "@/contexts/LocaleContext";
import { cn } from "@/lib/utils";

const instagramUrl = "https://www.instagram.com/bigart_uz";

function CatalogLink({ label, onClick }: { label: string; onClick?: () => void }) {
  return <NavLink to="/catalog" onClick={onClick} className={({ isActive }) => cn("text-sm font-medium text-muted-foreground transition-colors hover:text-foreground", isActive && "text-primary")}>{label}</NavLink>;
}

function SectionLink({ href, label, onClick }: { href: string; label: string; onClick?: () => void }) {
  return <a href={href} onClick={onClick} className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">{label}</a>;
}

export function Header() {
  const { totalQuantity, openCart } = useCart();
  const { locale, setLocale, t } = useLocale();
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  useMotionValueEvent(scrollY, "change", (latest) => setScrolled(latest > 24));
  const closeMobile = () => setMobileOpen(false);

  return (
    <motion.header initial={{ y: -18, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className={cn("sticky top-0 z-40 border-b border-white/10 bg-[#0e0d0b]/92 backdrop-blur-xl transition-shadow print:hidden", scrolled && "shadow-card")}>
      <div className="container flex h-[4.5rem] items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild><Button variant="ghost" size="icon" className="md:hidden" aria-label={t("openNavigation")}><Menu className="h-5 w-5" /></Button></SheetTrigger>
            <SheetContent side="left" className="w-80 bg-[#12110f]">
              <SheetHeader><SheetTitle className="text-2xl font-bold tracking-[0.22em]">BIGART</SheetTitle><SheetDescription>{t("mobileDescription")}</SheetDescription></SheetHeader>
              <nav className="mt-8 grid gap-5">
                <CatalogLink label={t("catalog")} onClick={closeMobile} />
                <SectionLink href="/#about" label={t("about")} onClick={closeMobile} />
                <SectionLink href="/#delivery" label={t("deliveryNav")} onClick={closeMobile} />
                <SectionLink href="/#contacts" label={t("contacts")} onClick={closeMobile} />
              </nav>
            </SheetContent>
          </Sheet>
          <Link to="/" className="text-2xl font-bold tracking-[0.22em] text-white sm:text-[1.65rem]" aria-label="BIGART">BIGART</Link>
        </div>
        <nav className="hidden items-center gap-7 md:flex" aria-label="Primary navigation">
          <CatalogLink label={t("catalog")} />
          <SectionLink href="/#about" label={t("about")} />
          <SectionLink href="/#delivery" label={t("deliveryNav")} />
          <SectionLink href="/#contacts" label={t("contacts")} />
        </nav>
        <div className="flex items-center gap-1">
          <div className="mr-1 flex items-center rounded-md border border-white/10 bg-white/[0.03] p-0.5">
            {(["ru", "uz"] as const).map((item) => <button key={item} type="button" onClick={() => setLocale(item)} className={cn("rounded px-2 py-1 text-[11px] font-semibold uppercase transition-colors", locale === item ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-white")}>{item}</button>)}
          </div>
          <Button variant="ghost" size="icon" asChild aria-label={t("searchCatalog")} className="hidden sm:inline-flex"><Link to="/catalog"><Search className="h-[1.15rem] w-[1.15rem]" /></Link></Button>
          <Button variant="ghost" size="icon" onClick={openCart} className="relative" aria-label={t("openCart")}><ShoppingBag className="h-[1.15rem] w-[1.15rem]" />{totalQuantity > 0 ? <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-xs font-bold text-primary-foreground">{totalQuantity}</span> : null}</Button>
          <Button variant="ghost" size="icon" asChild aria-label="Instagram"><a href={instagramUrl} target="_blank" rel="noreferrer"><Instagram className="h-[1.15rem] w-[1.15rem]" /></a></Button>
        </div>
      </div>
    </motion.header>
  );
}
