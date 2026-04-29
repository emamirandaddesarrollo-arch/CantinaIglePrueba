import { useState, useMemo } from "react";
import {
  usePedidos,
  cancelarPedido,
  marcarPedidoPagado,
  actualizarDetallePagado,
  actualizarDetalleEntregado,
} from "@/hooks/useSupabase";
import { formatFechaAjustada } from "@/lib/utils";
import type { PedidoConDetalles, DetallePedido } from "@/lib/types";
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
  DollarSign,
  Truck,
  Copy,
  Check,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Props {
  isAdmin: boolean;
}

type SortField = "fecha" | "menu" | "cliente";

const ALIAS = "jovenessomosfamilia";

export default function PedidosRealizados({ isAdmin }: Props) {
  const { pedidos, loading, error, refetch } = usePedidos(1, true);
  const { toast } = useToast();
  const [filtro, setFiltro] = useState("");
  const [filtroComida, setFiltroComida] = useState("");
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [sortField, setSortField] = useState<SortField>("fecha");
  const [updatingDetalle, setUpdatingDetalle] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  // Summary: count of items grouped by menu (sin contar entregados)
  const resumenPorMenu = useMemo(() => {
    const map = new Map<string, { cantidad: number; total: number }>();
    pedidos.forEach((p) => {
      p.detalles?.forEach((d) => {
        // No contar items entregados
        if (d.entregado) return;
        
        const key = d.menuNombre || "Desconocido";
        const precio = typeof d.precio === 'number' ? d.precio : parseFloat(d.precio as any) || 0;
        const cantidad = typeof d.cantidad === 'number' ? d.cantidad : parseInt(d.cantidad as any) || 0;
        const existing = map.get(key) || { cantidad: 0, total: 0 };
        map.set(key, {
          cantidad: existing.cantidad + cantidad,
          total: existing.total + (precio * cantidad),
        });
      });
    });
    return Array.from(map.entries()).sort((a, b) =>
      a[0].localeCompare(b[0])
    );
  }, [pedidos]);

  // Sort pedidos based on filters and sort field
  const pedidosOrdenados = useMemo(() => {
    const filtered = pedidos.filter((p) => {
      const matchCliente = p.nombreCliente.toLowerCase().includes(filtro.toLowerCase());
      const matchComida = filtroComida === "" || 
        p.detalles?.some((d) => 
          d.menuNombre?.toLowerCase().includes(filtroComida.toLowerCase())
        );
      return matchCliente && matchComida;
    });
    return [...filtered].sort((a, b) => {
      switch (sortField) {
        case "fecha":
          return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
        case "menu":
          const menuA = a.detalles?.[0]?.menuNombre || "";
          const menuB = b.detalles?.[0]?.menuNombre || "";
          return menuA.localeCompare(menuB);
        case "cliente":
          return a.nombreCliente.localeCompare(b.nombreCliente);
        default:
          return 0;
      }
    });
  }, [pedidos, filtro, filtroComida, sortField]);

  const handleCancelar = async (pedidoId: number) => {
    setActionLoading(pedidoId);
    const result = await cancelarPedido(pedidoId);
    setActionLoading(null);

    toast({
      title: result.success ? "Cancelado" : "Error",
      description: result.message,
      variant: result.success ? "default" : "destructive",
    });

    if (result.success) {
      await refetch();
    }
  };

  const handleMarcarListo = async (pedidoId: number) => {
    setActionLoading(pedidoId);
    const result = await marcarPedidoPagado(pedidoId);
    setActionLoading(null);

    toast({
      title: result.success ? "¡Cobrado!" : "Error",
      description: result.message,
      variant: result.success ? "default" : "destructive",
    });

    if (result.success) {
      await refetch();
    }
  };

  const handleCopyAlias = async () => {
    try {
      await navigator.clipboard.writeText(ALIAS);
      setCopied(true);
      toast({ title: "¡Copiado!", description: "Alias copiado al portapapeles." });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "Error",
        description: "No se pudo copiar. Copiá manualmente: " + ALIAS,
        variant: "destructive",
      });
    }
  };

  const handleTogglePagado = async (detalleId: number, currentState: boolean) => {
    setUpdatingDetalle(detalleId);
    const result = await actualizarDetallePagado(detalleId, !currentState);
    setUpdatingDetalle(null);

    if (!result.success) {
      toast({
        title: "Error",
        description: result.message,
        variant: "destructive",
      });
    } else {
      await refetch();
    }
  };

  const handleToggleEntregado = async (detalleId: number, currentState: boolean) => {
    setUpdatingDetalle(detalleId);
    const result = await actualizarDetalleEntregado(detalleId, !currentState);
    setUpdatingDetalle(null);

    if (!result.success) {
      toast({
        title: "Error",
        description: result.message,
        variant: "destructive",
      });
    } else {
      await refetch();
    }
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
        <>
          {/* Banner de pago con alias */}
          <Card className="rounded-2xl shadow-md border-0 border-l-4 border-l-[#E5BE01] bg-[#E5BE01]/5">
            <CardContent className="p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1">
                  <p className="font-bold text-[#1a1a1a] text-base mb-1">
                    💰 ¡Ya podés pagar tu pedido!
                  </p>
                  <p className="text-[#1a1a1a]/70 text-sm">
                    Podés pagar por transferencia al siguiente alias:
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <code className="bg-white text-[#1a1a1a] font-bold text-lg px-4 py-2 rounded-xl border border-[#E5BE01] select-all">
                      {ALIAS}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCopyAlias}
                      className="rounded-xl border-[#E5BE01] text-[#E5BE01] hover:bg-[#E5BE01]/10 shrink-0"
                    >
                      {copied ? (
                        <>
                          <Check className="h-4 w-4 mr-1" />
                          Copiado
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-1" />
                          Copiar
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resumen de cocina */}
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
                        ${typeof total === 'number' && !isNaN(total) ? total.toLocaleString() : '0'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
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
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Filtrar por comida..."
            value={filtroComida}
            onChange={(e) => setFiltroComida(e.target.value)}
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
            className="rounded-2xl shadow-md border-0 hover:shadow-lg transition-shadow overflow-hidden"
          >
            <CardContent className="p-0">
              <div className="bg-[#E5BE01]/5 p-3 sm:p-4 border-b">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-[#E5BE01]/20 text-[#1a1a1a]">
                        #{pedido.id}
                      </span>
                      <span className="font-bold text-[#1a1a1a]">
                        {pedido.nombreCliente}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {formatFechaAjustada(pedido.fecha)} • Total: <span className="font-semibold text-[#2E86C1]">${pedido.precioTotal.toLocaleString()}</span>
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
                            <DollarSign className="h-4 w-4 mr-1" />
                            Cobrar
                          </>
                        )}
                      </Button>
                    )}
                    {isAdmin && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-[#C0392B] text-[#C0392B] hover:bg-[#C0392B] hover:text-white rounded-xl font-semibold"
                          disabled={actionLoading === pedido.id || !isAdmin}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Cancelar
                        </Button>
                      </AlertDialogTrigger>
                      {isAdmin && (
                        <AlertDialogContent className="rounded-2xl">
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              ¿Cancelar este pedido?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Se eliminará el pedido de{" "}
                              <strong>{pedido.nombreCliente}</strong> y todos sus detalles. El stock se restaurará automáticamente.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="rounded-xl">
                              No, mantener
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleCancelar(pedido.id)}
                              className="bg-[#C0392B] hover:bg-[#C0392B]/90 text-white rounded-xl"
                            >
                              Sí, cancelar pedido
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      )}
                    </AlertDialog>
                    )}
                  </div>
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
                      {isAdmin && (
                        <>
                          <th className="text-center py-2 px-3 font-semibold text-gray-600 text-xs">
                            Cobrado
                          </th>
                          <th className="text-center py-2 px-3 font-semibold text-gray-600 text-xs">
                            Entregado
                          </th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {pedido.detalles && pedido.detalles.length > 0 ? (
                      pedido.detalles.map((detalle: DetallePedido, idx: number) => {
                        const precio = typeof detalle.precio === 'number' ? detalle.precio : parseFloat(detalle.precio as any) || 0;
                        return (
                          <tr
                            key={idx}
                            className="border-b last:border-b-0 hover:bg-gray-50/50"
                          >
                            <td className="py-2 px-3 font-medium text-[#1a1a1a] text-sm">
                              {detalle.menuNombre || "Desconocido"}
                            </td>
                            <td className="py-2 px-3 text-center font-semibold text-[#2E86C1] text-sm">
                              {detalle.cantidad || 0}
                            </td>
                            <td className="py-2 px-3 text-center text-gray-600 text-sm">
                              ${precio.toLocaleString()}
                            </td>
                            <td className="py-2 px-3 text-center font-semibold text-[#1a1a1a] text-sm">
                              ${(precio * (detalle.cantidad || 0)).toLocaleString()}
                            </td>
                            {isAdmin && (
                              <>
                                <td className="py-2 px-3 text-center">
                                  <Button
                                    size="sm"
                                    onClick={() =>
                                      handleTogglePagado(detalle.id, detalle.cobrado || false)
                                    }
                                    disabled={updatingDetalle === detalle.id}
                                    className={`rounded-lg font-semibold text-white transition-colors ${
                                      detalle.cobrado
                                        ? "bg-green-600 hover:bg-green-700"
                                        : "bg-gray-400 hover:bg-gray-500"
                                    }`}
                                  >
                                    {updatingDetalle === detalle.id ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : detalle.cobrado ? (
                                      <>
                                        <DollarSign className="h-3 w-3 mr-1" />
                                        Pagado
                                      </>
                                    ) : (
                                      <>
                                        <DollarSign className="h-3 w-3 mr-1" />
                                        Pagar
                                      </>
                                    )}
                                  </Button>
                                </td>
                                <td className="py-2 px-3 text-center">
                                  <Button
                                    size="sm"
                                    onClick={() =>
                                      handleToggleEntregado(
                                        detalle.id,
                                        detalle.entregado || false
                                      )
                                    }
                                    disabled={updatingDetalle === detalle.id}
                                    className={`rounded-lg font-semibold text-white transition-colors ${
                                      detalle.entregado
                                        ? "bg-green-600 hover:bg-green-700"
                                        : "bg-gray-400 hover:bg-gray-500"
                                    }`}
                                  >
                                    {updatingDetalle === detalle.id ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : detalle.entregado ? (
                                      <>
                                        <Truck className="h-3 w-3 mr-1" />
                                        Entregado
                                      </>
                                    ) : (
                                      <>
                                        <Truck className="h-3 w-3 mr-1" />
                                        Entregar
                                      </>
                                    )}
                                  </Button>
                                </td>
                              </>
                            )}
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={isAdmin ? 6 : 4} className="py-2 px-3 text-center text-gray-500 text-sm">
                          Sin detalles de pedido
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}