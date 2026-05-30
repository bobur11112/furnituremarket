import { useMemo, useState } from "react";
import { BarChart3, DollarSign, Eye, EyeOff, Package, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/components/ui/toast";
import { useAuth } from "@/hooks/useAuth";
import { useDeleteProduct, useSellerProducts, useSellerStats, useToggleProductPublished, useUpdateProduct } from "@/hooks/useProducts";
import { formatPrice } from "@/lib/utils";
import type { Product } from "@/types/product";

function StatCard({ icon: Icon, label, value }: { icon: typeof Package; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold">{value}</p>
        </div>
        <Icon className="h-8 w-8 text-primary" aria-hidden="true" />
      </CardContent>
    </Card>
  );
}

export function SellerDashboard() {
  const { user } = useAuth();
  const productsQuery = useSellerProducts(user?.id);
  const statsQuery = useSellerStats(user?.id);
  const deleteMutation = useDeleteProduct();
  const toggleMutation = useToggleProductPublished();
  const updateMutation = useUpdateProduct();
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [draft, setDraft] = useState({ title: "", price: 0, stock_count: 0 });

  const products = productsQuery.data ?? [];
  const stats = statsQuery.data;

  const editDisabled = useMemo(() => updateMutation.isPending || !editingProduct, [editingProduct, updateMutation.isPending]);

  function openEditor(product: Product) {
    setEditingProduct(product);
    setDraft({ title: product.title, price: product.price, stock_count: product.stock_count });
  }

  async function saveEdit() {
    if (!editingProduct) return;
    await updateMutation.mutateAsync({ ...editingProduct, ...draft });
    toast({ title: "Product updated", description: draft.title });
    setEditingProduct(null);
  }

  async function handleDelete(product: Product) {
    await deleteMutation.mutateAsync(product.id);
    toast({ title: "Product deleted", description: product.title });
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard icon={Package} label="Total products" value={stats ? String(stats.totalProducts) : "..."} />
        <StatCard icon={BarChart3} label="Total orders" value={stats ? String(stats.totalOrders) : "..."} />
        <StatCard icon={DollarSign} label="Total revenue" value={stats ? formatPrice(stats.totalRevenue) : "..."} />
      </div>

      <Card>
        <CardContent className="p-0">
          {productsQuery.isLoading ? (
            <div className="grid gap-3 p-5">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : products.length === 0 ? (
            <div className="p-8 text-center">
              <Package className="mx-auto h-10 w-10 text-primary" aria-hidden="true" />
              <h2 className="mt-4 text-xl font-semibold">No products yet</h2>
              <p className="mt-2 text-sm text-muted-foreground">Add your first listing to begin selling.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <img src={product.images[0]} alt={product.title} className="h-12 w-12 rounded-md object-cover" />
                        <div>
                          <p className="font-medium">{product.title}</p>
                          <p className="text-xs text-muted-foreground">{product.category?.name ?? product.style}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{formatPrice(product.price)}</TableCell>
                    <TableCell>{product.stock_count}</TableCell>
                    <TableCell>
                      <Badge variant={product.is_published ? "default" : "muted"}>
                        {product.is_published ? "Published" : "Draft"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEditor(product)} aria-label={`Edit ${product.title}`}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleMutation.mutate(product)}
                          aria-label={`${product.is_published ? "Unpublish" : "Publish"} ${product.title}`}
                        >
                          {product.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => void handleDelete(product)} aria-label={`Delete ${product.title}`}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Sheet open={Boolean(editingProduct)} onOpenChange={(open) => (!open ? setEditingProduct(null) : undefined)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Edit product</SheetTitle>
            <SheetDescription>Adjust product basics and save optimistically.</SheetDescription>
          </SheetHeader>
          <div className="mt-6 grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input id="edit-title" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-price">Price</Label>
              <Input
                id="edit-price"
                type="number"
                min="1"
                value={draft.price}
                onChange={(event) => setDraft({ ...draft, price: Number(event.target.value) })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-stock">Stock</Label>
              <Input
                id="edit-stock"
                type="number"
                min="0"
                value={draft.stock_count}
                onChange={(event) => setDraft({ ...draft, stock_count: Number(event.target.value) })}
              />
            </div>
            <Button disabled={editDisabled} onClick={() => void saveEdit()}>
              Save changes
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
