import { useState, useMemo, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { formatFechaAjustada } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  AlertCircle,
  CheckCircle,
  LogOut,
  TrendingUp,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { PedidoConDetalles } from "@/lib/types";

interface Props {
  isAdmin?: boolean;
  onLogout?: () => void;
}

interface DetallePedidoConMenu {
  id: number;
  pedidoId: number;
  menuId: number;
  cantidad: number;
  precio: number;
  cobrado?: boolean;
  entregado?: boolean;
  menuNombre?: string;
  nombreCliente?: string;
  fecha?: string;
}

export default function PedidosPagados({ isAdmin, onLogout }: Props) {
  const { toast } = useToast();
  const [detallesCobrados, setDetallesCobrados] = useState<
    Map<number, DetallePedidoConMenu[]>
  >(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const refetch = async () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  useEffect(() => {
    const fetchDetallesCobrados = async () => {
      try {
        setLoading(true);

        // Obtener todos los detalles con cobrados=true
        const { data: detalles, error: detallesErr } = await supabase
          .from("detallePedido")
          .select("*")
          .eq("cobrado", true);

        if (detallesErr) throw detallesErr;

        if (!detalles || detalles.length === 0) {
          setDetallesCobrados(new Map());
          setError(null);
          return;
        }

        // Obtener los pedidos
        const pedidoIds = [...new Set(detalles.map((d: any) => d.pedidoId))];
        const { data: pedidosData, error: pedidosErr } = await supabase
          .from("pedido")
          .select("*")
          .in("id", pedidoIds);

        if (pedidosErr) throw pedidosErr;

        const pedidoMap = new Map(
          (pedidosData || []).map((p: any) => [
            p.id,
            { nombreCliente: p.nombreCliente, fecha: p.fecha },
          ])
        );

        // Obtener los menús
        const menuIds = [...new Set(detalles.map((d: any) => d.menuId))];
        const { data: menusData, error: menusErr } = await supabase
          .from("menu")
          .select("*")
          .in("id", menuIds);

        if (menusErr) throw menusErr;

        const menuMap = new Map(
          (menusData || []).map((m: any) => [m.id, m.nombre])
        );

        // Agrupar detalles por pedidoId
        const agrupados = new Map<number, DetallePedidoConMenu[]>();
        detalles.forEach((d: any) => {
          const detalle: DetallePedidoConMenu = {
            ...d,
            menuNombre: menuMap.get(d.menuId) || "Desconocido",
            nombreCliente: pedidoMap.get(d.pedidoId)?.nombreCliente || "Desconocido",
            fecha: pedidoMap.get(d.pedidoId)?.fecha || new Date().toISOString(),
          };

          if (!agrupados.has(d.pedidoId)) {
            agrupados.set(d.pedidoId, []);
          }
          agrupados.get(d.pedidoId)!.push(detalle);
        });

        setDetallesCobrados(agrupados);
        setError(null);
      } catch (e: unknown) {
        const msg =
          e instanceof Error ? e.message : "Error al cargar detalles cobrados";
        setError(msg);
        console.error("Error:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchDetallesCobrados();

    // Escuchar cambios en detallePedido
    const channel = supabase
      .channel("detalles-cobrados")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "detallePedido" },
        () => {
          fetchDetallesCobrados();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refreshTrigger]);

  const handleLogout = () => {
    toast({
      title: "Sesión cerrada",
      description: "Has cerrado sesión correctamente.",
    });
    if (onLogout) onLogout();
  };

  // Calcular total de últimas 24 horas
  const totalUltimas24hs = useMemo(() => {
    const now = new Date();
    const hace24hs = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    let total = 0;

    detallesCobrados.forEach((detalles) => {
      detalles.forEach((d) => {
        const fecha = new Date(d.fecha || new Date());
        if (fecha >= hace24hs) {
          const precio = typeof d.precio === "number" ? d.precio : parseFloat(d.precio as any) || 0;
          const cantidad = typeof d.cantidad === "number" ? d.cantidad : parseInt(d.cantidad as any) || 0;
          total += precio * cantidad;
        }
      });
    });

    return total;
  }, [detallesCobrados]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 p-4 bg-red-50 rounded-2xl border border-red-200">
        <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
        <p className="text-sm text-red-800">{error}</p>
      </div>
    );
  }

  if (!detallesCobrados || detallesCobrados.size === 0) {
    return (
      <div className="text-center py-12">
        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4 opacity-50" />
        <p className="text-gray-500">No hay items pagados aún</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-[#1a1a1a]">Pedidos Cobrados</h2>
        {isAdmin && (
          <Button
            onClick={handleLogout}
            variant="outline"
            className="rounded-xl"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Cerrar Sesión
          </Button>
        )}
      </div>

      {/* Tarjeta de resumen de últimas 24hs */}
      <Card className="rounded-2xl shadow-md border-0 bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-l-green-600">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="bg-green-600 rounded-full p-3">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">
                Cobrado en las últimas 24hs
              </p>
              <p className="text-3xl font-bold text-green-700">
                ${totalUltimas24hs.toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Información de límite */}
      {detallesCobrados.size > 0 && (
        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-2xl border border-blue-200 text-sm text-blue-800">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>
            Mostrando {Array.from(detallesCobrados.values()).flat().length} items pagados
          </span>
        </div>
      )}

      {/* Items Cobrados */}
      <div className="space-y-3">
        {Array.from(detallesCobrados.entries()).map(
          ([pedidoId, detalles]) => (
            <Card
              key={pedidoId}
              className="rounded-2xl shadow-md border-0 hover:shadow-lg transition-shadow overflow-hidden"
            >
              <CardContent className="p-0">
                <div className="bg-green-50 p-3 sm:p-4 border-b">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-green-200 text-green-900">
                          #{pedidoId}
                        </span>
                        <span className="font-bold text-green-900">
                          {detalles[0]?.nombreCliente || "Desconocido"}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">
                        {detalles[0]?.fecha
                          ? formatFechaAjustada(detalles[0].fecha)
                          : "Fecha desconocida"}{" "}
                        • Total:{" "}
                        <span className="font-semibold text-green-700">
                          $
                          {detalles
                            .reduce((sum, d) => {
                              const precio = typeof d.precio === "number" ? d.precio : parseFloat(d.precio as any) || 0;
                              const cantidad = typeof d.cantidad === "number" ? d.cantidad : parseInt(d.cantidad as any) || 0;
                              return sum + precio * cantidad;
                            }, 0)
                            .toLocaleString()}
                        </span>
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-green-200 text-green-900 shrink-0">
                      <CheckCircle className="h-4 w-4" />
                      Pagado
                    </span>
                  </div>
                </div>

                {/* Detalles del pedido */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b">
                        <th className="text-left py-2 px-3 font-semibold text-gray-600 text-xs">
                          Menú
                        </th>
                        <th className="text-center py-2 px-3 font-semibold text-gray-600 text-xs">
                          Cant.
                        </th>
                        <th className="text-center py-2 px-3 font-semibold text-gray-600 text-xs">
                          P.U.
                        </th>
                        <th className="text-center py-2 px-3 font-semibold text-gray-600 text-xs">
                          Subtotal
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {detalles.map((detalle, idx) => {
                        const precio = typeof detalle.precio === "number" ? detalle.precio : parseFloat(detalle.precio as any) || 0;
                        const cantidad = typeof detalle.cantidad === "number" ? detalle.cantidad : parseInt(detalle.cantidad as any) || 0;
                        return (
                          <tr
                            key={idx}
                            className="border-b last:border-b-0 hover:bg-gray-50/50"
                          >
                            <td className="py-2 px-3 font-medium text-[#1a1a1a] text-sm">
                              {detalle.menuNombre || "Desconocido"}
                            </td>
                            <td className="py-2 px-3 text-center font-semibold text-green-700 text-sm">
                              {cantidad}
                            </td>
                            <td className="py-2 px-3 text-center text-gray-600 text-sm">
                              ${precio.toLocaleString()}
                            </td>
                            <td className="py-2 px-3 text-center font-semibold text-[#1a1a1a] text-sm">
                              ${(precio * cantidad).toLocaleString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )
        )}
      </div>
    </div>
  );
}
