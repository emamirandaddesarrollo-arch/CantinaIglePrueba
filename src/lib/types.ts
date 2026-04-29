export interface MenuItem {
  id: number;
  nombre: string;
  precio: number;
  stock?: number; // Calculado dinámicamente, no de la BD
}

export interface Ingrediente {
  id: number;
  nombre: string;
  stock: number;
}

export interface MenuIngrediente {
  id: number;
  menuId: number;
  ingredienteId: number;
  cantidad: number;
  // Relaciones (opcional, para joins)
  ingrediente?: Ingrediente;
}

export interface DetallePedido {
  id: number;
  pedidoId: number;
  menuId: number;
  cantidad: number;
  precio: number; // precio unitario del menú
  cobrado?: boolean;
  entregado?: boolean;
  menuNombre?: string; // Opcional, para joins
}

export interface Pedido {
  id: number;
  fecha: string;
  estadoPedidoId: number;
  nombreCliente: string;
  precioTotal: number;
}

export interface PedidoConDetalles extends Pedido {
  detalles: DetallePedido[];
}

export interface PedidoConMenu extends Pedido {
  menuId?: number;
  cantidad?: number;
  precio?: number;
  menuNombre?: string;
  detalles?: DetallePedido[];
}

export interface EstadoPedido {
  id: number;
  nombre: string;
}

export interface Usuario {
  id: number;
  usuario: string;
  password: string;
  rolId: number;
}