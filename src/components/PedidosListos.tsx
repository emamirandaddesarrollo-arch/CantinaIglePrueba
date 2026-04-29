import { useState } from "react";
import { usePedidos, marcarPedidoPagado } from "@/hooks/useSupabase";
import { restar3Horas, formatFechaAjustada } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  AlertCircle,
  CheckCircle,
  PartyPopper,
  Copy,
  Check,
  DollarSign,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { PedidoConDetalles } from "@/lib/types";

interface Props {
  isAdmin: boolean;
}

const ALIAS = "jovenessomosfamilia";

export default function PedidosListos({ isAdmin }: Props) {
  const { pedidos, loading, error } = usePedidos(2, true);
  const { toast } = useToast();
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

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

  const handlePagar = async (pedidoId: number) => {
    setActionLoading(pedidoId);
    const result = await marcarPedidoPagado(pedidoId);
    setActionLoading(null);

    toast({
      title: result.success ? "¡Cobrado!" : "Error",
      description: result.message,
      variant: result.success ? "default" : "destructive",
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <CheckCircle className="h-6 w-6 text-green-600" />
        <h2 className="text-xl font-bold text-[#1a1a1a]">Pedidos Listos</h2>
        <span className="ml-auto bg-green-100 text-green-700 font-bold px-3 py-1 rounded-full text-sm">
          {pedidos.length} listo{pedidos.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Transfer info banner */}
      <Card className="rounded-2xl shadow-md border-0 border-l-4 border-l-green-500 bg-green-50">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1">
              <p className="font-bold text-green-800 text-base mb-1">
                🎉 ¡Ya podés retirar tu pedido!
              </p>
              <p className="text-green-700 text-sm">
                Podés pagar por transferencia al siguiente alias:
              </p>
              <div className="flex items-center gap-2 mt-2">
                <code className="bg-white text-green-800 font-bold text-lg px-4 py-2 rounded-xl border border-green-200 select-all">
                  {ALIAS}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyAlias}
                  className="rounded-xl border-green-400 text-green-700 hover:bg-green-100 shrink-0"
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

      {!loading && !error && pedidos.length === 0 && (
        <Card className="rounded-2xl shadow-md border-0">
          <CardContent className="p-8 text-center">
            <PartyPopper className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-lg">
              Aún no hay pedidos listos hoy.
            </p>
          </CardContent>
        </Card>
      )}

      {!loading && !error && pedidos.length > 0 && (
        <div className="space-y-3">
          {pedidos.map((pedido: PedidoConDetalles) => (
            <Card
              key={pedido.id}
              className="rounded-2xl shadow-md border-0 hover:shadow-lg transition-shadow overflow-hidden"
            >
              <CardContent className="p-0">
                <div className="bg-green-50 p-3 sm:p-4 border-b">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-green-200 text-green-900">
                          #{pedido.id}
                        </span>
                        <span className="font-bold text-green-900">
                          {pedido.nombreCliente}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">
                        {formatFechaAjustada(pedido.fecha)} • Total: <span className="font-semibold text-green-700">${pedido.precioTotal.toLocaleString()}</span>
                      </p>
                    </div>
                    {isAdmin && (
                      <Button
                        size="sm"
                        onClick={() => handlePagar(pedido.id)}
                        disabled={actionLoading === pedido.id}
                        className="bg-[#2E86C1] hover:bg-[#2E86C1]/90 text-white rounded-xl font-semibold shrink-0"
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
                      {pedido.detalles && pedido.detalles.length > 0 ? (
                        pedido.detalles.map((detalle, idx) => {
                          const precio = typeof detalle.precio === 'number' ? detalle.precio : parseFloat(detalle.precio as any) || 0;
                          return (
                            <tr
                              key={idx}
                              className="border-b last:border-b-0 hover:bg-gray-50/50"
                            >
                              <td className="py-2 px-3 font-medium text-[#1a1a1a] text-sm">
                                {detalle.menuNombre || "Desconocido"}
                              </td>
                              <td className="py-2 px-3 text-center font-semibold text-green-700 text-sm">
                                {detalle.cantidad || 0}
                              </td>
                              <td className="py-2 px-3 text-center text-gray-600 text-sm">
                                ${precio.toLocaleString()}
                              </td>
                              <td className="py-2 px-3 text-center font-semibold text-[#1a1a1a] text-sm">
                                ${(precio * (detalle.cantidad || 0)).toLocaleString()}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={4} className="py-2 px-3 text-center text-gray-500 text-sm">
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
      )}
    </div>
  );
}