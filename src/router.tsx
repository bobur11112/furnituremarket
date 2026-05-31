import { createBrowserRouter, Navigate } from "react-router-dom";
import { ErrorBoundary } from "react-error-boundary";
import type { ReactNode } from "react";
import { App } from "@/App";
import { PrivateRoute } from "@/components/auth/PrivateRoute";
import { PageErrorFallback } from "@/components/layout/PageErrorFallback";
import { AdminDashboardPage } from "@/pages/admin/AdminDashboardPage";
import { OrderDetailPage } from "@/pages/admin/OrderDetailPage";
import { AddProductPage } from "@/pages/seller/AddProductPage";
import { AuthPage } from "@/pages/AuthPage";
import { CartPage } from "@/pages/CartPage";
import { CatalogPage } from "@/pages/CatalogPage";
import { CheckoutPage } from "@/pages/CheckoutPage";
import { HomePage } from "@/pages/HomePage";
import { ProductDetailPage } from "@/pages/ProductDetailPage";
import { SellerDashboardPage } from "@/pages/seller/SellerDashboardPage";

const withBoundary = (element: ReactNode) => (
  <ErrorBoundary FallbackComponent={PageErrorFallback}>{element}</ErrorBoundary>
);

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: withBoundary(<HomePage />) },
      { path: "catalog", element: withBoundary(<CatalogPage />) },
      { path: "product/:id", element: withBoundary(<ProductDetailPage />) },
      { path: "cart", element: withBoundary(<CartPage />) },
      {
        path: "checkout",
        element: withBoundary(<CheckoutPage />),
      },
      { path: "auth", element: withBoundary(<AuthPage />) },
      {
        path: "admin",
        element: withBoundary(
          <PrivateRoute roles={["admin"]}>
            <AdminDashboardPage />
          </PrivateRoute>,
        ),
      },
      {
        path: "orders/:id",
        element: withBoundary(
          <PrivateRoute roles={["admin"]}>
            <OrderDetailPage />
          </PrivateRoute>,
        ),
      },
      {
        path: "seller/dashboard",
        element: withBoundary(
          <PrivateRoute roles={["admin"]}>
            <SellerDashboardPage />
          </PrivateRoute>,
        ),
      },
      {
        path: "seller/add-product",
        element: withBoundary(
          <PrivateRoute roles={["admin"]}>
            <AddProductPage />
          </PrivateRoute>,
        ),
      },
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
]);
