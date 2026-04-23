import { useState } from "react";
import { usePedidos } from "@/hooks/useSupabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  AlertCircle,
  CheckCircle,
  LogOut,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { PedidoConMenu } from "@/lib/types";

interface Props {
  isAdmin?: boolean;
  onLogout?: () => void;
}

export default function PedidosPagados({ isAdmin, onLogout }: Props) {
  const { pedidos, loading, error } = usePedidos(3, false);
  const { toast } = useToast();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg border border-red-200">
        <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
        <p className="text-sm text-red-800">{error}</p>
      </div>
    );
  }

  if (!pedidos || pedidos.length === 0) {
    return (
      <div className="text-center py-12">
        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4 opacity-50" />
        <p className="text-gray-500">No hay pedidos cobrados aún</p>
      </div>
    );
  }

  const handleLogout = () => {
    toast({
      title: "Sesión cerrada",
      description: "Has cerrado sesión correctamente.",
    });
    if (onLogout) onLogout();
  };

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

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg border border-red-200">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {!loading && !error && pedidos.length > 0 && (
        <div>
          {pedidos.map((pedido: PedidoConMenu) => (
            <Card key={pedido.id} className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-green-900">
                      Pedido #{pedido.id}
                    </h3>
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-green-200 text-green-900">
                      <CheckCircle className="h-4 w-4" />
                      Cobrado
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    <strong>Cliente:</strong> {pedido.nombreCliente}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Plato:</strong> {pedido.menuNombre || "Desconocido"}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Cantidad:</strong> {pedido.cantidad}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Total:</strong> ${pedido.precio?.toFixed(2) || "0.00"}
                  </p>
                  <p className="text-xs text-gray-500">
                    <strong>Fecha:</strong> {new Date(pedido.fecha).toLocaleString('es-AR')}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
