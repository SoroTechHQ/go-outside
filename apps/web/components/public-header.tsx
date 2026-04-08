import { Suspense } from "react";
import BottomNav from "./layout/BottomNav";
import Header from "./layout/Header";

export function PublicHeader() {
  return (
    <>
      <Suspense fallback={null}>
        <Header userName="Guest User" />
      </Suspense>
      <BottomNav />
    </>
  );
}
