import { useState, useEffect } from "react";
import { useMenu, crearPedido } from "@/hooks/useSupabase";
import { checkConnection } from "@/lib/supabase";
import type { MenuItem } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import {
  ShoppingCart,
  UtensilsCrossed,
  Loader2,
  AlertCircle,
  Package,
  Wifi,
  WifiOff,
  Info,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const HERO_IMAGE =
  "https://mgx-backend-cdn.metadl.com/generate/images/1091546/2026-04-05/0fea0e25-7524-49dd-8127-e6e08203bf8d.png";

export default function Dashboard() {
  const { menu, loading, error } = useMenu();
  const { toast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string>("");
  const [cantidad, setCantidad] = useState<number | string>(1);
  const [nombreCliente, setNombreCliente] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [connStatus, setConnStatus] = useState<{
    connected: boolean;
    message: string;
  } | null>(null);
  const [showRlsHelp, setShowRlsHelp] = useState(false);

  useEffect(() => {
    checkConnection().then(setConnStatus);
  }, []);

  const selectedMenu = menu.find((m) => m.id.toString() === selectedItem);

  const handleSubmitPedido = async () => {
    if (!selectedMenu || !nombreCliente.trim()) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos.",
        variant: "destructive",
      });
      return;
    }

    const cantidadNum = typeof cantidad === 'string' ? parseInt(cantidad) || 1 : cantidad;
    if (cantidadNum < 1) {
      toast({
        title: "Error",
        description: "La cantidad debe ser al menos 1.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    const result = await crearPedido(
      selectedMenu.id,
      cantidadNum,
      nombreCliente,
      selectedMenu.precio
    );
    setSubmitting(false);

    if (result.success) {
      toast({
        title: "¡Éxito!",
        description: result.message,
      });
      setModalOpen(false);
      setSelectedItem("");
      setCantidad(1);
      setNombreCliente("");
    } else {
      toast({
        title: "Error",
        description: result.message,
        variant: "destructive",
      });
    }
  };

  const availableItems = menu.filter((m) => m.stock > 0);

  return (
    <div className="space-y-6">
      {/* Connection Status Banner - Only show when there's an error */}
      {connStatus && !connStatus.connected && (
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-red-50 text-[#C0392B] border border-red-200">
          <WifiOff className="h-4 w-4 flex-shrink-0" />
          <span>{connStatus.message}</span>
        </div>
      )}

      {/* Hero Card */}
      <Card className="overflow-hidden rounded-2xl shadow-lg border-0 relative">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${HERO_IMAGE})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#2E86C1]/90 to-[#2E86C1]/60" />
        <CardContent className="relative z-10 p-6 sm:p-8 md:p-10 flex flex-col items-start gap-4 min-h-[200px] justify-center">
          <div className="flex items-center gap-3">
            <UtensilsCrossed className="h-8 w-8 text-white" />
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              Cantina Somos Familia
            </h2>
          </div>
          <p className="text-white/90 text-base sm:text-lg max-w-md">
            La Gracia de Cristo - Grupo de Jóvenes
          </p>
          <Button
            onClick={() => setModalOpen(true)}
            disabled={availableItems.length === 0}
            className="mt-2 bg-[#E5BE01] hover:bg-[#E5BE01]/90 text-[#1a1a1a] font-bold text-lg px-8 py-6 rounded-2xl shadow-md transition-all hover:scale-105"
          >
            <ShoppingCart className="mr-2 h-5 w-5" />
            ¡Hacé tu pedido!
          </Button>
        </CardContent>
      </Card>

      {/* Tabla de Precios */}
      <Card className="rounded-2xl shadow-md border-0">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Package className="h-5 w-5 text-[#2E86C1]" />
            <h3 className="text-xl font-bold text-[#1a1a1a]">
              Menú del Día
            </h3>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-[#2E86C1]" />
              <span className="ml-2 text-gray-500">Cargando menú...</span>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 rounded-xl text-[#C0392B]">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <div>
                <p className="font-semibold">Error de conexión</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}

          {!loading && !error && (
            <div className="overflow-x-auto">
              {menu.length === 0 ? (
                <div className="py-8 text-center space-y-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                    <Package className="h-8 w-8 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-gray-500 font-medium">
                      El menú está vacío
                    </p>
                    <p className="text-gray-400 text-sm mt-1">
                      El administrador necesita agregar ítems al menú.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowRlsHelp(true)}
                    className="rounded-xl text-[#2E86C1] border-[#2E86C1]"
                  >
                    <Info className="h-4 w-4 mr-1" />
                    ¿Problemas para agregar datos?
                  </Button>
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">
                        Plato
                      </th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-600 text-sm">
                        Precio
                      </th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-600 text-sm">
                        Stock
                      </th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-600 text-sm">
                        Estado
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {menu.map((item: MenuItem) => (
                      <tr
                        key={item.id}
                        className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="py-3 px-4 font-medium text-[#1a1a1a]">
                          {item.nombre}
                        </td>
                        <td className="py-3 px-4 text-center font-semibold text-[#2E86C1]">
                          ${item.precio.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`font-bold ${
                              item.stock === 0
                                ? "text-[#C0392B]"
                                : item.stock < 5
                                ? "text-[#C0392B]"
                                : "text-green-600"
                            }`}
                          >
                            {item.stock}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {item.stock === 0 ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-[#C0392B]">
                              Agotado
                            </span>
                          ) : item.stock < 5 ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700">
                              Últimas unidades
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                              Disponible
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* RLS Help Dialog */}
      <Dialog open={showRlsHelp} onOpenChange={setShowRlsHelp}>
        <DialogContent className="rounded-2xl sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#2E86C1] flex items-center gap-2">
              <Info className="h-5 w-5" />
              Configuración de Base de Datos
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 text-sm">
            <p className="text-gray-600">
              Si no podés agregar datos desde la app, es porque las políticas de
              seguridad (RLS) de Supabase están bloqueando las escrituras.
              Ejecutá este SQL en el{" "}
              <strong>SQL Editor de tu proyecto Supabase</strong>:
            </p>
            <div className="bg-gray-900 text-green-400 p-4 rounded-xl overflow-x-auto text-xs font-mono whitespace-pre">
{`-- 1. Permitir lectura pública en todas las tablas
CREATE POLICY "allow_public_read_menu"
  ON menu FOR SELECT USING (true);

CREATE POLICY "allow_public_read_pedido"
  ON pedido FOR SELECT USING (true);

CREATE POLICY "allow_public_read_usuario"
  ON usuario FOR SELECT USING (true);

-- 2. Permitir escritura pública (para app sin auth)
CREATE POLICY "allow_public_insert_menu"
  ON menu FOR INSERT WITH CHECK (true);

CREATE POLICY "allow_public_update_menu"
  ON menu FOR UPDATE USING (true);

CREATE POLICY "allow_public_delete_menu"
  ON menu FOR DELETE USING (true);

CREATE POLICY "allow_public_insert_pedido"
  ON pedido FOR INSERT WITH CHECK (true);

CREATE POLICY "allow_public_update_pedido"
  ON pedido FOR UPDATE USING (true);

CREATE POLICY "allow_public_delete_pedido"
  ON pedido FOR DELETE USING (true);

-- 3. Datos iniciales de ejemplo
INSERT INTO menu (nombre, precio, stock) VALUES
  ('Empanadas x3', 2500, 20),
  ('Hamburguesa Completa', 4500, 15),
  ('Pizza Muzzarella', 5000, 10),
  ('Gaseosa 500ml', 1500, 30),
  ('Agua Mineral', 1000, 25);

-- 4. Usuario admin (usuario: admin, password: admin123)
INSERT INTO usuario (usuario, password, "rolId")
  VALUES ('admin', 'admin123', 1)
  ON CONFLICT DO NOTHING;`}
            </div>
            <p className="text-gray-500 text-xs">
              💡 Después de ejecutar el SQL, recargá esta página y verás los
              datos del menú.
            </p>
          </div>
          <DialogFooter>
            <Button
              onClick={() => setShowRlsHelp(false)}
              className="bg-[#2E86C1] hover:bg-[#2E86C1]/90 text-white rounded-xl"
            >
              Entendido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Pedido */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#2E86C1] flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Nuevo Pedido
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="nombre" className="font-semibold">
                Tu Nombre
              </Label>
              <Input
                id="nombre"
                placeholder="Escribí tu nombre..."
                value={nombreCliente}
                onChange={(e) => setNombreCliente(e.target.value)}
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="item" className="font-semibold">
                Elegí un plato
              </Label>
              <Select value={selectedItem} onValueChange={setSelectedItem}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Seleccioná un plato..." />
                </SelectTrigger>
                <SelectContent>
                  {availableItems.map((item) => (
                    <SelectItem key={item.id} value={item.id.toString()}>
                      {item.nombre} - ${item.precio.toLocaleString()} (Stock:{" "}
                      {item.stock})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cantidad" className="font-semibold">
                Cantidad
              </Label>
              <Input
                id="cantidad"
                type="text"
                inputMode="numeric"
                min={1}
                max={selectedMenu?.stock || 1}
                value={cantidad}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '') {
                    setCantidad('');
                  } else {
                    const num = parseInt(val);
                    if (!isNaN(num) && num >= 1) setCantidad(num);
                  }
                }}
                onBlur={() => {
                  if (cantidad === '' || cantidad < 1) setCantidad(1);
                }}
                className="rounded-xl"
              />
              {selectedMenu && (
                <p className="text-sm text-gray-500">
                  Máximo disponible: {selectedMenu.stock}
                </p>
              )}
            </div>

            {selectedMenu && (
              <div className="bg-[#F2F4F4] rounded-xl p-4">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-600">Total:</span>
                  <span className="text-2xl font-bold text-[#2E86C1]">
                    ${(selectedMenu.precio * cantidad).toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setModalOpen(false)}
              className="rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmitPedido}
              disabled={submitting || !selectedItem || !nombreCliente.trim()}
              className="bg-[#E5BE01] hover:bg-[#E5BE01]/90 text-[#1a1a1a] font-bold rounded-xl"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                "Confirmar Pedido"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}