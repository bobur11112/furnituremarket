import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import { useAuth } from "@/hooks/useAuth";
import { registerSchema, type RegisterValues } from "@/schemas/auth.schema";

export function RegisterForm() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: "buyer" },
  });

  async function onSubmit(values: RegisterValues) {
    try {
      await signUp(values.email, values.password, values.fullName, values.role);
      toast({ title: "Account created", description: "Your Möbel profile is ready." });
      navigate(values.role === "seller" ? "/seller/dashboard" : "/profile", { replace: true });
    } catch (error) {
      toast({
        title: "Registration failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="register-name">Full name</Label>
        <Input id="register-name" autoComplete="name" {...register("fullName")} />
        {errors.fullName ? <p className="text-sm text-destructive">{errors.fullName.message}</p> : null}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="register-email">Email</Label>
        <Input id="register-email" type="email" autoComplete="email" {...register("email")} />
        {errors.email ? <p className="text-sm text-destructive">{errors.email.message}</p> : null}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="register-password">Password</Label>
        <Input id="register-password" type="password" autoComplete="new-password" {...register("password")} />
        {errors.password ? <p className="text-sm text-destructive">{errors.password.message}</p> : null}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="register-role">Role</Label>
        <select
          id="register-role"
          className="h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          {...register("role")}
        >
          <option value="buyer">Buyer</option>
          <option value="seller">Seller</option>
        </select>
      </div>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Create account
      </Button>
    </form>
  );
}
