import { Routes, Route } from "react-router-dom";
import { Home as HomeIcon } from "lucide-react";
import { Layout } from "./components";
import type { NavItem } from "./components";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";

// Generic starter nav. ForgeIt's coding agent adds pages + nav items per tool.
const nav: NavItem[] = [
  { label: "Home", to: "/", icon: <HomeIcon className="h-4 w-4" />, end: true },
];

export default function App() {
  return (
    <Layout nav={nav}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
}
