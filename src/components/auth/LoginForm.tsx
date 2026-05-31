import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import { useAuth } from "@/hooks/useAuth";
import { loginSchema, type LoginValues } from "@/schemas/auth.schema";
import { useLocale } from "@/contexts/LocaleContext";

type LocationState = {
  from?: string;
};

export function LoginForm() {
  const { signIn } = useAuth();
  const { locale } = useLocale();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as LocationState | null)?.from ?? "/admin";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginValues) {
    try {
      await signIn(values.email, values.password);
      toast({ title: locale === "ru" ? "Добро пожаловать" : "Xush kelibsiz", description: locale === "ru" ? "Вход выполнен." : "Tizimga kirildi." });
      navigate(from, { replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      toast({
        title: locale === "ru" ? "Не удалось войти" : "Tizimga kirib bo'lmadi",
        description: message.toLowerCase().includes("invalid login credentials")
          ? (locale === "ru" ? "Неверный email или пароль. Проверьте данные пользователя в Supabase Authentication." : "Email yoki parol noto'g'ri. Supabase Authentication ma'lumotlarini tekshiring.")
          : message || (locale === "ru" ? "Проверьте данные и попробуйте снова." : "Ma'lumotlarni tekshirib, qayta urinib ko'ring."),
        variant: "destructive",
      });
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="login-email">Email</Label>
        <Input id="login-email" type="email" autoComplete="email" {...register("email")} />
        {errors.email ? <p className="text-sm text-destructive">{errors.email.message}</p> : null}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="login-password">{locale === "ru" ? "Пароль" : "Parol"}</Label>
        <Input id="login-password" type="password" autoComplete="current-password" {...register("password")} />
        {errors.password ? <p className="text-sm text-destructive">{errors.password.message}</p> : null}
      </div>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {locale === "ru" ? "Войти" : "Kirish"}
      </Button>
    </form>
  );
}
