# 📊 Guía de Configuración: Meta Pixel & Funnel Tracking (Épica 9)

Esta guía documenta cómo configurar, verificar y operar el seguimiento de conversiones de **Meta Pixel** en el storefront de **Prana Market** (Next.js 16 + App Router), incluyendo el modo seguro sin Pixel ID.

---

## 📋 1. Visión General

La instrumentación vive en `frontend/src/utils/analytics.ts` y se compone de cuatro piezas:

1. **Cliente tipado de analytics** (`analytics.ts`): funciones por evento, todas con moneda explícita `COP` y montos numéricos.
2. **Carga del Pixel** (`frontend/src/components/MetaPixel.tsx`): inyecta `fbevents.js` una sola vez y dispara `PageView` en cada cambio de ruta.
3. **Montaje global**: `<MetaPixel />` se renderiza dentro de `frontend/src/app/layout.tsx`, por lo que aplica a todo el sitio.
4. **Degradación segura**: si no hay Pixel ID configurado, todo se ejecuta como *no-op* (solo log en desarrollo), sin romper el checkout.

> El seguimiento es **100% client-side**. No hay Conversions API (server-side) implementada en esta épica.

---

## 🔑 2. Variables de Entorno (`frontend/.env.local`)

```env
# Meta / Facebook Pixel ID (opcional)
# Obtener en: https://eventsmanager.facebook.com
NEXT_PUBLIC_FACEBOOK_PIXEL_ID=123456789012345
```

| Variable | Obligatoria | Efecto si falta |
|----------|-------------|-----------------|
| `NEXT_PUBLIC_FACEBOOK_PIXEL_ID` | No | Modo mock: no se carga el script, no se envían eventos, solo logs en desarrollo |

**Reglas de configuración:**

- El valor se lee **en tiempo de build** (`FB_PIXEL_ID` es una constante de módulo). Cambiarlo exige reiniciar `npm run dev` o reconstruir (`npm run build`).
- Se considera **no configurado** si está vacío, o si contiene `YOUR_` o `placeholder`. Esto evita enviar tráfico a IDs de ejemplo.
- Nunca se hardcodea el ID en el código: siempre desde la variable de entorno.

---

## 🛠️ 3. Configuración en Meta Events Manager

1. Ingresa a [Meta Events Manager](https://eventsmanager.facebook.com) con la cuenta comercial de Prana Market.
2. Crea (o selecciona) el **Píxel de datos** del sitio web.
3. Copia el **ID del píxel** (15-16 dígitos) y colócalo en `NEXT_PUBLIC_FACEBOOK_PIXEL_ID`.
4. En **Configuración del píxel → Dominios verificados**, agrega el dominio de producción (ej. `pranamarket.store`) para habilitar el seguimiento entre dominios y evitar bloqueos.
5. En **Eventos → Probar eventos**, abre la URL de producción o `localhost` y confirma que llegan los eventos en tiempo real.
6. Verifica que el evento **`Purchase`** esté marcado como evento de conversión prioritario.

### Extensiones recomendadas para QA

- **Meta Pixel Helper** (Chrome): muestra en consola del navegador cada `fbq('track', ...)` con su payload.
- **Events Manager → Test Events**: requiere iniciar sesión en Meta mientras navegas el sitio.

---

## 🧭 4. Eventos Implementados

| Evento | Tipo | Dónde se dispara | Payload exacto |
|--------|------|------------------|----------------|
| `PageView` | Estándar | `MetaPixel.tsx` en cada cambio de ruta | `{ page_path }` |
| `ViewContent` | Estándar | `frontend/src/app/product/[id]/page.tsx` al cargar el producto | `content_ids`, `content_name`, `content_category`, `value`, `currency: 'COP'` |
| `AddToCart` | Estándar | PDP al añadir; `Cart.tsx` al aumentar cantidad (+1) | `content_ids`, `content_name`, `value` (precio × cantidad), `currency: 'COP'` |
| `InitiateCheckout` | Estándar | `Cart.tsx` al seleccionar forma de pago | `value` (subtotal), `num_items` (suma de cantidades), `currency: 'COP'` |
| `Purchase` | Estándar | `frontend/src/app/payment/success/page.tsx` al confirmar pedido | `value`, `currency: 'COP'`, `content_type: 'product'`, `contents[]`, `order_id`, `transaction_id`, `payment_method` |
| `WhatsAppContactClick` | Personalizado (`trackCustom`) | `frontend/src/components/FloatingWhatsApp.tsx` al abrir el chat | `origin`, `source_url`, `timestamp` |

### Detalle del evento `Purchase`

```js
fbq('track', 'Purchase', {
  value: 164000,                       // total numérico en COP
  currency: 'COP',
  content_type: 'product',
  contents: [
    { id: '1', quantity: 2, item_price: 35000 },
    { id: '7', quantity: 1, item_price: 89000 },
  ],
  order_id: '1042',
  transaction_id: 'TX-GUEST-001',
  payment_method: 'nequi',
});
```

**Reglas de disparo:**

- Se emite **una sola vez por transacción**. La deduplicación usa `sessionStorage` con la clave `tracked_purchase_<transaction_id>` (`claimPurchaseEvent` en `analytics.ts`).
- Si se recarga `/payment/success`, el evento **no se vuelve a emitir**.
- No se emite si falta `transactionId` o si `value` no es un número finito (evita conversiones con valor `NaN`).

---

## 🛡️ 5. Degradación Segura (sin Pixel / con ad-blocker)

| Escenario | Comportamiento |
|-----------|----------------|
| `NEXT_PUBLIC_FACEBOOK_PIXEL_ID` vacío o placeholder | No se carga el script; cada evento se registra como `[Analytics:Mock]` **solo** en `NODE_ENV=development` |
| `window.fbq` ausente por ad-blocker | `safeFbq` no lanza excepción; la navegación y el checkout continúan |
| Excepción dentro de `fbq` | Se captura con `try/catch`; en desarrollo se registra un `warn` |

Ninguna llamada de analytics es bloqueante ni condiciona el flujo de compra.

---

## 🧪 6. Verificación

### Automática

```bash
cd frontend
npm run test:analytics
```

Salida esperada (exit code `0`):

```text
🧪 Starting Epic 9 Analytics Verification...

✅ Pixel configuration detection passes all guards.
✅ Unconfigured / Safe Fallback execution operates without errors.
✅ Active Meta Pixel events and COP payloads verified successfully.
✅ Ad-blocker exception resilience verified.

🎉 ALL EPIC 9 ANALYTICS TESTS PASSED!
```

### Manual en navegador

```bash
cd frontend
npm run dev
```

1. Abre DevTools → Network y filtra por `facebook`.
2. Con el Pixel ID configurado, confirma una petición a `connect.facebook.net/en_US/fbevents.js`.
3. Navega a un producto y luego al carrito: deben verse `ViewContent`, `AddToCart` e `InitiateCheckout` en Pixel Helper.
4. Completa un pago sandbox y revisa en `/payment/success` que `Purchase` aparezca **una sola vez**; recarga la página y confirma que no se repite.

---

## 🧯 7. Resolución de Problemas

| Síntoma | Causa probable | Solución |
|---------|----------------|----------|
| No aparece `fbevents.js` en Network | Variable vacía, placeholder o build anterior | Define `NEXT_PUBLIC_FACEBOOK_PIXEL_ID` y reinicia dev / reconstruye |
| Eventos llegan sin `value` o con `0` | Producto sin precio numérico | Revisar `price` en Strapi (decimal, no string con separadores) |
| `Purchase` se duplica | Se borró `sessionStorage` (p. ej. nueva pestaña) | Es esperado entre pestañas; dentro de la misma sesión está deduplicado |
| `Purchase` nunca se dispara | Pedido sin `transactionId` u `orderId` en `lastOrder` | Ver la guía de órdenes: `docs/ORDER_LIFECYCLE_AND_IDEMPOTENCY_GUIDE.md` |
| Sin logs en consola | Estás en producción (`NODE_ENV !== development`) | Los logs mock solo se emiten en desarrollo |
| Eventos bloqueados en móvil | Ad-blocker o navegador con tracking prevention | Validar con Pixel Helper en escritorio; el flujo de compra no se ve afectado |

---

## 📎 8. Referencias

- Código: `frontend/src/utils/analytics.ts`, `frontend/src/components/MetaPixel.tsx`
- Script de verificación: `frontend/scripts/verify-analytics.js`
- Guía de órdenes y conversión: `docs/ORDER_LIFECYCLE_AND_IDEMPOTENCY_GUIDE.md`
