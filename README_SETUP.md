# Cantina Somos Familia - Frontend

Aplicación de React + TypeScript para gestión de pedidos de cantina.

## Requisitos Previos

- Node.js (versión 18 o superior)
- npm o pnpm

## Instalación

1. **Clonar el repositorio:**
```bash
git clone <tu-repositorio>
cd frontend
```

2. **Instalar dependencias:**
```bash
npm install
```

3. **Configurar variables de entorno:**
   - Copia el archivo `.env.example` a `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   - Abre `.env.local` y completa tus credenciales de Supabase:
   ```
   VITE_SUPABASE_URL=tu_supabase_url
   VITE_SUPABASE_ANON_KEY=tu_supabase_anon_key
   ```
   - Puedes obtener estas credenciales en tu [dashboard de Supabase](https://app.supabase.com)

## Desarrollo

Para ejecutar el servidor de desarrollo:
```bash
npm run dev
```

La aplicación abrirá en `http://localhost:3000/`

## Compilación para Producción

```bash
npm run build
```

Los archivos compilados se generarán en la carpeta `dist/`

## Comandos Disponibles

- `npm run dev` - Inicia el servidor de desarrollo con hot reload
- `npm run build` - Compila el proyecto para producción
- `npm run preview` - Vista previa del build de producción
- `npm run lint` - Ejecuta el linter de ESLint

## Seguridad

⚠️ **Importante:** 
- Las credenciales de Supabase se almacenan en `.env.local`
- **NUNCA** subes `.env.local` a GitHub (incluido en `.gitignore`)
- Las variables con prefijo `VITE_` son visibles en el cliente (usa solo claves públicas)
- Para datos sensibles en el servidor, crea una API backend

## Estructura del Proyecto

```
src/
├── components/        # Componentes React
├── pages/            # Páginas de la aplicación
├── hooks/            # React hooks personalizados
├── lib/              # Funciones utilitarias
├── assets/           # Imágenes, fonts, etc
└── main.tsx          # Punto de entrada
```

## Características

- 📋 Gestión de pedidos
- 🔐 Autenticación de administrador
- 📊 Panel de control
- 🛒 Sistema de carrito
- 💾 Sincronización con Supabase

## Licencia

Este proyecto es privado.
