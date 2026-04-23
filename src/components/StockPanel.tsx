import { useState } from "react";
import { useMenu, updateMenuItem, createMenuItem, deleteMenuItem } from "@/hooks/useSupabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, Package, LogOut, Loader2, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Props {
  isAdmin?: boolean;
  onLogout?: () => void;
}

export default function StockPanel({ isAdmin, onLogout }: Props) {
  const { menu, loading, error, refetch } = useMenu();
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editStock, setEditStock] = useState<string>("");
  const [editPrice, setEditPrice] = useState<string>("");
  const [updating, setUpdating] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newProductName, setNewProductName] = useState("");
  const [newProductPrice, setNewProductPrice] = useState("");
  const [newProductStock, setNewProductStock] = useState("");
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Solo mostrar acceso restringido si explícitamente es false, no si es undefined
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

  const handleEditStock = (menuId: number, currentStock: number, currentPrice: number) => {
    setEditingId(menuId);
    setEditStock(currentStock.toString());
    setEditPrice(currentPrice.toString());
  };

  const handleSaveStock = async (menuId: number) => {
    const newStock = parseInt(editStock, 10);
    const newPrice = parseFloat(editPrice);

    if (isNaN(newStock) || newStock < 0) {
      toast({
        title: "Error",
        description: "Ingresá un stock válido (número mayor o igual a 0).",
        variant: "destructive",
      });
      return;
    }

    if (isNaN(newPrice) || newPrice < 0) {
      toast({
        title: "Error",
        description: "Ingresá un precio válido (número mayor o igual a 0).",
        variant: "destructive",
      });
      return;
    }

    setUpdating(true);
    const result = await updateMenuItem(menuId, { stock: newStock, precio: newPrice });
    setUpdating(false);

    if (result.success) {
      toast({
        title: "¡Listo!",
        description: result.message,
      });
      setEditingId(null);
      setEditStock("");
      setEditPrice("");
      await refetch();
    } else {
      toast({
        title: "Error",
        description: result.message,
        variant: "destructive",
      });
    }
  };

  const handleCreateProduct = async () => {
    if (!newProductName.trim()) {
      toast({
        title: "Error",
        description: "El nombre del producto es requerido.",
        variant: "destructive",
      });
      return;
    }

    const price = parseFloat(newProductPrice);
    const stock = parseInt(newProductStock, 10);

    if (isNaN(price) || price < 0) {
      toast({
        title: "Error",
        description: "Ingresá un precio válido (número mayor o igual a 0).",
        variant: "destructive",
      });
      return;
    }

    if (isNaN(stock) || stock < 0) {
      toast({
        title: "Error",
        description: "Ingresá un stock válido (número mayor o igual a 0).",
        variant: "destructive",
      });
      return;
    }

    setCreating(true);
    const result = await createMenuItem({
      nombre: newProductName.trim(),
      precio: price,
      stock: stock,
    });
    setCreating(false);

    if (result.success) {
      toast({
        title: "¡Listo!",
        description: result.message,
      });
      setShowCreateDialog(false);
      setNewProductName("");
      setNewProductPrice("");
      setNewProductStock("");
      await refetch();
    } else {
      toast({
        title: "Error",
        description: result.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteProduct = async () => {
    if (deletingId === null) return;

    setDeleting(true);
    const result = await deleteMenuItem(deletingId);
    setDeleting(false);

    if (result.success) {
      toast({
        title: "¡Eliminado!",
        description: result.message,
      });
      setDeletingId(null);
      await refetch();
    } else {
      toast({
        title: "Error",
        description: result.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-[#1a1a1a]">Gestionar Stock</h2>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar Producto
          </Button>
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

      {!loading && menu.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-gray-500">
            <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="mb-4">No hay menús disponibles en el sistema</p>
            <Button
              onClick={() => refetch()}
              variant="outline"
              className="rounded-lg"
            >
              Recargar
            </Button>
          </CardContent>
        </Card>
      )}

      {!loading && menu.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-blue-50 border-b">
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Nombre</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-600">Precio</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-600">Stock</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-600">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {menu.map((item) => (
                    <tr key={item.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-[#1a1a1a]">{item.nombre}</td>
                      <td className="py-3 px-4 text-center">
                        {editingId === item.id ? (
                          <Input
                            type="text"
                            inputMode="decimal"
                            min="0"
                            step="0.01"
                            value={editPrice}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === '' || !isNaN(parseFloat(val))) setEditPrice(val);
                            }}
                            className="w-20 text-center mx-auto rounded-lg"
                            disabled={updating}
                            placeholder="0.00"
                          />
                        ) : (
                          <span className="font-semibold">${item.precio?.toFixed(2) || "0.00"}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {editingId === item.id ? (
                          <Input
                            type="text"
                            inputMode="numeric"
                            min="0"
                            value={editStock}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === '' || !isNaN(parseInt(val))) setEditStock(val);
                            }}
                            className="w-16 text-center mx-auto rounded-lg"
                            disabled={updating}
                          />
                        ) : (
                          <span className="font-bold text-lg">{item.stock}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {editingId === item.id ? (
                          <div className="flex gap-2 justify-center">
                            <Button
                              size="sm"
                              onClick={() => handleSaveStock(item.id)}
                              disabled={updating}
                              className="rounded-lg bg-green-600 hover:bg-green-700"
                            >
                              {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar"}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingId(null)}
                              disabled={updating}
                              className="rounded-lg"
                            >
                              Cancelar
                            </Button>
                          </div>
                        ) : (
                          <div className="flex gap-2 justify-center">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditStock(item.id, item.stock, item.precio)}
                              className="rounded-lg"
                            >
                              Editar
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => setDeletingId(item.id)}
                              className="rounded-lg"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Diálogo para crear producto */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Agregar Nuevo Producto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-2">
                Nombre del Producto
              </label>
              <Input
                value={newProductName}
                onChange={(e) => setNewProductName(e.target.value)}
                placeholder="Ej: Milanesa con guarnición"
                className="rounded-lg"
                disabled={creating}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-2">
                  Precio
                </label>
                <Input
                  type="text"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={newProductPrice}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '' || !isNaN(parseFloat(val))) setNewProductPrice(val);
                  }}
                  placeholder="0.00"
                  className="rounded-lg"
                  disabled={creating}
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-2">
                  Stock
                </label>
                <Input
                  type="text"
                  inputMode="numeric"
                  min="0"
                  value={newProductStock}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '' || !isNaN(parseInt(val))) setNewProductStock(val);
                  }}
                  placeholder="0"
                  className="rounded-lg"
                  disabled={creating}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
              disabled={creating}
              className="rounded-lg"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateProduct}
              disabled={creating}
              className="rounded-lg bg-blue-600 hover:bg-blue-700"
            >
              {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Crear Producto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmación para eliminar */}
      <AlertDialog open={deletingId !== null} onOpenChange={(open) => {
        if (!open) setDeletingId(null);
      }}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-lg">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProduct}
              disabled={deleting}
              className="rounded-lg bg-red-600 hover:bg-red-700"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
