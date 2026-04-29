import { useState } from "react";
import {
  useIngredientes,
  crearIngrediente,
  actualizarIngrediente,
  eliminarIngrediente,
} from "@/hooks/useSupabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, LogOut, Loader2, Plus, Trash2, Edit2 } from "lucide-react";
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

export default function IngredientsPanel({ isAdmin, onLogout }: Props) {
  const { ingredientes, loading, error, refetch } = useIngredientes();
  const { toast } = useToast();

  // Estado para crear ingrediente
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newIngredientName, setNewIngredientName] = useState("");
  const [newIngredientStock, setNewIngredientStock] = useState("");
  const [creating, setCreating] = useState(false);

  // Estado para editar ingrediente
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingStock, setEditingStock] = useState("");
  const [editing, setEditing] = useState(false);

  // Estado para eliminar
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  const handleCreateIngredient = async () => {
    if (!newIngredientName.trim()) {
      toast({
        title: "Error",
        description: "El nombre del ingrediente es requerido.",
        variant: "destructive",
      });
      return;
    }

    const stock = parseInt(newIngredientStock, 10);
    if (isNaN(stock) || stock < 0) {
      toast({
        title: "Error",
        description: "Ingresá un stock válido (número mayor o igual a 0).",
        variant: "destructive",
      });
      return;
    }

    setCreating(true);
    const result = await crearIngrediente(newIngredientName.trim(), stock);
    setCreating(false);

    if (result.success) {
      toast({
        title: "¡Listo!",
        description: result.message,
      });
      setShowCreateDialog(false);
      setNewIngredientName("");
      setNewIngredientStock("");
      await refetch();
    } else {
      toast({
        title: "Error",
        description: result.message,
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (ingredient: any) => {
    setEditingId(ingredient.id);
    setEditingName(ingredient.nombre);
    setEditingStock(ingredient.stock.toString());
  };

  const handleUpdateIngredient = async () => {
    if (!editingName.trim()) {
      toast({
        title: "Error",
        description: "El nombre del ingrediente es requerido.",
        variant: "destructive",
      });
      return;
    }

    const stock = parseInt(editingStock, 10);
    if (isNaN(stock) || stock < 0) {
      toast({
        title: "Error",
        description: "Ingresá un stock válido (número mayor o igual a 0).",
        variant: "destructive",
      });
      return;
    }

    setEditing(true);
    const result = await actualizarIngrediente(
      editingId!,
      editingName.trim(),
      stock
    );
    setEditing(false);

    if (result.success) {
      toast({
        title: "¡Actualizado!",
        description: result.message,
      });
      setEditingId(null);
      setEditingName("");
      setEditingStock("");
      await refetch();
    } else {
      toast({
        title: "Error",
        description: result.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteIngredient = async () => {
    if (deletingId === null) return;

    setDeleting(true);
    const result = await eliminarIngrediente(deletingId);
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
        <h2 className="text-2xl font-bold text-[#1a1a1a]">Gestionar Ingredientes</h2>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar Ingrediente
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

      {!loading && ingredientes.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-gray-500">
            <p className="mb-4">No hay ingredientes disponibles</p>
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

      {!loading && ingredientes.length > 0 && (
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
                      Stock
                    </th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-600">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {ingredientes.map((ingredient) => (
                    <tr key={ingredient.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-[#1a1a1a]">
                        {ingredient.nombre}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`font-bold ${
                            ingredient.stock === 0
                              ? "text-[#C0392B]"
                              : ingredient.stock < 10
                              ? "text-yellow-600"
                              : "text-green-600"
                          }`}
                        >
                          {ingredient.stock}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDialog(ingredient)}
                          className="rounded-lg"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setDeletingId(ingredient.id)}
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

      {/* Dialog para crear ingrediente */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#2E86C1]">
              Crear Nuevo Ingrediente
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1">
                Nombre del Ingrediente *
              </label>
              <Input
                placeholder="Ej: Pan"
                value={newIngredientName}
                onChange={(e) => setNewIngredientName(e.target.value)}
                className="rounded-lg"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1">
                Stock *
              </label>
              <Input
                type="number"
                placeholder="Ej: 50"
                value={newIngredientStock}
                onChange={(e) => setNewIngredientStock(e.target.value)}
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
              onClick={handleCreateIngredient}
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

      {/* Dialog para editar ingrediente */}
      <Dialog open={editingId !== null} onOpenChange={(open) => {
        if (!open) {
          setEditingId(null);
          setEditingName("");
          setEditingStock("");
        }
      }}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#2E86C1]">
              Editar Ingrediente
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1">
                Nombre del Ingrediente *
              </label>
              <Input
                placeholder="Ej: Pan"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                className="rounded-lg"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1">
                Stock *
              </label>
              <Input
                type="number"
                placeholder="Ej: 50"
                value={editingStock}
                onChange={(e) => setEditingStock(e.target.value)}
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
              onClick={handleUpdateIngredient}
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
            <AlertDialogTitle>¿Eliminar ingrediente?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar este ingrediente? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-lg">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteIngredient}
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
