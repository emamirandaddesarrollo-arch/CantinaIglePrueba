export interface MenuItem {
  id: number;
  nombre: string;
  stock: number;
  precio: number;
}

export interface Pedido {
  id: number;
  menuId: number;
  cantidad: number;
  fecha: string;
  estadoPedidoId: number;
  nombreCliente: string;
  precio: number;
}

export interface PedidoConMenu extends Pedido {
  menuNombre?: string;
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