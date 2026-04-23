import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Las variables de entorno VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY no están configuradas. " +
    "Copia .env.example a .env.local y agrega tus credenciales de Supabase."
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey);

/** Quick connectivity check – resolves true if the API responds. */
export async function checkConnection(): Promise<{
  connected: boolean;
  message: string;
}> {
  try {
    const { error } = await supabase.from("menu").select("id").limit(1);
    if (error) {
      return { connected: false, message: error.message };
    }
    return { connected: true, message: "Conectado a Supabase correctamente." };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error desconocido";
    return { connected: false, message: msg };
  }
}