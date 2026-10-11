# 📸 Guía de Configuración: Instagram Commerce & Lead Acquisition Engine

Esta guía documenta el procedimiento paso a paso para configurar la integración entre **Prana Market** (Strapi CMS + Next.js storefront) e **Instagram / Meta Commerce Manager**.

---

## 📋 1. Visión General de la Integración

La integración con Instagram abarca 4 componentes principales:

1. **Meta Product Catalog Feed (`/api/catalog/instagram-feed.xml`)**: Generación de un feed RSS 2.0 XML en COP compatible con Instagram Shopping.
2. **Meta Webhook Handler (`/api/social-leads/webhook`)**: Escuchador HTTP para mensajes directos (DMs) y comentarios en publicaciones de Instagram.
3. **Strapi Lead Logging & Analytics (`api::social-lead.social-lead`)**: Colección en Strapi que registra leads capturados y calcula métricas de conversión.
4. **Auto-aplicación de Descuento en Carrito**: Captura automática de parámetros UTM (`utm_source=instagram`) en la tienda y aplicación del cupón `BIENVENIDA10`.

---

## 🔑 2. Variables de Entorno (`backend/.env`)

Asegúrate de agregar las siguientes variables en el archivo `backend/.env`:

```env
# URL base del Frontend (para enlaces de producto en el feed y respuestas de DM)
FRONTEND_URL=https://pranamarket.com

# Token de verificación personalizado para la suscripción de Webhooks en Meta
META_WEBHOOK_VERIFY_TOKEN=prana_meta_verify_token_2026

# Token de acceso a la página de Facebook / Instagram Graph API (para envío de respuestas DMs automáticas)
META_PAGE_ACCESS_TOKEN=tu_meta_page_access_token_aqui
```

---

## 🛠️ 3. Configuración en Meta Developer Console

### Paso 3.1: Crear App en Meta Developer Portal
1. Ingresa a [Meta for Developers](https://developers.facebook.com/).
2. Crea una nueva aplicación seleccionando el tipo **Business / Negocios**.
3. Asocia la App a la **Página de Facebook** y a la **Cuenta de Instagram Profesional** de Prana Market.

### Paso 3.2: Configurar el Webhook de Instagram
1. En el panel de la App en Meta, agrega el producto **Webhooks**.
2. Selecciona el objeto **Instagram**.
3. Haz clic en **Suscribirse a este objeto**:
   - **URL de Verificación (Callback URL)**: `https://<tu-dominio-backend>/api/social-leads/webhook`
   - **Token de Verificación (Verify Token)**: `prana_meta_verify_token_2026` (o el valor definido en `META_WEBHOOK_VERIFY_TOKEN`).
4. Al guardar, Meta enviará una solicitud `GET` al backend. El backend responderá automáticamente con el `hub.challenge` para validar la conexión.
5. Suscríbete a los siguientes campos de eventos:
   - `messages` (Mensajes Directos de Instagram)
   - `comments` (Comentarios en publicaciones de Instagram)
   - `mentions` (Menciones en Stories y Posts)

---

## 🛍️ 4. Configuración en Meta Commerce Manager (Instagram Shopping)

Para habilitar el etiquetado de productos en posts y reels de Instagram:

1. Ingresa a [Meta Commerce Manager](https://commerce.facebook.com/).
2. Selecciona tu Catálogo de Productos o crea uno nuevo de tipo **E-commerce**.
3. Ve a **Orígenes de Datos (Data Sources)** > **Agregar Productos** > **Data Feed Programado (Scheduled Feed)**.
4. Ingresa la URL del feed XML generado por Strapi:
   `https://<tu-dominio-backend>/api/catalog/instagram-feed.xml`
5. Configura el intervalo de actualización (ej. **Diario** o **Cada 6 horas**).
6. Configura la divisa base en **COP (Pesos Colombianos)**.
7. Al guardar, Meta importará automáticamente todos los productos activos con sus imágenes, precios y enlaces formateados con `utm_source=instagram`.

---

## 📊 5. Captura de Leads y Analítica en Strapi CMS

Cada interacción en Instagram (DM o Comentario) crea automáticamente un registro en la colección `Social Lead` de Strapi CMS:

* **Colección**: `api::social-lead.social-lead`
* **Campos registrados**:
  - `instagram_username`: Nombre de usuario de IG.
  - `source_channel`: `instagram_dm`, `instagram_comment` o `social_landing`.
  - `discount_code_issued`: `BIENVENIDA10`.
  - `converted_to_customer`: Estado de conversión (`true`/`false`).
  - `message_content`: Texto del mensaje o comentario.
  - `meta_sender_id`: ID numérico del remitente en Meta.

### Consultar Métricas de Conversión
Puedes obtener el resumen de analítica consumiendo la API:
```bash
GET https://<tu-dominio-backend>/api/social-leads/analytics
```

---

## 🛒 6. Flujo del Cliente en el Frontend (Storefront)

Cuando un usuario hace clic en una publicación o DM de Instagram:
1. El enlace incluye el parámetro tracking `utm_source=instagram` o `promo=BIENVENIDA10`.
2. El contexto global del carrito (`CartContext.tsx`) detecta la visita desde Instagram.
3. Se pre-aplica automáticamente el cupón **`BIENVENIDA10`** al carrito.
4. El usuario obtiene inmediatamente un **10% de descuento** en su compra.

---

## 🧪 7. Guía de Pruebas y Verificación

### Verificación Automática (Script Node.js)
En el entorno local o de CI/CD, ejecuta:
```bash
cd backend
node ./scripts/verify-epic7.js
```

### Comandos cURL para Pruebas Manuales

#### 1. Probar Feed XML
```bash
curl -X GET http://localhost:1337/api/catalog/instagram-feed.xml
```

#### 2. Probar Handshake del Webhook
```bash
curl "http://localhost:1337/api/social-leads/webhook?hub.mode=subscribe&hub.verify_token=prana_meta_verify_token_2026&hub.challenge=TEST_123"
```

#### 3. Simular Recepción de DM de Instagram
```bash
curl -X POST http://localhost:1337/api/social-leads/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "object": "instagram",
    "entry": [{
      "id": "17841400000000000",
      "messaging": [{
        "sender": { "id": "987654321" },
        "message": { "text": "Hola, ¿cuánto cuesta el envío a Bogotá?" }
      }]
    }]
  }'
```

#### 4. Consultar Métricas de Analítica
```bash
curl http://localhost:1337/api/social-leads/analytics
```
