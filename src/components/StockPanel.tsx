import { useState } from "react";
import {
  useMenu,
  createMenuItem,
  deleteMenuItem,
  updateMenuItem,
  obtenerIngredientesDeMenu,
  agregarIngredienteAMenu,
  actualizarCantidadIngrediente,
  eliminarIngredienteDeMenu,
  useIngredientes,
} from "@/hooks/useSupabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, Package, LogOut, Loader2, Plus, Trash2, Edit2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  const { ingredientes } = useIngredientes();
  const { toast } = useToast();

  // Estado para crear producto
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newProductName, setNewProductName] = useState("");
  const [newProductPrice, setNewProductPrice] = useState("");
  const [creating, setCreating] = useState(false);

  // Estado para gestionar ingredientes del producto
  const [showIngredientesDialog, setShowIngredientesDialog] = useState(false);
  const [selectedMenuId, setSelectedMenuId] = useState<number | null>(null);
  const [menuIngredientes, setMenuIngredientes] = useState<any[]>([]);
  const [loadingIngredientes, setLoadingIngredientes] = useState(false);

  // Estado para agregar ingrediente
  const [selectedIngredient, setSelectedIngredient] = useState("");
  const [ingredientCantidad, setIngredientCantidad] = useState("1");
  const [addingIngredient, setAddingIngredient] = useState(false);

  // Estado para eliminar
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Estado para editar producto
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingPrice, setEditingPrice] = useState("");
  const [editing, setEditing] = useState(false);

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

  const openIngredientesDialog = async (menuId: number) => {
    setSelectedMenuId(menuId);
    setLoadingIngredientes(true);
    const datos = await obtenerIngredientesDeMenu(menuId);
    setMenuIngredientes(datos);
    setLoadingIngredientes(false);
    setShowIngredientesDialog(true);
  };

  const handleAddIngredient = async () => {
    if (!selectedMenuId || !selectedIngredient) {
      toast({
        title: "Error",
        description: "Selecciona un ingrediente.",
        variant: "destructive",
      });
      return;
    }

    const cantidad = parseInt(ingredientCantidad, 10);
    if (isNaN(cantidad) || cantidad < 1) {
      toast({
        title: "Error",
        description: "La cantidad debe ser mayor a 0.",
        variant: "destructive",
      });
      return;
    }

    setAddingIngredient(true);
    const result = await agregarIngredienteAMenu(
      selectedMenuId,
      parseInt(selectedIngredient),
      cantidad
    );
    setAddingIngredient(false);

    if (result.success) {
      toast({
        title: "¡Agregado!",
        description: result.message,
      });
      setSelectedIngredient("");
      setIngredientCantidad("1");
      const datos = await obtenerIngredientesDeMenu(selectedMenuId);
      setMenuIngredientes(datos);
    } else {
      toast({
        title: "Error",
        description: result.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteMenuIngredient = async (menuIngredienteId: number) => {
    const result = await eliminarIngredienteDeMenu(menuIngredienteId);

    if (result.success) {
      toast({
        title: "¡Eliminado!",
        description: result.message,
      });
      setMenuIngredientes(
        menuIngredientes.filter((m) => m.id !== menuIngredienteId)
      );
    } else {
      toast({
        title: "Error",
        description: result.message,
        variant: "destructive",
      });
    }
  };

  const handleUpdateCantidad = async (
    menuIngredienteId: number,
    newCantidad: number
  ) => {
    const result = await actualizarCantidadIngrediente(
      menuIngredienteId,
      newCantidad
    );

    if (result.success) {
      const datos = await obtenerIngredientesDeMenu(selectedMenuId!);
      setMenuIngredientes(datos);
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

    if (isNaN(price) || price < 0) {
      toast({
        title: "Error",
        description: "Ingresá un precio válido (número mayor o igual a 0).",
        variant: "destructive",
      });
      return;
    }

    setCreating(true);
    const result = await createMenuItem({
      nombre: newProductName.trim(),
      precio: price,
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

  const openEditDialog = (item: any) => {
    setEditingId(item.id);
    setEditingName(item.nombre);
    setEditingPrice(item.precio.toString());
  };

  const handleUpdateProduct = async () => {
    if (!editingName.trim()) {
      toast({
        title: "Error",
        description: "El nombre del producto es requerido.",
        variant: "destructive",
      });
      return;
    }

    const price = parseFloat(editingPrice);
    if (isNaN(price) || price < 0) {
      toast({
        title: "Error",
        description: "Ingresá un precio válido (número mayor o igual a 0).",
        variant: "destructive",
      });
      return;
    }

    setEditing(true);
    const result = await updateMenuItem(editingId!, {
      nombre: editingName.trim(),
      precio: price,
    });
    setEditing(false);

    if (result.success) {
      toast({
        title: "¡Actualizado!",
        description: result.message,
      });
      setEditingId(null);
      setEditingName("");
      setEditingPrice("");
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
        <h2 className="text-2xl font-bold text-[#1a1a1a]">Gestionar Productos</h2>
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
            <p className="mb-4">No hay productos disponibles</p>
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
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">
                      Nombre
                    </th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-600">
                      Precio
                    </th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-600">
                      Ingredientes
                    </th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-600">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {menu.map((item) => (
                    <tr key={item.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-[#1a1a1a]">
                        {item.nombre}
                      </td>
                      <td className="py-3 px-4 text-center">
                        ${item.precio.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openIngredientesDialog(item.id)}
                          className="rounded-lg"
                        >
                          <Edit2 className="h-4 w-4 mr-1" />
                          Ver
                        </Button>
                      </td>
                      <td className="py-3 px-4 text-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDialog(item)}
                          className="rounded-lg"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setDeletingId(item.id)}
                          className="rounded-lg"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog para crear producto */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#2E86C1]">
              Crear Nuevo Producto
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1">
                Nombre del Producto *
              </label>
              <Input
                placeholder="Ej: Pancho"
                value={newProductName}
                onChange={(e) => setNewProductName(e.target.value)}
                className="rounded-lg"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1">
                Precio ($) *
              </label>
              <Input
                type="number"
                placeholder="Ej: 1500"
                value={newProductPrice}
                onChange={(e) => setNewProductPrice(e.target.value)}
                className="rounded-lg"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
              className="rounded-lg"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateProduct}
              disabled={creating}
              className="rounded-lg bg-[#2E86C1] hover:bg-[#2E86C1]/90 text-white"
            >
              {creating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Crear"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para gestionar ingredientes del producto */}
      <Dialog open={showIngredientesDialog} onOpenChange={setShowIngredientesDialog}>
        <DialogContent className="rounded-2xl sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#2E86C1]">
              Ingredientes del Producto
            </DialogTitle>
          </DialogHeader>

          {loadingIngredientes ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="space-y-4 py-4">
              {/* Agregar ingrediente */}
              <div className="border-b pb-4">
                <h3 className="font-semibold text-sm text-gray-700 mb-3">
                  Agregar Ingrediente
                </h3>
                <div className="space-y-3">
                  <Select value={selectedIngredient} onValueChange={setSelectedIngredient}>
                    <SelectTrigger className="rounded-lg">
                      <SelectValue placeholder="Selecciona un ingrediente..." />
                    </SelectTrigger>
                    <SelectContent>
                      {ingredientes.map((ing) => (
                        <SelectItem key={ing.id} value={ing.id.toString()}>
                          {ing.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min="1"
                      placeholder="Cantidad"
                      value={ingredientCantidad}
                      onChange={(e) => setIngredientCantidad(e.target.value)}
                      className="rounded-lg flex-1"
                    />
                    <Button
                      onClick={handleAddIngredient}
                      disabled={addingIngredient}
                      className="rounded-lg bg-green-600 hover:bg-green-700 text-white"
                    >
                      {addingIngredient ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Lista de ingredientes */}
              <div>
                <h3 className="font-semibold text-sm text-gray-700 mb-3">
                  Ingredientes del Producto
                </h3>
                {menuIngredientes.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No hay ingredientes asignados
                  </p>
                ) : (
                  <div className="space-y-2">
                    {menuIngredientes.map((mi) => (
                      <div
                        key={mi.id}
                        className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-sm text-[#1a1a1a]">
                            {mi.ingrediente?.nombre || "Ingrediente"}
                          </p>
                          <p className="text-xs text-gray-500">
                            Cantidad: {mi.cantidad}
                          </p>
                        </div>
                        <Input
                          type="number"
                          min="1"
                          value={mi.cantidad}
                          onChange={(e) =>
                            handleUpdateCantidad(mi.id, parseInt(e.target.value))
                          }
                          className="w-16 rounded-lg h-8"
                        />
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteMenuIngredient(mi.id)}
                          className="rounded-lg"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              onClick={() => setShowIngredientesDialog(false)}
              className="rounded-lg bg-[#2E86C1] hover:bg-[#2E86C1]/90 text-white"
            >
              Listo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para editar producto */}
      <Dialog open={editingId !== null} onOpenChange={(open) => {
        if (!open) {
          setEditingId(null);
          setEditingName("");
          setEditingPrice("");
        }
      }}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#2E86C1]">
              Editar Producto
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1">
                Nombre del Producto *
              </label>
              <Input
                placeholder="Ej: Pancho"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                className="rounded-lg"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1">
                Precio ($) *
              </label>
              <Input
                type="number"
                placeholder="Ej: 1500"
                value={editingPrice}
                onChange={(e) => setEditingPrice(e.target.value)}
                className="rounded-lg"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingId(null)}
              className="rounded-lg"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUpdateProduct}
              disabled={editing}
              className="rounded-lg bg-[#2E86C1] hover:bg-[#2E86C1]/90 text-white"
            >
              {editing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Guardar"
              )}
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
