# Cantina "Somos Familia" - Sistema de Gestión

## Design Guidelines

### Color Palette (Paleta Institucional)
- Fondo Principal: #F2F4F4 (Gris claro/limpio)
- Color Primario (Nav/Botones): #2E86C1 (Azul Profundo)
- Acción Destacada (Pedidos): #E5BE01 (Dorado/Trigo)
- Acciones de Peligro/Cancelar: #C0392B (Rojo Tomate)
- Texto Principal: #1a1a1a
- Texto Secundario: #6b7280

### Typography
- Font: Inter (system default from shadcn)
- Headings: font-bold
- Body: font-normal

### Key Component Styles
- Bordes muy redondeados: rounded-2xl
- Sombras suaves: shadow-md / shadow-lg
- Iconografía: Lucide React

### Images to Generate
1. **hero-cantina-food.jpg** - Colorful Latin American food spread on a rustic wooden table, warm lighting, community gathering feel (Style: photorealistic, warm tones)
2. **logo-somos-familia.jpg** - Church youth group logo with cross and family silhouette, blue and gold colors (Style: minimalist)
3. **bg-pattern-food.jpg** - Subtle food pattern background, light gray tones, faded (Style: minimalist, light)
4. **empty-plate.jpg** - Empty clean white plate on wooden table, minimalist, top view (Style: photorealistic, clean)

---

## Development Tasks

### Files to Create:
1. **src/lib/supabase.ts** - Supabase client configuration with user's credentials
2. **src/lib/types.ts** - TypeScript interfaces for menu, pedido, estadoPedido, usuario
3. **src/hooks/useSupabase.ts** - Custom hooks for data fetching, real-time subscriptions, CRUD operations
4. **src/components/Dashboard.tsx** - Hero card, order modal, price table with stock indicators
5. **src/components/PedidosRealizados.tsx** - Pending orders list, filter, cancel/complete actions
6. **src/components/PedidosListos.tsx** - Completed orders read-only table
7. **src/components/AdminPanel.tsx** - Login form, stock management CRUD
8. **src/pages/Index.tsx** - Main SPA with tabs navigation, admin state management