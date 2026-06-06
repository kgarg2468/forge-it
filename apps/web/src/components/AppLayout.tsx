import { Outlet } from "react-router-dom";
import { NavBar } from "@/components/NavBar";

export function AppLayout() {
  return (
    <div className="min-h-screen">
      <NavBar />
      <main className="mx-auto max-w-7xl px-5 pb-24 pt-8 sm:px-8">
        <Outlet />
      </main>
    </div>
  );
}
