import { Suspense } from "react";
import Header from "./layout/Header";

export function PublicHeader() {
  return (
    <Suspense fallback={null}>
      <Header userName="Guest User" />
    </Suspense>
  );
}
