import { useState } from "react";
import { usePedidos, marcarPedidoPagado } from "@/hooks/useSupabase";
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
        <Card className="rounded-2xl shadow-md border-0 overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-green-50">
                    <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">
                      #
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">
                      Cliente
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">
                      Plato
                    </th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-600 text-sm">
                      Cantidad
                    </th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-600 text-sm">
                      Total
                    </th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-600 text-sm">
                      Hora
                    </th>
                    {isAdmin && (
                      <th className="text-center py-3 px-4 font-semibold text-gray-600 text-sm">
                        Acción
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {pedidos.map((pedido) => (
                    <tr
                      key={pedido.id}
                      className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="py-3 px-4 text-sm text-gray-400">
                        {pedido.id}
                      </td>
                      <td className="py-3 px-4 font-medium text-[#1a1a1a]">
                        {pedido.nombreCliente}
                      </td>
                      <td className="py-3 px-4 text-[#2E86C1] font-medium">
                        {pedido.menuNombre}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {pedido.cantidad}
                      </td>
                      <td className="py-3 px-4 text-center font-semibold">
                        ${pedido.precio.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center text-sm text-gray-500">
                        {new Date(pedido.fecha).toLocaleTimeString("es-AR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      {isAdmin && (
                        <td className="py-3 px-4 text-center">
                          <Button
                            size="sm"
                            onClick={() => handlePagar(pedido.id)}
                            disabled={actionLoading === pedido.id}
                            className="bg-[#2E86C1] hover:bg-[#2E86C1]/90 text-white rounded-xl font-semibold"
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
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}