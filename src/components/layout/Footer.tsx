import { Instagram } from "lucide-react";
import { Link } from "react-router-dom";
import { useLocale } from "@/contexts/LocaleContext";

export function Footer() {
  const { t } = useLocale();
  return (
    <footer className="border-t border-border bg-background">
      <div className="container grid gap-8 py-10 md:grid-cols-[1.3fr_1fr_1fr]">
        <div>
          <Link to="/" className="text-2xl font-bold tracking-[0.2em]">BIGART</Link>
          <p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">{t("footerBody")}</p>
        </div>
        <div className="grid gap-2 text-sm">
          <p className="font-semibold text-foreground">{t("footerNav")}</p>
          <Link className="text-muted-foreground hover:text-primary" to="/catalog">{t("catalog")}</Link>
        </div>
        <div className="grid content-start gap-2 text-sm">
          <p className="font-semibold text-foreground">{t("footerContact")}</p>
          <a className="flex items-center gap-2 text-muted-foreground hover:text-primary" href="https://www.instagram.com/bigart_uz" target="_blank" rel="noreferrer"><Instagram className="h-4 w-4" />@bigart_uz</a>
        </div>
      </div>
    </footer>
  );
}
