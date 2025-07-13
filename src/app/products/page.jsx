import { Suspense } from "react";
import ProductsPage from "./ProductsPage";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProductsPage />
    </Suspense>
  );
}