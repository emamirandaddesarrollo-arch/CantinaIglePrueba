import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toaster } from "@/components/ui/toaster";
import Dashboard from "@/components/Dashboard";
import PedidosRealizados from "@/components/PedidosRealizados";
import PedidosListos from "@/components/PedidosListos";
import AdminPanel from "@/components/AdminPanel";
import PedidosPagados from "@/components/PedidosPagados";
import StockPanel from "@/components/StockPanel";
import {
  Home,
  CookingPot,
  CheckCircle,
  Lock,
  Package,
  UtensilsCrossed,
  DollarSign,
} from "lucide-react";

const LOGO_IMAGE = "/logo.png";  // Reemplaza con el nombre de tu imagen en la carpeta public/

export default function Index() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");

  const handleLogin = () => {
    setIsAdmin(true);
    setActiveTab("admin"); // Switch to admin tab after login
  };

  const handleLogout = () => {
    setIsAdmin(false);
    setActiveTab("dashboard");
  };

  return (
    <div className="min-h-screen bg-[#F2F4F4]">
      {/* Header */}
      <header className="bg-[#2E86C1] shadow-lg sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <img
            src={LOGO_IMAGE}
            alt="Somos Familia"
            className="h-10 w-10 rounded-full object-cover bg-white shadow-md"
          />
          <div className="flex-1 min-w-0">
            <h1 className="text-white font-bold text-lg leading-tight truncate">
              Cantina Somos Familia
            </h1>
            <p className="text-white/70 text-xs hidden sm:block">
              La Gracia de Cristo - Grupo de Jóvenes
            </p>
          </div>
          {isAdmin && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-[#E5BE01] text-[#1a1a1a]">
              <Lock className="h-3 w-3" />
              Admin
            </span>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-4 sm:py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full bg-white rounded-2xl shadow-md p-1 mb-6 flex flex-wrap h-auto gap-1">
            <TabsTrigger
              value="dashboard"
              className="flex-1 min-w-[80px] rounded-xl data-[state=active]:bg-[#2E86C1] data-[state=active]:text-white data-[state=active]:shadow-md font-semibold text-sm py-2.5 transition-all"
            >
              <Home className="h-4 w-4 mr-1.5" />
              <span className="hidden sm:inline">Inicio</span>
            </TabsTrigger>
            <TabsTrigger
              value="pendientes"
              className="flex-1 min-w-[80px] rounded-xl data-[state=active]:bg-[#E5BE01] data-[state=active]:text-[#1a1a1a] data-[state=active]:shadow-md font-semibold text-sm py-2.5 transition-all"
            >
              <CookingPot className="h-4 w-4 mr-1.5" />
              <span className="hidden sm:inline">Pendientes</span>
            </TabsTrigger>
            <TabsTrigger
              value="listos"
              className="flex-1 min-w-[80px] rounded-xl data-[state=active]:bg-green-600 data-[state=active]:text-white data-[state=active]:shadow-md font-semibold text-sm py-2.5 transition-all"
            >
              <CheckCircle className="h-4 w-4 mr-1.5" />
              <span className="hidden sm:inline">Listos</span>
            </TabsTrigger>
            {!isAdmin ? (
              <TabsTrigger
                value="admin"
                className="flex-1 min-w-[80px] rounded-xl data-[state=active]:bg-[#2E86C1] data-[state=active]:text-white data-[state=active]:shadow-md font-semibold text-sm py-2.5 transition-all"
              >
                <Lock className="h-4 w-4 mr-1.5" />
                <span className="hidden sm:inline">Admin</span>
              </TabsTrigger>
            ) : (
              <>
                <TabsTrigger
                  value="admin"
                  className="flex-1 min-w-[80px] rounded-xl data-[state=active]:bg-[#2E86C1] data-[state=active]:text-white data-[state=active]:shadow-md font-semibold text-sm py-2.5 transition-all"
                >
                  <DollarSign className="h-4 w-4 mr-1.5" />
                  <span className="hidden sm:inline">Cobrados</span>
                </TabsTrigger>
                <TabsTrigger
                  value="stock"
                  className="flex-1 min-w-[80px] rounded-xl data-[state=active]:bg-[#2E86C1] data-[state=active]:text-white data-[state=active]:shadow-md font-semibold text-sm py-2.5 transition-all"
                >
                  <Package className="h-4 w-4 mr-1.5" />
                  <span className="hidden sm:inline">Stock</span>
                </TabsTrigger>
              </>
            )}
          </TabsList>

          <TabsContent value="dashboard" className="mt-0">
            <Dashboard />
          </TabsContent>

          <TabsContent value="pendientes" className="mt-0">
            <PedidosRealizados isAdmin={isAdmin} />
          </TabsContent>

          <TabsContent value="listos" className="mt-0">
            <PedidosListos isAdmin={isAdmin} />
          </TabsContent>

          <TabsContent value="admin" className="mt-0">
            {isAdmin ? (
              <PedidosPagados onLogout={handleLogout} />
            ) : (
              <AdminPanel
                isAdmin={isAdmin}
                onLogin={handleLogin}
              />
            )}
          </TabsContent>

          {isAdmin && (
            <TabsContent value="stock" className="mt-0">
              <StockPanel onLogout={handleLogout} />
            </TabsContent>
          )}
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="text-center py-4 text-xs text-gray-400">
        <div className="flex items-center justify-center gap-1">
          <UtensilsCrossed className="h-3 w-3" />
          <span>Cantina Somos Familia © 2026</span>
        </div>
      </footer>

      <Toaster />
    </div>
  );
}