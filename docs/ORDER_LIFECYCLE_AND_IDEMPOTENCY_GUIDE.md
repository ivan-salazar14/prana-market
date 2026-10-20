# 📦 Guía de Configuración: Ciclo de Vida de la Orden & Idempotencia (Épica 10)

Esta guía documenta cómo se crean, deduplican y verifican los pedidos de **Prana Market**, incluyendo **guest checkout**, la idempotencia por `transactionId` en Strapi y el evento de conversión `Purchase`.

---

## 📋 1. Visión General del Flujo

```text
Checkout (Cart.tsx / NequiCheckout.tsx / ManualNequiCheckout.tsx)
        │  POST /api/orders  (JSON)
        ▼
frontend/src/app/api/orders/route.ts        ── adaptador delgado
        │  processOrderRequest()            ── lógica de dominio
        ▼
Strapi CMS  /api/orders  (Bearer STRAPI_API_TOKEN)
        │  busca por transactionId → si existe, devuelve el original
        ▼
localStorage 'lastOrder'  →  /payment/success  →  Meta Pixel 'Purchase'
```

La lógica de negocio está centralizada en `frontend/src/utils/order.ts` y se ejecuta de forma idéntica en la API y en la suite de pruebas.

---

## 🔑 2. Variables de Entorno (`frontend/.env.local`)

```env
# URL del backend Strapi (usada por las rutas /api/* del servidor Next.js)
NEXT_PUBLIC_STRAPI_API_URL=https://prana-market-production.up.railway.app

# Token de API de Strapi — SOLO servidor. Nunca usar el prefijo NEXT_PUBLIC_.
STRAPI_API_TOKEN=tu_strapi_api_token_aqui
```

| Variable | Ámbito | Obligatoria | Efecto si falta |
|----------|--------|-------------|-----------------|
| `NEXT_PUBLIC_STRAPI_API_URL` | Servidor | No (default `http://localhost:1337`) | Apunta a localhost y el pedido falla en producción |
| `STRAPI_API_TOKEN` | Servidor | Sí | Strapi responde 401/403 y el pedido no se persiste |
| `NEXT_PUBLIC_FACEBOOK_PIXEL_ID` | Cliente | No | No se emite `Purchase` (ver guía de Meta Pixel) |

> **Seguridad:** `STRAPI_API_TOKEN` no debe llevar el prefijo `NEXT_PUBLIC_`, ya que eso lo expondría en el bundle del navegador. El token se usa únicamente dentro de `app/api/orders/route.ts`.

---

## 🗄️ 3. Requisitos en Strapi CMS

### 3.1 Content Type `Order` (`backend/src/api/order/content-types/order/schema.json`)

| Campo | Tipo | Requerido | Uso en la épica |
|-------|------|-----------|-----------------|
| `items` | `json` | Sí | Líneas del pedido (`id`, `name`, `price`, `quantity`) |
| `status` | `enumeration` | No (default `pending`) | Se escribe `paid` o `pending` desde la API |
| `total` | `decimal` | Sí | Total en COP |
| `subtotal` | `decimal` | Sí | Subtotal en COP |
| `deliveryCost` | `decimal` | No (default `0`) | Costo de envío |
| `deliveryMethod` | `json` | No | `{ id, name, description, cost }` |
| `shippingAddress` | `json` | No | Dirección DANE (`department`, `city`, `address`, `phone`, `fullName`) |
| `transactionId` | `string` | No | **Clave de idempotencia** |
| `paymentMethod` | `string` | No | `efectivo`, `nequi`, `nequi_manual`, `wompi` |
| `user` | `relation` (manyToOne → `plugin::users-permissions.user`) | No | Se omite en guest checkout |

Valores válidos de `status`: `pending`, `confirmed`, `paid`, `processing`, `in_transit`, `shipped`, `delivered`, `cancelled`, `refunded`.

### 3.2 Token de API y permisos

1. En Strapi Admin → **Settings → API Tokens → Create new API Token**.
2. Tipo: **Custom** (lectura + escritura) o **Full access** para el entorno de desarrollo.
3. Habilita al menos `find` y `create` sobre `api::order.order` del scope `Orders`.
4. Copia el token en `STRAPI_API_TOKEN` (nunca lo subas al repositorio).
5. Reinicia el frontend para que la ruta `/api/orders` tome la variable.

> El buscador de idempotencia usa `GET /api/orders?filters[transactionId][$eq]=...`, por lo que el token también necesita permiso de lectura (`find`).

---

## 🔌 4. Contrato de `POST /api/orders`

### 4.1 Body (JSON)

| Campo | Tipo | Requerido | Notas |
|-------|------|-----------|-------|
| `items` | `array` | Sí | Si es vacío, el pedido se registra sin líneas |
| `subtotal` | `number` | Sí | `0` se considera inválido |
| `total` | `number` | Sí | Total en COP |
| `paymentMethod` | `string` | Sí | Define el estado (`paid`/`pending`) |
| `deliveryMethod` | `object \| string JSON` | No | Si `id !== 'pickup'` se exige `shippingAddress` |
| `shippingAddress` | `object` | Condicional | Obligatorio para envío a domicilio |
| `deliveryCost` | `number` | No | Default `0` |
| `transactionId` | `string` | No (recomendado) | Se recorta; vacío = sin idempotencia |
| `userId` | `number \| string \| null` | No | `null`/inválido = **guest checkout** |

### 4.2 Respuestas

| Código | Cuándo | Body |
|--------|--------|------|
| `201` | Pedido nuevo persistido | Payload de Strapi: `{ data: { id, documentId, ... } }` |
| `200` | Ya existía un pedido con ese `transactionId` | `{ data: <pedido existente>, idempotent: true, message: "Order already processed" }` |
| `400` | Faltan campos o falta dirección | `{ error: "Missing required fields: ..." }` / `{ error: "Shipping address is required for delivery methods" }` |
| `4xx` | Error devuelto por Strapi | `{ error: "<mensaje de Strapi>" }` |
| `500` | Fallo inesperado | `{ error: "<mensaje>" }` |

### 4.3 Ejemplo cURL — pedido de invitado

```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{ "id": 1, "name": "Tono Labial Rose", "price": 35000, "quantity": 2 }],
    "subtotal": 70000,
    "deliveryCost": 5000,
    "total": 75000,
    "paymentMethod": "nequi",
    "transactionId": "TX-GUEST-001",
    "userId": null,
    "deliveryMethod": { "id": "delivery_express", "name": "Envío Exprés Local", "cost": 5000 },
    "shippingAddress": {
      "fullName": "Camila Rodríguez",
      "department": "Antioquia",
      "city": "Medellín",
      "address": "Cra 43A # 1-50",
      "phone": "3109876543"
    }
  }'
```

Ejecuta el mismo comando dos veces: la primera responde `201`, la segunda `200` con el **mismo** `data.id` y `idempotent: true`.

---

## ♻️ 5. Idempotencia por `transactionId`

**Reglas:**

1. Solo aplica si `transactionId` es una cadena no vacía (se aplica `trim`).
2. Antes de insertar, la API consulta Strapi por ese `transactionId`.
3. Si existe, devuelve el registro original **sin modificarlo ni recrearlo** (`200`).
4. Si el lookup falla (red, Strapi caído), el pedido **se crea igual** (`fail-open`): una falla de reconciliación nunca pierde una venta.
5. Sin `transactionId` no hay deduplicación: dos envíos idénticos crean dos pedidos.

**¿De dónde sale el `transactionId`?**

| Método de pago | Origen del `transactionId` |
|----------------|----------------------------|
| `efectivo` (contraentrega) | `EFECTIVO-<timestamp>-<aleatorio>`, estable por montaje del componente |
| `nequi` | `payment_id` devuelto por la pasarela Nequi |
| `nequi_manual` (transferencia) | `NEQUI-MANUAL-<timestamp>-<aleatorio>`, estable por montaje |
| `wompi` | Pendiente: la transacción externa aún no persiste `lastOrder` (ver limitaciones) |

> Los identificadores generados en el cliente se crean una vez por montaje (`useState(() => buildTransactionId(...))`), de modo que un doble clic reutiliza el mismo `transactionId` y no duplica el pedido.

---

## 💳 6. Matriz de Estados por Método de Pago

| `paymentMethod` | `status` guardado | Comportamiento en `/payment/success` |
|-----------------|-------------------|--------------------------------------|
| `efectivo` | `pending` | Banner "¡Pedido Confirmado!" + instrucciones de pago contraentrega |
| `nequi_manual` | `pending` | Botón "Enviar por WhatsApp" para adjuntar comprobante |
| `nequi` | `paid` | Banner "¡Pago Exitoso!" |
| `wompi` | `paid` | Banner "¡Pago Exitoso!" |

> **Regla dura:** contraentrega y transferencia manual **nunca** se registran como `paid`.

---

## 👤 7. Guest Checkout

- Si `localStorage.getItem('user')` no existe, es `null` o su JSON es inválido, el pedido se crea con `userId: null`.
- La API omite la relación `user`, por lo que Strapi guarda el pedido sin usuario.
- Los datos del comprador (nombre, teléfono, dirección) viajan en `shippingAddress`.
- Un JSON corrupto en `localStorage.user` **no** rompe el checkout: `readStoredUserId()` / `parseStoredUser()` caen a invitado.
- El flujo aplica a `efectivo`, `nequi` y `nequi_manual`; ninguno exige sesión.

---

## 🧾 8. Contrato de `localStorage.lastOrder`

Antes de redirigir a `/payment/success`, el checkout guarda:

```json
{
  "items": [{ "id": 1, "name": "Tono Labial Rose", "price": 35000, "quantity": 2 }],
  "deliveryMethod": { "id": "delivery_express", "name": "Envío Exprés Local", "cost": 5000 },
  "shippingAddress": { "fullName": "Camila Rodríguez", "city": "Medellín" },
  "subtotal": 70000,
  "deliveryCost": 5000,
  "total": 75000,
  "paymentMethod": "nequi",
  "transactionId": "TX-GUEST-001",
  "orderId": 1042,
  "timestamp": "2026-10-19T15:04:05.000Z"
}
```

`transactionId` u `orderId` son la clave para que `/payment/success` emita `Purchase` una sola vez. La página elimina `lastOrder` al montarse (evita recrear el pedido al recargar).

---

## 🧪 9. Verificación

### 9.1 Suite automatizada

```bash
cd frontend
npm run test:order
```

Salida esperada (exit code `0`):

```text
🧪 Epic 10: order correctness & verification

✅ Guest checkout persists with shipping metadata and no user relation.
✅ Registered checkout links the user relation.
✅ Duplicate transaction returns the original order without inserting.
✅ Missing transactionId does not collapse distinct orders.
✅ Cash/contraentrega never records a paid status.
✅ Delivery/pickup address validation matches the API contract.
✅ Transaction/user normalisation and guest fallbacks verified.
✅ Purchase event payload matches the Meta Pixel standard.
✅ Purchase event fires exactly once per transaction across reloads.
✅ Invalid Purchase payloads are rejected.
✅ Persistence failures propagate as typed API errors.

🎉 ALL EPIC 10 ORDER CORRECTNESS & VERIFICATION TESTS PASSED
```

La suite importa los módulos reales (`frontend/src/utils/order.ts`, `frontend/src/utils/analytics.ts`) con `--experimental-strip-types` de Node 22, por lo que prueba el mismo código que se despliega. Requiere Node ≥ 22.6.

### 9.2 Verificación manual de idempotencia

1. Envía dos veces el `curl` de la sección 4.3.
2. Confirma en Strapi Admin (`Content Manager → Order`) que existe **un solo** registro con `transactionId = TX-GUEST-001`.
3. Confirma que la segunda respuesta incluye `"idempotent": true`.

### 9.3 Verificación manual del flujo invitado

1. Abre el sitio en una ventana privada (sin `localStorage.user`).
2. Agrega un producto, completa la dirección DANE y elige **Contraentrega**.
3. Confirma el pedido: debe redirigir a `/payment/success` con el resumen y `status = pending` en Strapi.
4. Repite con **Nequi** sandbox y confirma `status = paid`.

---

## 🧯 10. Resolución de Problemas

| Síntoma | Causa probable | Solución |
|---------|----------------|----------|
| `400 Shipping address is required for delivery methods` | `deliveryMethod.id !== 'pickup'` sin `shippingAddress` | Enviar la dirección DANE o usar `pickup` |
| Pedidos duplicados al recargar | El cliente no envía `transactionId` | Verificar que el checkout lo incluya (Nequi: `payment_id`) |
| `401/403` al crear pedido | `STRAPI_API_TOKEN` ausente o sin permisos `find`/`create` | Renovar token y reiniciar el frontend |
| Pedido creado sin usuario | `userId` inválido o `localStorage.user` corrupto | Es el comportamiento esperado de guest checkout |
| `Purchase` no aparece en Meta | `lastOrder` sin `transactionId`/`orderId` | Revisar la sección 8 y la guía de Meta Pixel |
| Estado `paid` en contraentrega | No ocurre: `efectivo`/`nequi_manual` fuerzan `pending` | Si se observa, revisar `resolvePaymentStatus` en `utils/order.ts` |
| `spawn EPERM` al correr `npm run build` en un sandbox | El chequeo de TypeScript lanza un subproceso bloqueado | Usar `npx tsc --noEmit` para validar tipos fuera del sandbox |

---

## ⚠️ 11. Limitaciones Conocidas

- **Wompi:** la redirección externa aún no persiste `lastOrder`, por lo que el pedido Wompi no se crea desde `/payment/success`. La conciliación por webhook está planificada en la Épica 3 (historias pendientes).
- **Recarga de `/payment/success`:** la pantalla pierde el snapshot visual (el `lastOrder` se consume al montar), aunque la idempotencia garantiza que no se duplique el pedido ni el `Purchase`.
- **E2E en navegador:** la verificación cubre API + lógica de dominio; no hay suite Playwright para los pasos de UI.
- **`deliveryCost` omitido:** se normaliza a `0`.

---

## 📎 12. Referencias

- Dominio: `frontend/src/utils/order.ts`
- Endpoint: `frontend/src/app/api/orders/route.ts`
- Confirmación: `frontend/src/app/payment/success/page.tsx`
- Suite: `frontend/scripts/verify-order-lifecycle.js`
- Esquema Strapi: `backend/src/api/order/content-types/order/schema.json`
- Guía de tracking: `docs/META_PIXEL_ANALYTICS_GUIDE.md`
- Guía de pagos: `docs/PAYMENT_INTEGRATION_GUIDE.md`
