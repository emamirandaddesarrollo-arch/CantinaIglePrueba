import { useState, useMemo } from "react";
import {
  usePedidos,
  cancelarPedido,
  marcarPedidoListo,
} from "@/hooks/useSupabase";
import type { PedidoConMenu } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Loader2,
  AlertCircle,
  Search,
  Trash2,
  CheckCircle,
  CookingPot,
  Clock,
  ArrowUpDown,
  ClipboardList,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Props {
  isAdmin: boolean;
}

type SortField = "fecha" | "menu" | "cliente";

export default function PedidosRealizados({ isAdmin }: Props) {
  const { pedidos, loading, error } = usePedidos(1, true);
  const { toast } = useToast();
  const [filtro, setFiltro] = useState("");
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [sortField, setSortField] = useState<SortField>("fecha");

  // Summary: count of pending orders grouped by menu item
  const resumenPorMenu = useMemo(() => {
    const map = new Map<string, { cantidad: number; total: number }>();
    pedidos.forEach((p) => {
      const key = p.menuNombre || "Desconocido";
      const existing = map.get(key) || { cantidad: 0, total: 0 };
      map.set(key, {
        cantidad: existing.cantidad + p.cantidad,
        total: existing.total + p.precio,
      });
    });
    return Array.from(map.entries()).sort((a, b) =>
      a[0].localeCompare(b[0])
    );
  }, [pedidos]);

  // Sort pedidos
  const pedidosOrdenados = useMemo(() => {
    const filtered = pedidos.filter((p) =>
      p.nombreCliente.toLowerCase().includes(filtro.toLowerCase())
    );
    return [...filtered].sort((a, b) => {
      switch (sortField) {
        case "fecha":
          return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
        case "menu":
          return (a.menuNombre || "").localeCompare(b.menuNombre || "");
        case "cliente":
          return a.nombreCliente.localeCompare(b.nombreCliente);
        default:
          return 0;
      }
    });
  }, [pedidos, filtro, sortField]);

  const handleCancelar = async (pedido: PedidoConMenu) => {
    setActionLoading(pedido.id);
    const result = await cancelarPedido(
      pedido.id,
      pedido.menuId,
      pedido.cantidad
    );
    setActionLoading(null);

    toast({
      title: result.success ? "Cancelado" : "Error",
      description: result.message,
      variant: result.success ? "default" : "destructive",
    });
  };

  const handleMarcarListo = async (pedidoId: number) => {
    setActionLoading(pedidoId);
    const result = await marcarPedidoListo(pedidoId);
    setActionLoading(null);

    toast({
      title: result.success ? "¡Listo!" : "Error",
      description: result.message,
      variant: result.success ? "default" : "destructive",
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <CookingPot className="h-6 w-6 text-[#2E86C1]" />
        <h2 className="text-xl font-bold text-[#1a1a1a]">
          Pedidos Pendientes
        </h2>
        <span className="ml-auto bg-[#E5BE01]/20 text-[#1a1a1a] font-bold px-3 py-1 rounded-full text-sm">
          {pedidos.length} pedido{pedidos.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Resumen por menú */}
      {pedidos.length > 0 && (
        <Card className="rounded-2xl shadow-md border-0 border-l-4 border-l-[#E5BE01]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <ClipboardList className="h-5 w-5 text-[#E5BE01]" />
              <h3 className="font-bold text-[#1a1a1a] text-sm">
                Resumen de Cocina - Pedidos Pendientes Hoy
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {resumenPorMenu.map(([nombre, { cantidad, total }]) => (
                <div
                  key={nombre}
                  className="flex items-center justify-between bg-[#E5BE01]/10 rounded-xl px-3 py-2"
                >
                  <span className="font-semibold text-sm text-[#1a1a1a] truncate">
                    {nombre}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="bg-[#E5BE01] text-[#1a1a1a] font-bold text-xs px-2 py-0.5 rounded-full">
                      ×{cantidad}
                    </span>
                    <span className="text-xs text-gray-500">
                      ${total.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtro y ordenamiento */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Filtrar por nombre del cliente..."
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className="pl-10 rounded-xl"
          />
        </div>
        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-4 w-4 text-gray-400 shrink-0" />
          <Select
            value={sortField}
            onValueChange={(v) => setSortField(v as SortField)}
          >
            <SelectTrigger className="rounded-xl w-[160px]">
              <SelectValue placeholder="Ordenar por..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fecha">Fecha</SelectItem>
              <SelectItem value="menu">Menú</SelectItem>
              <SelectItem value="cliente">Cliente</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-[#2E86C1]" />
          <span className="ml-2 text-gray-500">Cargando pedidos...</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 rounded-xl text-[#C0392B]">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      {!loading && !error && pedidosOrdenados.length === 0 && (
        <Card className="rounded-2xl shadow-md border-0">
          <CardContent className="p-8 text-center">
            <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-lg">
              No hay pedidos pendientes hoy.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {pedidosOrdenados.map((pedido) => (
          <Card
            key={pedido.id}
            className="rounded-2xl shadow-md border-0 hover:shadow-lg transition-shadow"
          >
            <CardContent className="p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-[#E5BE01]/20 text-[#1a1a1a]">
                      #{pedido.id}
                    </span>
                    <span className="font-bold text-[#1a1a1a] truncate">
                      {pedido.nombreCliente}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    <span className="font-medium text-[#2E86C1]">
                      {pedido.menuNombre}
                    </span>{" "}
                    × {pedido.cantidad} = ${pedido.precio.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(pedido.fecha).toLocaleString("es-AR")}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isAdmin && (
                    <Button
                      size="sm"
                      onClick={() => handleMarcarListo(pedido.id)}
                      disabled={actionLoading === pedido.id}
                      className="bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold"
                    >
                      {actionLoading === pedido.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Listo
                        </>
                      )}
                    </Button>
                  )}

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-[#C0392B] text-[#C0392B] hover:bg-[#C0392B] hover:text-white rounded-xl font-semibold"
                        disabled={actionLoading === pedido.id}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Cancelar
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-2xl">
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          ¿Cancelar este pedido?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Se eliminará el pedido de{" "}
                          <strong>{pedido.nombreCliente}</strong> (
                          {pedido.menuNombre} × {pedido.cantidad}) y se
                          restaurará el stock automáticamente.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl">
                          No, mantener
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleCancelar(pedido)}
                          className="bg-[#C0392B] hover:bg-[#C0392B]/90 text-white rounded-xl"
                        >
                          Sí, cancelar pedido
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}