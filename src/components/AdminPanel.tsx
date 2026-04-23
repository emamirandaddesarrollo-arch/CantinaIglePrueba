import { useState } from "react";
import { loginUsuario } from "@/hooks/useSupabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Lock, LogIn, Loader2, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Props {
  isAdmin: boolean;
  onLogin: () => void;
}

export default function AdminPanel({ isAdmin, onLogin }: Props) {
  if (isAdmin) {
    return null; // When logged in, admin tab content is handled by Index.tsx
  }

  return <LoginForm onLogin={onLogin} />;
}

function LoginForm({ onLogin }: { onLogin: () => void }) {
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const { toast } = useToast();

  const handleLogin = async () => {
    if (!usuario.trim() || !password.trim()) {
      toast({
        title: "Error",
        description: "Completá usuario y contraseña.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const result = await loginUsuario(usuario, password);
    setLoading(false);

    if (result.success) {
      toast({ title: "¡Bienvenido!", description: result.message });
      onLogin();
    } else {
      toast({
        title: "Error",
        description: result.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Card className="rounded-2xl shadow-lg border-0 w-full max-w-sm">
        <CardContent className="p-6 sm:p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-[#2E86C1]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="h-8 w-8 text-[#2E86C1]" />
            </div>
            <h2 className="text-xl font-bold text-[#1a1a1a]">
              Acceso Administrador
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Ingresá tus credenciales
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-user" className="font-semibold">
                Usuario
              </Label>
              <Input
                id="admin-user"
                placeholder="Tu usuario..."
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                className="rounded-xl"
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-pass" className="font-semibold">
                Contraseña
              </Label>
              <Input
                id="admin-pass"
                type="password"
                placeholder="Tu contraseña..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-xl"
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
            </div>
            <Button
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-[#2E86C1] hover:bg-[#2E86C1]/90 text-white font-bold rounded-xl py-5"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <LogIn className="h-4 w-4 mr-2" />
              )}
              Iniciar Sesión
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHelp(true)}
              className="w-full text-gray-400 hover:text-[#2E86C1] text-xs"
            >
              <Info className="h-3 w-3 mr-1" />
              ¿No podés iniciar sesión?
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Help Dialog */}
      <Dialog open={showHelp} onOpenChange={setShowHelp}>
        <DialogContent className="rounded-2xl sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#2E86C1] flex items-center gap-2">
              <Info className="h-5 w-5" />
              Configuración Inicial
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 text-sm">
            <p className="text-gray-600">
              Si es la primera vez que usás la app, necesitás crear un usuario
              admin en la base de datos. Ejecutá este SQL en el{" "}
              <strong>SQL Editor de Supabase</strong>:
            </p>
            <div className="bg-gray-900 text-green-400 p-4 rounded-xl overflow-x-auto text-xs font-mono whitespace-pre">
{`-- Permitir lectura de usuarios
CREATE POLICY "allow_public_read_usuario"
  ON usuario FOR SELECT USING (true);

-- Crear usuario admin
INSERT INTO usuario (usuario, password, "rolId")
  VALUES ('admin', 'admin123', 1)
  ON CONFLICT DO NOTHING;`}
            </div>
            <p className="text-gray-500 text-xs">
              Luego iniciá sesión con: <strong>admin</strong> /{" "}
              <strong>admin123</strong>
            </p>
          </div>
          <DialogFooter>
            <Button
              onClick={() => setShowHelp(false)}
              className="bg-[#2E86C1] hover:bg-[#2E86C1]/90 text-white rounded-xl"
            >
              Entendido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}