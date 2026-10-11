# 💳 Guía de Integración: Medios de Pago en Colombia (Wompi, Nequi & Efectivo)

Esta guía documenta la arquitectura, configuración y procedimiento de integración de pasarelas de pago colombianas en **Prana Market** (Next.js storefront + Strapi CMS), garantizando cumplimiento estricto con los estándares de comercio electrónico y seguridad financiera (PCI-DSS).

---

## 📋 1. Visión General de Medios de Pago

Prana Market soporta un ecosistema de pagos integral adaptado a los hábitos de compra en Colombia:

| Método de Pago | Canal / Procesador | Características Principales | Experiencia de Usuario |
|---|---|---|---|
| **PSE (Pagos Seguros en Línea)** | Wompi Bancolombia | Débito directo desde cuentas de ahorro/corriente de cualquier banco colombiano. | Redirección segura al portal bancario con retorno automático. |
| **Tarjetas Débito / Crédito** | Wompi (PCI-DSS L1) | Visa, Mastercard, American Express. Tokenización segura sin almacenar datos en servidores de Prana. | Formulario seguro Wompi o widget integrado. |
| **Efectivo / Redes Físicas** | Efecty, Baloto, SuRed | Pago en más de 20,000 puntos físicos a nivel nacional. | Generación de comprobante con **PIN de referencia**, convenio y vencimiento a 48h. |
| **Nequi Directo** | Nequi API / Push & QR | Cobro automático a la app móvil mediante notificación push o escaneo de código QR dinámico. | Cuenta regresiva de 60 segundos con polling de estado cada 2 segundos y confeti. |
| **Contra Entrega** | Prana Logistics / Dropi | Pago en efectivo al momento de recibir el producto en domicilio o punto físico. | Confirmación inmediata de orden con instrucciones de cambio exacto. |

---

## 🔑 2. Variables de Entorno

Asegúrate de configurar las siguientes variables de entorno en tus archivos locales de desarrollo y en Railway / Vercel para producción:

### En Frontend (`frontend/.env.local`):
```env
# URL pública de la aplicación
NEXT_PUBLIC_APP_URL=https://pranamarket.store

# Llaves públicas y privadas de Wompi (Colombia)
NEXT_PUBLIC_WOMPI_PUBLIC_KEY=pub_test_V06g78p1b111Cc334455aa6677889900
WOMPI_PUBLIC_KEY=pub_test_V06g78p1b111Cc334455aa6677889900
WOMPI_PRIVATE_KEY=prv_test_V06g78p1b111Cc334455aa6677889900

# Secreto de integridad para firma criptográfica de transacciones
WOMPI_INTEGRITY_SECRET=test_integrity_secret_prana_2026
```

### En Backend (`backend/.env`):
```env
# URL base del storefront
FRONTEND_URL=https://pranamarket.store

# Wompi Gateway Secrets
WOMPI_PUBLIC_KEY=pub_prod_xxxxxxxxxxxxxxxxxxxxxxxx
WOMPI_PRIVATE_KEY=prv_prod_xxxxxxxxxxxxxxxxxxxxxxxx
WOMPI_INTEGRITY_SECRET=prod_integrity_secret_xxxxxxxx

# Stripe Gateway (Respaldo internacional)
STRIPE_SECRET_KEY=sk_prod_xxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 🛠️ 3. Pasos de Configuración en el Portal Wompi

### Paso 3.1: Registro de Comercio en Wompi
1. Ingresa al [Portal de Comercios Wompi](https://comercios.wompi.co/).
2. Completa el registro empresarial o de persona natural con tu RUT y certificación bancaria (Bancolombia o cuenta de otro banco nacional).
3. Accede a la sección **Desarrolladores** > **Llaves de API**.

### Paso 3.2: Obtener Llaves de Sandbox y Producción
Wompi proporciona pares de llaves diferenciadas por entorno:
* **Entorno de Pruebas (Sandbox)**:
  - Llave Pública: Comienza con `pub_test_...`
  - Llave Privada: Comienza con `prv_test_...`
  - Secreto de Integridad: Cadena alfanumérica para generar la firma SHA-256.
* **Entorno de Producción**:
  - Llave Pública: Comienza con `pub_prod_...`
  - Llave Privada: Comienza con `prv_prod_...`
  - Secreto de Integridad: Cadena alfanumérica de producción.

### Paso 3.3: Configurar URLs de Retorno y Webhooks
En el panel de Wompi, define:
* **URL de Redirección (Eventos de usuario)**:
  `https://pranamarket.store/payment/success`
* **URL de Eventos / Webhooks (Eventos del sistema)**:
  `https://backend.pranamarket.store/api/payment/wompi-webhook`

---

## 💻 4. Arquitectura de Implementación en Código

### 4.1 Componente `WompiCheckout.tsx` (`frontend/src/components/WompiCheckout.tsx`)
El componente encapsula la lógica de los 3 métodos principales de Wompi:
* **Pestaña PSE**:
  - Desplegable con los principales bancos colombianos (`Bancolombia`, `Davivienda`, `Banco de Bogotá`, `Nequi`, `BBVA`, `Daviplata`, etc.).
  - Captura del tipo de documento (`CC`, `CE`, `NIT`, `PP`) y número de identificación.
  - Validación de campos requeridos antes del envío.
* **Pestaña Tarjetas**:
  - Información de cumplimiento PCI-DSS Nivel 1.
  - Disparador de transacción que inicia el flujo de checkout seguro en COP.
* **Pestaña Efectivo (Efecty / Baloto)**:
  - Selector de red (`Efecty` con más de 10,000 puntos o `Baloto / SuRed`).
  - Generación de comprobante con **PIN numérico de referencia**, número de convenio oficial y vigencia de 48 horas.
  - Botón de copia al portapapeles (`navigator.clipboard.writeText`) y botón para imprimir o guardar PDF (`window.print()`).

### 4.2 Ruta API Backend (`frontend/src/app/api/wompi/create-transaction/route.ts`)
Controlador HTTP que procesa las solicitudes de pago:
* Valida campos obligatorios (`amount_in_cents`, `currency`, `customer_email`, `reference`).
* Maneja montos exactos en centavos de COP (`Math.round(amount * 100)`).
* En modo desarrollo (`isDevelopment` sin llaves reales), genera transacciones simuladas transparentes para pruebas de equipo y CI/CD.
* En modo producción, se comunica con `https://api.wompi.co/v1/transactions` adjuntando la cabecera `Authorization: Bearer ${WOMPI_PRIVATE_KEY}`.

### 4.3 Integración en Carrito (`frontend/src/components/Cart.tsx`)
El drawer lateral del carrito permite seleccionar entre tres modalidades de pago:
1. `efectivo`: Contra entrega al repartidor o al recoger en tienda.
2. `nequi`: Pago anticipado vía push o QR dinámico.
3. `wompi`: Pasarela integral Wompi (PSE, Tarjetas y Efecty/Baloto).

---

## 🔒 5. Cumplimiento de Seguridad y PCI-DSS

1. **Zero Raw Card Storage**: Los servidores de Prana Market jamás reciben, almacenan ni registran números de tarjetas de crédito o códigos CVV.
2. **Firmas de Integridad HMAC SHA-256**: Todas las transacciones creadas y los webhooks recibidos se validan contra el secreto de integridad:
   $$\text{Firma} = \text{SHA256}(\text{reference} + \text{amount\_in\_cents} + \text{currency} + \text{WOMPI\_INTEGRITY\_SECRET})$$
3. **Idempotencia**: Cada orden tiene un número de referencia único (`PRANA-<timestamp>-<hash>`) para impedir cargos duplicados ante reintentos de red.

---

## 🧪 6. Guía de Pruebas y Verificación

### 6.1 Script de Verificación Automática
Para validar la integridad de la implementación, ejecuta:
```bash
node backend/scripts/verify-story-3-3.js
```
El script comprueba:
- Existencia y exportación del componente `WompiCheckout.tsx`.
- Soporte para bancos colombianos y flujo PSE.
- Soporte para tarjetas y cumplimiento PCI-DSS.
- Generación de vouchers con PIN y convenio para Efecty/Baloto.
- Integración en `Cart.tsx` y en el endpoint `/api/wompi/create-transaction`.
- Ausencia de campos inseguros (`card_number`, `cvv`) en servidores propios.

### 6.2 Datos de Prueba en Sandbox de Wompi

#### Tarjetas de Prueba (Sandbox):
* **Tarjeta Aprobada**: `4242 4242 4242 4242` | Fecha: `12/28` | CVV: `123`
* **Tarjeta Declinada**: `4000 0000 0000 0002` | Fecha: `12/28` | CVV: `123`
* **Tarjeta Fondos Insuficientes**: `4000 0000 0000 0003` | Fecha: `12/28` | CVV: `123`

#### Cuentas PSE de Prueba (Sandbox):
* **Banco**: Selecciona cualquier banco en el desplegable (ej. *Bancolombia* o *Banco de Bogotá*).
* **Documento**: `1020304050`
* En el sandbox de Wompi, podrás simular el estado de aprobación seleccionando **Aprobada** o **Rechazada**.

---

## 🚀 7. Checklist para Paso a Producción

- [ ] Reemplazar las llaves `pub_test_...` y `prv_test_...` por las llaves `pub_prod_...` y `prv_prod_...` en las variables de entorno de producción.
- [ ] Configurar el secreto de integridad de producción `WOMPI_INTEGRITY_SECRET`.
- [ ] Configurar las URLs de webhook en el panel de Wompi apuntando al dominio de producción con HTTPS activo.
- [ ] Realizar una compra real de bajo valor (ej. COP $5.000) con PSE y tarjeta de crédito para verificar el abono en la cuenta bancaria.
- [ ] Verificar que el voucher físico de Efecty genere un PIN legible y que el botón de impresión formatee adecuadamente el documento.
