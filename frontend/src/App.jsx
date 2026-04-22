import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuth } from "./hooks/useAuth";
import Layout from "./components/layout/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Membres from "./pages/membres/Membres";
import Transactions from "./pages/transactions/Transactions";
import Evenements from "./pages/evenements/Evenements";
import Inventaire from "./pages/inventaire/Inventaire";
import Logs from "./pages/logs/Logs";
import { AuthProvider } from "./contexts/AuthProvider";
import { TooltipProvider } from "@/components/ui/tooltip";

const queryClient = new QueryClient();

function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="membres" element={<Membres />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="evenements" element={<Evenements />} />
        <Route path="inventaire" element={<Inventaire />} />
        <Route path="logs" element={<Logs />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
