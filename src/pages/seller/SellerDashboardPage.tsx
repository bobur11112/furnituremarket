import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { SellerDashboard } from "@/components/seller/SellerDashboard";

export function SellerDashboardPage() {
  return (
    <PageWrapper className="container py-10">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">Seller studio</p>
          <h1 className="mt-2 font-display text-4xl font-bold md:text-5xl">Dashboard</h1>
        </div>
        <Button asChild>
          <Link to="/seller/add-product">
            <Plus className="h-4 w-4" />
            Add product
          </Link>
        </Button>
      </div>
      <SellerDashboard />
    </PageWrapper>
  );
}
