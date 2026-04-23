import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { MenuItem, PedidoConMenu } from "@/lib/types";

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
      setMenu(data || []);
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

    const channel = supabase
      .channel("menu-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "menu" },
        () => {
          fetchMenu();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchMenu]);

  return { menu, loading, error, refetch: fetchMenu };
}

export function usePedidos(estadoId: number, todayOnly: boolean = true) {
  const [pedidos, setPedidos] = useState<PedidoConMenu[]>([]);
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

      const { data: menuData } = await supabase.from("menu").select("*");
      const menuMap = new Map(
        (menuData || []).map((m: MenuItem) => [m.id, m.nombre])
      );

      const enriched: PedidoConMenu[] = (data || []).map(
        (p: PedidoConMenu) => ({
          ...p,
          menuNombre: menuMap.get(p.menuId) || "Desconocido",
        })
      );

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

    const channel = supabase
      .channel(`pedidos-estado-${estadoId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pedido" },
        () => {
          fetchPedidos();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPedidos, estadoId]);

  return { pedidos, loading, error, refetch: fetchPedidos };
}

export async function crearPedido(
  menuId: number,
  cantidad: number,
  nombreCliente: string,
  precioUnitario: number
): Promise<{ success: boolean; message: string }> {
  try {
    const { data: menuItem, error: menuErr } = await supabase
      .from("menu")
      .select("stock")
      .eq("id", menuId)
      .single();

    if (menuErr) throw menuErr;
    if (!menuItem || menuItem.stock < cantidad) {
      return {
        success: false,
        message: "No hay suficiente stock disponible.",
      };
    }

    const { error: pedidoErr } = await supabase.from("pedido").insert({
      menuId,
      cantidad,
      fecha: new Date().toISOString(),
      estadoPedidoId: 1,
      nombreCliente: nombreCliente.trim(),
      precio: precioUnitario * cantidad,
    });

    if (pedidoErr) throw pedidoErr;

    const { error: stockErr } = await supabase
      .from("menu")
      .update({ stock: menuItem.stock - cantidad })
      .eq("id", menuId);

    if (stockErr) throw stockErr;

    return { success: true, message: "¡Pedido realizado con éxito!" };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error al crear el pedido";
    return { success: false, message: msg };
  }
}

export async function cancelarPedido(
  pedidoId: number,
  menuId: number,
  cantidad: number
): Promise<{ success: boolean; message: string }> {
  try {
    const { data: menuItem, error: menuErr } = await supabase
      .from("menu")
      .select("stock")
      .eq("id", menuId)
      .single();

    if (menuErr) throw menuErr;

    const { error: delErr } = await supabase
      .from("pedido")
      .delete()
      .eq("id", pedidoId);

    if (delErr) throw delErr;

    const { error: stockErr } = await supabase
      .from("menu")
      .update({ stock: (menuItem?.stock || 0) + cantidad })
      .eq("id", menuId);

    if (stockErr) throw stockErr;

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