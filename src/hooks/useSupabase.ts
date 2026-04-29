import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { MenuItem, PedidoConMenu, PedidoConDetalles, MenuIngrediente, DetallePedido } from "@/lib/types";

/** Get today's date range in ISO format (local timezone) */
function getTodayRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start: start.toISOString(), end: end.toISOString() };
}

export function useMenu() {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMenu = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error: err } = await supabase
        .from("menu")
        .select("*")
        .order("nombre", { ascending: true });
      if (err) throw err;

      // Calcular el stock disponible para cada menú basándose en ingredientes
      const menuConStock = await Promise.all(
        (data || []).map(async (item: MenuItem) => {
          const stockDisponible = await calcularStockDisponible(item.id);
          return {
            ...item,
            stock: stockDisponible,
          };
        })
      );

      setMenu(menuConStock);
      setError(null);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error al cargar el menú";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMenu();

    // Escuchar cambios en menu, menuIngrediente e ingrediente
    const channels = [
      supabase
        .channel("menu-changes")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "menu" },
          () => {
            fetchMenu();
          }
        )
        .subscribe(),
      supabase
        .channel("ingrediente-changes")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "ingrediente" },
          () => {
            fetchMenu();
          }
        )
        .subscribe(),
      supabase
        .channel("menuIngrediente-changes")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "menuIngrediente" },
          () => {
            fetchMenu();
          }
        )
        .subscribe(),
    ];

    return () => {
      channels.forEach((channel) => {
        supabase.removeChannel(channel);
      });
    };
  }, [fetchMenu]);

  return { menu, loading, error, refetch: fetchMenu };
}

export function usePedidos(estadoId: number, todayOnly: boolean = true) {
  const [pedidos, setPedidos] = useState<PedidoConDetalles[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPedidos = useCallback(async () => {
    try {
      setLoading(true);

      let query = supabase
        .from("pedido")
        .select("*")
        .eq("estadoPedidoId", estadoId);

      if (todayOnly) {
        const { start, end } = getTodayRange();
        query = query.gte("fecha", start).lt("fecha", end);
      }

      query = query.order("fecha", { ascending: false });

      const { data, error: err } = await query;
      if (err) throw err;

      // Obtener todos los detalles
      const { data: detallesData } = await supabase
        .from("detallePedido")
        .select("*");

      const { data: menuData } = await supabase.from("menu").select("*");
      const menuMap = new Map(
        (menuData || []).map((m: MenuItem) => [m.id, m.nombre])
      );

      const enriched: PedidoConDetalles[] = (data || []).map((p: any) => {
        const detallesPedido = (detallesData || [])
          .filter((d: any) => d.pedidoId === p.id)
          .map((d: any) => ({
            ...d,
            menuNombre: menuMap.get(d.menuId) || "Desconocido",
          }));

        return {
          id: p.id,
          fecha: p.fecha,
          estadoPedidoId: p.estadoPedidoId,
          nombreCliente: p.nombreCliente,
          precioTotal: p.precio,
          detalles: detallesPedido,
        };
      });

      setPedidos(enriched);
      setError(null);
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : "Error al cargar los pedidos";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [estadoId, todayOnly]);

  useEffect(() => {
    fetchPedidos();

    const channels = [
      supabase
        .channel(`pedidos-estado-${estadoId}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "pedido" },
          () => {
            fetchPedidos();
          }
        )
        .subscribe(),
      supabase
        .channel(`detalles-pedidos`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "detallePedido" },
          () => {
            fetchPedidos();
          }
        )
        .subscribe(),
    ];

    return () => {
      channels.forEach((channel) => {
        supabase.removeChannel(channel);
      });
    };
  }, [fetchPedidos, estadoId]);

  return { pedidos, loading, error, refetch: fetchPedidos };
}

/**
 * Calcula el stock disponible de un menú basándose en los ingredientes.
 * El stock es el mínimo cantidad de platos que se pueden hacer con los ingredientes actuales.
 * Ej: Si un pancho necesita 2 salchichas y 1 pan, y hay 10 salchichas y 5 panes,
 * el stock disponible es 5 (limitado por los panes)
 */
export async function calcularStockDisponible(
  menuId: number
): Promise<number> {
  try {
    // Obtener los ingredientes del menú
    const { data: menuIngredientes, error: err } = await supabase
      .from("menuIngrediente")
      .select("cantidad, ingredienteId")
      .eq("menuId", menuId);

    if (err) throw err;
    if (!menuIngredientes || menuIngredientes.length === 0) {
      // Si no tiene ingredientes asignados, retorna 0
      return 0;
    }

    // Para cada ingrediente, calcular cuántos platos se pueden hacer
    const cantidadesDisponibles: number[] = [];

    for (const mi of menuIngredientes as MenuIngrediente[]) {
      const { data: ingrediente, error: ingredErr } = await supabase
        .from("ingrediente")
        .select("stock")
        .eq("id", mi.ingredienteId)
        .single();

      if (ingredErr) throw ingredErr;
      if (!ingrediente) continue;

      // Si necesitamos N de este ingrediente y tenemos M disponibles,
      // podemos hacer M/N platos
      const platosPosibles = Math.floor(ingrediente.stock / mi.cantidad);
      cantidadesDisponibles.push(platosPosibles);
    }

    // El stock disponible es el mínimo (el cuello de botella)
    return cantidadesDisponibles.length > 0
      ? Math.min(...cantidadesDisponibles)
      : 0;
  } catch (e: unknown) {
    console.error("Error calculando stock disponible:", e);
    return 0;
  }
}

/**
 * Obtiene los ingredientes de un menú con sus cantidades
 */
async function obtenerIngredientesMenuo(
  menuId: number
): Promise<MenuIngrediente[]> {
  const { data, error } = await supabase
    .from("menuIngrediente")
    .select("*, ingrediente(*)")
    .eq("menuId", menuId);

  if (error) throw error;
  return data || [];
}

interface ItemPedido {
  menuId: number;
  cantidad: number;
  precio: number;
}

export async function crearPedido(
  items: ItemPedido[],
  nombreCliente: string
): Promise<{ success: boolean; message: string }> {
  try {
    if (!items || items.length === 0) {
      return {
        success: false,
        message: "Debes agregar al menos un item al pedido.",
      };
    }

    // Obtener nombres de menús para mensajes de error
    const { data: menuData } = await supabase.from("menu").select("id, nombre");
    const menuMap = new Map(
      (menuData || []).map((m: any) => [m.id, m.nombre])
    );

    // Validar stock y obtener ingredientes para cada item
    for (const item of items) {
      const menuNombre = menuMap.get(item.menuId) || "Menú desconocido";
      
      // Obtener ingredientes del menú
      const menuIngredientes = await obtenerIngredientesMenuo(item.menuId);
      
      // Si tiene ingredientes, validar stock
      if (menuIngredientes.length > 0) {
        const stockDisponible = await calcularStockDisponible(item.menuId);
        if (stockDisponible < item.cantidad) {
          return {
            success: false,
            message: `No hay suficiente stock de "${menuNombre}". Disponible: ${stockDisponible}, Solicitado: ${item.cantidad}`,
          };
        }
      }
      // Si no tiene ingredientes, se permite crear el pedido sin descontar stock
    }

    // Calcular total
    const precioTotal = items.reduce((sum, item) => {
      const precio = typeof item.precio === 'string' ? parseFloat(item.precio) : item.precio;
      return sum + (precio * item.cantidad);
    }, 0);

    if (isNaN(precioTotal) || precioTotal <= 0) {
      return {
        success: false,
        message: "Error al calcular el total del pedido. Verifica los precios.",
      };
    }

    // Crear el pedido
    const { data: pedidoData, error: pedidoErr } = await supabase
      .from("pedido")
      .insert({
        fecha: new Date().toISOString(),
        estadoPedidoId: 1,
        nombreCliente: nombreCliente.trim(),
        precio: precioTotal,
      })
      .select()
      .single();

    if (pedidoErr || !pedidoData) throw pedidoErr;

    const pedidoId = pedidoData.id;

    // Crear detalles del pedido
    const detalles = items.map((item) => ({
      pedidoId,
      menuId: item.menuId,
      cantidad: item.cantidad,
      precio: item.precio,
    }));

    const { error: detallesErr } = await supabase
      .from("detallePedido")
      .insert(detalles);

    if (detallesErr) throw detallesErr;

    // Restar stock para cada item (solo si tiene ingredientes)
    for (const item of items) {
      const menuIngredientes = await obtenerIngredientesMenuo(item.menuId);
      
      // Solo restar stock si el menú tiene ingredientes asignados
      if (menuIngredientes.length > 0) {
        for (const mi of menuIngredientes as MenuIngrediente[]) {
          const cantidadARestar = mi.cantidad * item.cantidad;

          const { data: ingredienteActual, error: readErr } = await supabase
            .from("ingrediente")
            .select("stock")
            .eq("id", mi.ingredienteId)
            .single();

          if (readErr) throw readErr;
          if (!ingredienteActual) throw new Error("Ingrediente no encontrado");

          const { error: updateErr } = await supabase
            .from("ingrediente")
            .update({
              stock: ingredienteActual.stock - cantidadARestar,
            })
            .eq("id", mi.ingredienteId);

          if (updateErr) throw updateErr;
        }
      }
    }

    return { success: true, message: "¡Pedido realizado con éxito!" };
  } catch (e: unknown) {
    console.error("Error en crearPedido:", e);
    const msg = e instanceof Error ? e.message : "Error desconocido al crear el pedido";
    return { success: false, message: msg };
  }
}

export async function cancelarPedido(
  pedidoId: number
): Promise<{ success: boolean; message: string }> {
  try {
    // Obtener todos los detalles del pedido
    const { data: detalles, error: detallesErr } = await supabase
      .from("detallePedido")
      .select("*")
      .eq("pedidoId", pedidoId);

    if (detallesErr) throw detallesErr;

    // Restaurar stock para cada detalle (solo si tiene ingredientes)
    for (const detalle of detalles || []) {
      const menuIngredientes = await obtenerIngredientesMenuo(detalle.menuId);

      // Solo restaurar stock si el menú tiene ingredientes
      if (menuIngredientes.length > 0) {
        // Restaurar cantidad de cada ingrediente
        for (const mi of menuIngredientes as MenuIngrediente[]) {
          const cantidadARestaurar = mi.cantidad * detalle.cantidad;

          // Leer el stock actual
          const { data: ingredienteActual, error: readErr } = await supabase
            .from("ingrediente")
            .select("stock")
            .eq("id", mi.ingredienteId)
            .single();

          if (readErr) throw readErr;
          if (!ingredienteActual) throw new Error("Ingrediente no encontrado");

          // Actualizar con el nuevo valor
          const { error: updateErr } = await supabase
            .from("ingrediente")
            .update({
              stock: ingredienteActual.stock + cantidadARestaurar,
            })
            .eq("id", mi.ingredienteId);

          if (updateErr) throw updateErr;
        }
      }
    }

    // Eliminar todos los detalles del pedido
    const { error: delDetallesErr } = await supabase
      .from("detallePedido")
      .delete()
      .eq("pedidoId", pedidoId);

    if (delDetallesErr) throw delDetallesErr;

    // Eliminar el pedido
    const { error: delErr } = await supabase
      .from("pedido")
      .delete()
      .eq("id", pedidoId);

    if (delErr) throw delErr;

    return { success: true, message: "Pedido cancelado y stock restaurado." };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error al cancelar el pedido";
    return { success: false, message: msg };
  }
}

export async function marcarPedidoListo(
  pedidoId: number
): Promise<{ success: boolean; message: string }> {
  try {
    // Verificar que todos los detalles estén pagados y entregados
    const { data: detalles, error: detallesErr } = await supabase
      .from("detallePedido")
      .select("cobrado, entregado")
      .eq("pedidoId", pedidoId);

    if (detallesErr) throw detallesErr;

    const todosCompletos = detalles?.every(d => d.cobrado && d.entregado);
    if (!todosCompletos) {
      return {
        success: false,
        message: "No se puede marcar como listo. Todos los ítems deben estar pagados y entregados.",
      };
    }

    const { error } = await supabase
      .from("pedido")
      .update({ estadoPedidoId: 2 })
      .eq("id", pedidoId);

    if (error) throw error;

    return { success: true, message: "Pedido marcado como listo." };
  } catch (e: unknown) {
    const msg =
      e instanceof Error ? e.message : "Error al actualizar el pedido";
    return { success: false, message: msg };
  }
}

export async function marcarPedidoPagado(
  pedidoId: number
): Promise<{ success: boolean; message: string }> {
  try {
    const { error } = await supabase
      .from("pedido")
      .update({ estadoPedidoId: 3 })
      .eq("id", pedidoId);

    if (error) throw error;

    return { success: true, message: "Pedido marcado como cobrado." };
  } catch (e: unknown) {
    const msg =
      e instanceof Error ? e.message : "Error al actualizar el pedido";
    return { success: false, message: msg };
  }
}

export async function actualizarDetallePagado(
  detalleId: number,
  cobrado: boolean
): Promise<{ success: boolean; message: string }> {
  try {
    const { error } = await supabase
      .from("detallePedido")
      .update({ cobrado })
      .eq("id", detalleId);

    if (error) throw error;

    return { success: true, message: cobrado ? "Marcado como pagado." : "Desmarcado como pagado." };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error al actualizar";
    return { success: false, message: msg };
  }
}

export async function actualizarDetalleEntregado(
  detalleId: number,
  entregado: boolean
): Promise<{ success: boolean; message: string }> {
  try {
    const { error } = await supabase
      .from("detallePedido")
      .update({ entregado })
      .eq("id", detalleId);

    if (error) throw error;

    return { success: true, message: entregado ? "Marcado como entregado." : "Desmarcado como entregado." };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error al actualizar";
    return { success: false, message: msg };
  }
}

export async function loginUsuario(
  usuario: string,
  password: string
): Promise<{ success: boolean; message: string }> {
  try {
    const { data, error } = await supabase
      .from("usuario")
      .select("*")
      .eq("usuario", usuario)
      .eq("password", password)
      .single();

    if (error || !data) {
      return {
        success: false,
        message: "Usuario o contraseña incorrectos.",
      };
    }

    return { success: true, message: "Inicio de sesión exitoso." };
  } catch (e: unknown) {
    const msg =
      e instanceof Error ? e.message : "Error al iniciar sesión";
    return { success: false, message: msg };
  }
}

export async function updateMenuStock(
  menuId: number,
  newStock: number
): Promise<{ success: boolean; message: string }> {
  try {
    const { error } = await supabase
      .from("menu")
      .update({ stock: newStock })
      .eq("id", menuId);

    if (error) throw error;

    return { success: true, message: "Stock actualizado." };
  } catch (e: unknown) {
    const msg =
      e instanceof Error ? e.message : "Error al actualizar el stock";
    return { success: false, message: msg };
  }
}

export async function updateMenuItem(
  menuId: number,
  data: Partial<MenuItem>
): Promise<{ success: boolean; message: string }> {
  try {
    const { error } = await supabase
      .from("menu")
      .update(data)
      .eq("id", menuId);

    if (error) throw error;

    return { success: true, message: "Ítem actualizado." };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error al actualizar";
    return { success: false, message: msg };
  }
}

export async function createMenuItem(
  item: Omit<MenuItem, "id">
): Promise<{ success: boolean; message: string }> {
  try {
    const { error } = await supabase.from("menu").insert(item);

    if (error) throw error;

    return { success: true, message: "Ítem creado exitosamente." };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error al crear el ítem";
    return { success: false, message: msg };
  }
}

export async function deleteMenuItem(
  menuId: number
): Promise<{ success: boolean; message: string }> {
  try {
    const { error } = await supabase.from("menu").delete().eq("id", menuId);

    if (error) throw error;

    return { success: true, message: "Ítem eliminado." };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error al eliminar el ítem";
    return { success: false, message: msg };
  }
}

// ============= INGREDIENTES =============

/**
 * Hook para obtener todos los ingredientes
 */
export function useIngredientes() {
  const [ingredientes, setIngredientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIngredientes = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error: err } = await supabase
        .from("ingrediente")
        .select("*")
        .order("nombre", { ascending: true });
      if (err) throw err;
      setIngredientes(data || []);
      setError(null);
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : "Error al cargar ingredientes";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIngredientes();

    const channel = supabase
      .channel("ingrediente-changes-hook")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ingrediente" },
        () => {
          fetchIngredientes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchIngredientes]);

  return { ingredientes, loading, error, refetch: fetchIngredientes };
}

/**
 * Obtener ingredientes de un menú específico
 */
export async function obtenerIngredientesDeMenu(menuId: number): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from("menuIngrediente")
      .select("*, ingrediente(*)")
      .eq("menuId", menuId)
      .order("nombre", { foreignTable: "ingrediente" });

    if (error) throw error;
    return data || [];
  } catch (e: unknown) {
    console.error("Error obteniendo ingredientes del menú:", e);
    return [];
  }
}

/**
 * Agregar ingrediente a un menú
 */
export async function agregarIngredienteAMenu(
  menuId: number,
  ingredienteId: number,
  cantidad: number
): Promise<{ success: boolean; message: string }> {
  try {
    // Verificar si ya existe
    const { data: existing, error: checkErr } = await supabase
      .from("menuIngrediente")
      .select("id")
      .eq("menuId", menuId)
      .eq("ingredienteId", ingredienteId)
      .single();

    if (checkErr && checkErr.code !== "PGRST116") throw checkErr;

    if (existing) {
      return {
        success: false,
        message: "Este ingrediente ya está asignado a este menú.",
      };
    }

    const { error } = await supabase.from("menuIngrediente").insert({
      menuId,
      ingredienteId,
      cantidad,
    });

    if (error) throw error;

    return { success: true, message: "Ingrediente agregado al menú." };
  } catch (e: unknown) {
    const msg =
      e instanceof Error ? e.message : "Error al agregar ingrediente";
    return { success: false, message: msg };
  }
}

/**
 * Actualizar cantidad de ingrediente en un menú
 */
export async function actualizarCantidadIngrediente(
  menuIngredienteId: number,
  cantidad: number
): Promise<{ success: boolean; message: string }> {
  try {
    if (cantidad < 1) {
      return {
        success: false,
        message: "La cantidad debe ser mayor a 0.",
      };
    }

    const { error } = await supabase
      .from("menuIngrediente")
      .update({ cantidad })
      .eq("id", menuIngredienteId);

    if (error) throw error;

    return { success: true, message: "Cantidad actualizada." };
  } catch (e: unknown) {
    const msg =
      e instanceof Error ? e.message : "Error al actualizar cantidad";
    return { success: false, message: msg };
  }
}

/**
 * Eliminar ingrediente de un menú
 */
export async function eliminarIngredienteDeMenu(
  menuIngredienteId: number
): Promise<{ success: boolean; message: string }> {
  try {
    const { error } = await supabase
      .from("menuIngrediente")
      .delete()
      .eq("id", menuIngredienteId);

    if (error) throw error;

    return { success: true, message: "Ingrediente eliminado del menú." };
  } catch (e: unknown) {
    const msg =
      e instanceof Error ? e.message : "Error al eliminar ingrediente";
    return { success: false, message: msg };
  }
}

/**
 * Crear nuevo ingrediente
 */
export async function crearIngrediente(
  nombre: string,
  stock: number
): Promise<{ success: boolean; message: string }> {
  try {
    if (stock < 0) {
      return {
        success: false,
        message: "El stock no puede ser negativo.",
      };
    }

    const { error } = await supabase.from("ingrediente").insert({
      nombre: nombre.trim(),
      stock,
    });

    if (error) throw error;

    return { success: true, message: "Ingrediente creado exitosamente." };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error al crear ingrediente";
    return { success: false, message: msg };
  }
}

/**
 * Actualizar ingrediente
 */
export async function actualizarIngrediente(
  ingredienteId: number,
  nombre: string,
  stock: number
): Promise<{ success: boolean; message: string }> {
  try {
    if (stock < 0) {
      return {
        success: false,
        message: "El stock no puede ser negativo.",
      };
    }

    const { error } = await supabase
      .from("ingrediente")
      .update({
        nombre: nombre.trim(),
        stock,
      })
      .eq("id", ingredienteId);

    if (error) throw error;

    return { success: true, message: "Ingrediente actualizado." };
  } catch (e: unknown) {
    const msg =
      e instanceof Error ? e.message : "Error al actualizar ingrediente";
    return { success: false, message: msg };
  }
}

/**
 * Eliminar ingrediente
 */
export async function eliminarIngrediente(
  ingredienteId: number
): Promise<{ success: boolean; message: string }> {
  try {
    const { error } = await supabase
      .from("ingrediente")
      .delete()
      .eq("id", ingredienteId);

    if (error) throw error;

    return { success: true, message: "Ingrediente eliminado." };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error al eliminar ingrediente";
    return { success: false, message: msg };
  }
}