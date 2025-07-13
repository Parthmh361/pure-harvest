import { Suspense } from "react";
import ProductsPage from "./ProductPage";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProductsPage />
    </Suspense>
  );
}