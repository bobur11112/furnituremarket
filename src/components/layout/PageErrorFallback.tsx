import type { FallbackProps } from "react-error-boundary";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function PageErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <main className="container flex min-h-[70vh] items-center justify-center py-16">
      <Card className="max-w-lg border-destructive/50">
        <CardContent className="grid gap-4 p-6 text-center">
          <AlertTriangle className="mx-auto h-10 w-10 text-destructive" aria-hidden="true" />
          <div>
            <h1 className="text-2xl font-semibold">Something fell out of place.</h1>
            <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
          </div>
          <Button onClick={resetErrorBoundary}>Try again</Button>
        </CardContent>
      </Card>
    </main>
  );
}
