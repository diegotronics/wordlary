# Guía de Testing y Debugging - VocabFlow

Esta guía explica cómo probar las distintas secciones de la app durante el desarrollo.

## Herramientas Disponibles

| Herramienta | Ubicación | Para qué sirve |
|-------------|-----------|-----------------|
| Browser Helpers | `scripts/browser-helpers.js` | Funciones `vf.*` en la consola del navegador |
| Dev API | `src/app/api/dev/route.ts` | Endpoint REST para manipular datos (solo dev) |
| SQL Helpers | `scripts/test-helpers.sql` | Queries para el SQL Editor de Supabase |
| Shell Script | `scripts/test-api.sh` | Probar APIs desde la terminal |

---

## Método más rápido: Browser Helpers

1. Abre la app en el navegador y logueate
2. Abre DevTools (`F12` o `Cmd+Option+I`)
3. Ve a la pestaña **Console**
4. Copia y pega el contenido de `scripts/browser-helpers.js`
5. Usa las funciones `vf.*`

```js
vf.help()  // Ver todos los comandos disponibles
```

---

## Escenarios Comunes

### Probar la sección de Repaso (`/review`)

**Problema**: No hay palabras para repasar porque `next_review_date` es futuro.

**Solución rápida (consola del navegador)**:
```js
// Opción 1: Atajo completo - completa la sesión y fuerza repasos
await vf.setupReview()

// Opción 2: Paso a paso
await vf.completeSession()  // Marca todas las palabras como aprendidas
await vf.forceReviews()     // Mueve todos los repasos a hoy
// Navegar a /review
```

**Con SQL (Supabase SQL Editor)**:
```sql
-- Mover todos los repasos a hoy
UPDATE review_schedule
SET next_review_date = CURRENT_DATE
WHERE user_id = '<TU_USER_ID>';
```

### Probar una nueva sesión diaria

**Problema**: Ya hiciste la sesión de hoy y quieres probar el flujo de una nueva.

**Solución rápida**:
```js
// Atajo: borra la sesión de hoy y recarga
await vf.setupNewSession()

// O manualmente:
await vf.resetSession()  // Borra la sesión de hoy
// Recargar la página → se crea una nueva sesión
```

### Probar con datos limpios (sin perder la cuenta)

```js
await vf.resetProgress()
// Borra: sesiones, palabras, repasos, streaks
// Mantiene: cuenta, onboarding, intereses seleccionados
```

### Probar streaks

```js
// Simular un streak de 7 días
await vf.setStreak(7)

// Simular streak largo con récord
await vf.setStreak(5, 15)  // actual=5, longest=15

// Resetear streak
await vf.setStreak(0)
```

### Probar generación de palabras

```js
// Insertar palabras de prueba sin llamar a Gemini
await vf.seedWords()

// O hacer el flujo completo (requiere API key de Gemini)
await vf.autoSession()
```

### Ver el estado actual del usuario

```js
await vf.inspect()
// Muestra: perfil, sesión de hoy, repasos pendientes, total de palabras
```

### Probar el flujo completo de extremo a extremo

```js
await vf.fullFlow()
// Ejecuta: sesión → generar → marcar primera palabra → verificar repasos → stats
```

---

## Dev API (`/api/dev`)

El endpoint `/api/dev` solo funciona cuando `NODE_ENV !== 'production'`. Acepta POST con un campo `action`:

| Acción | Descripción | Ejemplo |
|--------|-------------|---------|
| `inspect` | Ver estado del usuario | `{ "action": "inspect" }` |
| `force-reviews` | Mover repasos a hoy | `{ "action": "force-reviews", "limit": 5 }` |
| `reset-session` | Borrar sesión de hoy | `{ "action": "reset-session" }` |
| `set-streak` | Cambiar streak | `{ "action": "set-streak", "current": 7 }` |
| `reset-progress` | Borrar todo el progreso | `{ "action": "reset-progress" }` |
| `seed-words` | Insertar palabras de prueba | `{ "action": "seed-words" }` |
| `complete-session` | Completar sesión al instante | `{ "action": "complete-session" }` |

---

## Script de Terminal (`scripts/test-api.sh`)

Para probar las APIs directamente desde la terminal:

```bash
# Configurar cookie de sesión (ver instrucciones en el script)
export VOCABFLOW_COOKIE="sb-xxx-auth-token=..."

# Comandos
./scripts/test-api.sh session       # Obtener sesión
./scripts/test-api.sh review        # Ver repasos pendientes
./scripts/test-api.sh stats         # Ver estadísticas
./scripts/test-api.sh flow          # Flujo completo automático
./scripts/test-api.sh help          # Ver todos los comandos
```

---

## SQL Helpers (`scripts/test-helpers.sql`)

Para manipulación directa de la base de datos via Supabase SQL Editor:

1. Ve a tu dashboard de Supabase → SQL Editor
2. Abre `scripts/test-helpers.sql`
3. Reemplaza `<USER_ID>` con tu UUID real
4. Ejecuta los queries que necesites

Las secciones incluyen:
- Inspeccionar estado actual
- Simular día siguiente
- Forzar repasos
- Probar streaks
- Insertar palabras manualmente
- Reset completo
- Verificar integridad de datos

---

## Tips de Debugging

### Ver logs del servidor
```bash
# Los logs de Next.js aparecen directamente en la terminal
npm run dev
# Los console.error() de las API routes aparecerán aquí
```

### Inspeccionar el estado de Zustand
Instala la extensión [React DevTools](https://react.dev/learn/react-developer-tools) y usa el inspector de componentes para ver el estado de los stores.

### Debugging de Supabase
- Dashboard → Logs → API para ver todas las queries
- Dashboard → Auth → Users para ver cuentas
- Dashboard → Table Editor para navegar datos visualmente
- RLS policies se pueden desactivar temporalmente en Dashboard → Auth → Policies

### Variables de entorno
Verifica que las variables están configuradas:
```bash
# En .env.local
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
GOOGLE_GEMINI_API_KEY=...
```
