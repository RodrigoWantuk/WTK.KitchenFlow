import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { StoreProvider, useStore } from "@/lib/store";
import AppShell from "@/components/AppShell";
import Landing from "@/pages/Landing";
import Access from "@/pages/Access";
import Onboarding from "@/pages/Onboarding";
import Today from "@/pages/Today";
import Pantry from "@/pages/Pantry";
import ItemForm from "@/pages/ItemForm";
import ItemDetail from "@/pages/ItemDetail";
import Recipes from "@/pages/Recipes";
import RecipeDetail from "@/pages/RecipeDetail";
import CookFlow from "@/pages/CookFlow";
import Plan from "@/pages/Plan";
import Shopping from "@/pages/Shopping";
import Settings from "@/pages/Settings";

function Guard({ children }) {
  const { authed } = useStore();
  if (!authed) return <Navigate to="/acesso" replace />;
  return children;
}

function ShellRoute({ children }) {
  return (
    <Guard>
      <AppShell>{children}</AppShell>
    </Guard>
  );
}

function App() {
  return (
    <StoreProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/acesso" element={<Access />} />
          <Route path="/onboarding" element={<Onboarding />} />

          <Route path="/app/hoje" element={<ShellRoute><Today /></ShellRoute>} />
          <Route path="/app/despensa" element={<ShellRoute><Pantry /></ShellRoute>} />
          <Route path="/app/despensa/novo" element={<ShellRoute><ItemForm /></ShellRoute>} />
          <Route path="/app/despensa/:id" element={<ShellRoute><ItemDetail /></ShellRoute>} />
          <Route path="/app/receitas" element={<ShellRoute><Recipes /></ShellRoute>} />
          <Route path="/app/receitas/:id" element={<ShellRoute><RecipeDetail /></ShellRoute>} />
          <Route path="/app/cozinhar/:id" element={<ShellRoute><CookFlow /></ShellRoute>} />
          <Route path="/app/planejamento" element={<ShellRoute><Plan /></ShellRoute>} />
          <Route path="/app/compras" element={<ShellRoute><Shopping /></ShellRoute>} />
          <Route path="/app/ajustes" element={<ShellRoute><Settings /></ShellRoute>} />

          <Route path="/app" element={<Navigate to="/app/hoje" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </StoreProvider>
  );
}

export default App;
