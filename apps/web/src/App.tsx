import { Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Toaster } from "@/components/Toaster";
import { CommandPalette } from "@/components/CommandPalette";
import { LandingPage } from "@/pages/LandingPage";
import { ToolsPage } from "@/pages/ToolsPage";
import { ForgePage } from "@/pages/ForgePage";
import { BuildPage } from "@/pages/BuildPage";
import { DeployPage } from "@/pages/DeployPage";
import { ToolDetailPage } from "@/pages/ToolDetailPage";
import { StackPage } from "@/pages/StackPage";
import { RequestsPage } from "@/pages/RequestsPage";
import { DeploysPage } from "@/pages/DeploysPage";

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route element={<AppLayout />}>
          <Route path="/tools" element={<ToolsPage />} />
          <Route path="/tools/:id" element={<ToolDetailPage />} />
          <Route path="/forge" element={<ForgePage />} />
          <Route path="/build/:id" element={<BuildPage />} />
          <Route path="/deploy/:id" element={<DeployPage />} />
          <Route path="/stack" element={<StackPage />} />
          <Route path="/requests" element={<RequestsPage />} />
          <Route path="/deploys" element={<DeploysPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <CommandPalette />
      <Toaster />
    </>
  );
}
