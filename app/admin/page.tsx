import { getAllProducts } from "@/lib/db";
import AdminDashboardClient from "@/components/admin/AdminDashboardClient";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const products = await getAllProducts();
  return <AdminDashboardClient products={products} />;
}
