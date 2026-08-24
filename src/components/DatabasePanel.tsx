import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  Database,
  Download,
  Loader2,
  LogOut,
  RefreshCw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Props {
  isAdmin?: boolean;
  onLogout?: () => void;
}

/** Fila cruda de la tabla `pedido`, tal cual viene de la base de datos. */
type PedidoRow = Record<string, unknown>;

/** Supabase devuelve como máximo 1000 filas por request, así que paginamos. */
const PAGE_SIZE = 1000;

/** Filas que se muestran en la vista previa (el Excel las lleva todas). */
const PREVIEW_ROWS = 20;

async function fetchTodosLosPedidos(): Promise<PedidoRow[]> {
  const filas: PedidoRow[] = [];

  for (let desde = 0; ; desde += PAGE_SIZE) {
    const { data, error } = await supabase
      .from("pedido")
      .select("*")
      .order("id", { ascending: true })
      .range(desde, desde + PAGE_SIZE - 1);

    if (error) throw error;
    if (!data || data.length === 0) break;

    filas.push(...data);
    if (data.length < PAGE_SIZE) break;
  }

  return filas;
}

/** Formatea un valor crudo para mostrarlo en la vista previa. */
function mostrarValor(valor: unknown): string {
  if (valor === null || valor === undefined) return "—";
  if (typeof valor === "object") return JSON.stringify(valor);
  return String(valor);
}

export default function DatabasePanel({ isAdmin, onLogout }: Props) {
  const { toast } = useToast();
  const [pedidos, setPedidos] = useState<PedidoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [descargando, setDescargando] = useState(false);

  const cargar = async () => {
    try {
      setLoading(true);
      const filas = await fetchTodosLosPedidos();
      setPedidos(filas);
      setError(null);
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : "Error al leer la tabla pedido";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  // La vista previa se muestra de la más reciente a la más vieja.
  // El Excel no se toca: sale con el orden crudo de la tabla.
  const pedidosPreview = useMemo(() => {
    const fechaDe = (fila: PedidoRow) => {
      const t = new Date(String(fila.fecha ?? "")).getTime();
      return isNaN(t) ? 0 : t;
    };
    return [...pedidos].sort((a, b) => {
      const dif = fechaDe(b) - fechaDe(a);
      if (dif !== 0) return dif;
      return Number(b.id ?? 0) - Number(a.id ?? 0);
    });
  }, [pedidos]);

  if (isAdmin === false) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
          <p className="text-sm text-yellow-800">
            Acceso restringido - Solo administradores
          </p>
        </div>
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

  const handleDescargarExcel = async () => {
    setDescargando(true);
    try {
      // Se relee la tabla al momento de exportar para que el archivo esté al día.
      const filas = await fetchTodosLosPedidos();

      if (filas.length === 0) {
        toast({
          title: "Sin datos",
          description: "La tabla pedido está vacía, no hay nada para exportar.",
          variant: "destructive",
        });
        return;
      }

      // Carga diferida: la librería sólo se descarga cuando el admin exporta.
      const XLSX = await import("xlsx");

      // json_to_sheet respeta las claves tal cual llegan de la base de datos,
      // así que las columnas del Excel son las columnas reales de la tabla.
      const hoja = XLSX.utils.json_to_sheet(filas);
      const libro = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(libro, hoja, "pedido");

      const hoy = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(libro, `pedidos_${hoy}.xlsx`);

      setPedidos(filas);
      toast({
        title: "¡Listo!",
        description: `Se exportaron ${filas.length} pedidos a Excel.`,
      });
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : "No se pudo generar el archivo";
      toast({
        title: "Error al exportar",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setDescargando(false);
    }
  };

  const columnas = pedidos.length > 0 ? Object.keys(pedidos[0]) : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-[#1a1a1a]">Base de Datos</h2>
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

      {/* Tarjeta de exportación */}
      <Card className="rounded-2xl shadow-md border-0 bg-gradient-to-r from-blue-50 to-sky-50 border-l-4 border-l-[#2E86C1]">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="bg-[#2E86C1] rounded-full p-3 w-fit">
              <Database className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-[#1a1a1a]">Tabla pedido</p>
              <p className="text-sm text-gray-600">
                {loading
                  ? "Leyendo la base de datos..."
                  : `${pedidos.length} ${
                      pedidos.length === 1 ? "pedido" : "pedidos"
                    } en total. Se exportan todas las columnas tal cual están en la base de datos.`}
              </p>
            </div>
            <Button
              onClick={handleDescargarExcel}
              disabled={descargando || loading}
              className="rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold shrink-0"
            >
              {descargando ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Descargar Excel
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#2E86C1]" />
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 rounded-2xl border border-red-200">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <p className="flex-1 text-sm text-red-800">{error}</p>
          <Button
            onClick={cargar}
            variant="outline"
            size="sm"
            className="rounded-lg shrink-0"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Reintentar
          </Button>
        </div>
      )}

      {!loading && !error && pedidos.length === 0 && (
        <Card className="rounded-2xl">
          <CardContent className="p-8 text-center text-gray-500">
            <p>La tabla pedido está vacía</p>
          </CardContent>
        </Card>
      )}

      {/* Vista previa de la tabla cruda */}
      {!loading && !error && pedidos.length > 0 && (
        <Card className="rounded-2xl shadow-md border-0">
          <CardContent className="p-0">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-bold text-[#1a1a1a]">Vista previa</h3>
              <span className="text-xs text-gray-500">
                {pedidos.length > PREVIEW_ROWS
                  ? `Últimas ${PREVIEW_ROWS} de ${pedidos.length} filas`
                  : `${pedidos.length} filas`}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-blue-50 border-b">
                    {columnas.map((col) => (
                      <th
                        key={col}
                        className="text-left py-3 px-4 font-semibold text-gray-600 text-xs whitespace-nowrap"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pedidosPreview.slice(0, PREVIEW_ROWS).map((fila, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      {columnas.map((col) => (
                        <td
                          key={col}
                          className="py-2 px-4 text-sm text-[#1a1a1a] whitespace-nowrap"
                        >
                          {mostrarValor(fila[col])}
                        </td>
                      ))}
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
