import { Navigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoginForm } from "@/components/auth/LoginForm";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { useAuth } from "@/hooks/useAuth";

export function AuthPage() {
  const { user, profile } = useAuth();

  if (user) {
    return <Navigate to={profile?.role === "seller" ? "/seller/dashboard" : "/profile"} replace />;
  }

  return (
    <PageWrapper className="container grid min-h-[78vh] items-center py-10">
      <div className="grid overflow-hidden rounded-lg border border-border bg-card lg:grid-cols-[0.95fr_1.05fr]">
        <div className="relative hidden min-h-[38rem] lg:block">
          <img
            src="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1200&q=85"
            alt="Elegant furnished interior"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
          <div className="absolute bottom-8 left-8 max-w-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">Members</p>
            <h1 className="mt-2 font-display text-4xl font-bold">Buy better. Sell beautifully.</h1>
          </div>
        </div>
        <Card className="rounded-none border-0 bg-transparent shadow-none">
          <CardContent className="p-6 sm:p-10">
            <div className="mb-8">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">Account</p>
              <h1 className="mt-2 font-display text-4xl font-bold">Welcome to Möbel</h1>
              <p className="mt-3 text-muted-foreground">Use demo credentials or connect Supabase Auth for production.</p>
            </div>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              <TabsContent value="login" className="mt-6">
                <LoginForm />
              </TabsContent>
              <TabsContent value="register" className="mt-6">
                <RegisterForm />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
}
