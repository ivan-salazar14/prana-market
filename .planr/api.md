# API Endpoints for Cryptocurrency Trading Service

## Endpoints Implementados

### Market Data
- **POST /market-data/fetch**: Obtiene y almacena datos de mercado actuales de Binance.
- **POST /market-data/populate-historical**: Pobla la base de datos con datos OHLCV históricos de Binance para backtesting y análisis.

### Señales
- **POST /signals/generate**: Genera señales de trading basadas en los indicadores técnicos almacenados. **Integrado con US-040, US-041, US-042** - genera señales para cada estrategia activa del usuario y guarda explícitamente la estrategia que produjo cada señal.

### Backtesting
- **POST /backtest/run**: Ejecuta el backtesting de la estrategia sobre datos históricos almacenados.
- **GET /backtest/signals**: Consulta las señales generadas por el backtesting para un símbolo, timeframe y rango de fechas.

## Seguridad y Autenticación
- Todos los endpoints anteriores requieren autenticación JWT (Bearer Token) en el header `Authorization`.
- Los endpoints públicos (registro y login) NO están implementados en este servicio.

## Estructura del Token JWT (US-040)

El token JWT incluye las estrategias activas del usuario:

```json
{
  "sub": "user_id",
  "email": "user@example.com",
  "active_strategies": ["moderate", "conservative"],
  "subscription_plan": "premium",
  "is_active": true,
  "exp": 1234567890
}
```

### Campos del Token:
- **sub**: ID del usuario
- **email**: Email del usuario
- **active_strategies**: Lista de estrategias activas del usuario (conservative, moderate, aggressive)
- **subscription_plan**: Plan de suscripción del usuario (basic, premium, etc.)
- **is_active**: Estado de activación del usuario
- **exp**: Timestamp de expiración

### Validaciones de Estrategias:
- Se valida que el usuario tenga al menos una estrategia activa
- Solo se aceptan estrategias válidas: "conservative", "moderate", "aggressive"
- Si el usuario no tiene estrategias activas, se retorna error 403

## Implementation Notes
- **JWT**: Todos los endpoints están protegidos con middleware de autenticación JWT. Se debe enviar un token válido en cada request.
- **Estrategias Activas (US-040)**: El endpoint `/signals/generate` ahora filtra por las estrategias activas del usuario en el token JWT.
- **Upsert de Usuarios (US-041)**: Los usuarios del token JWT se guardan/actualizan automáticamente en la base de datos.
- **Trazabilidad de Estrategias (US-042)**: Cada señal generada incluye explícitamente el `strategy_id` de la estrategia que la produjo.
- **Roles**: Actualmente solo se soporta el rol RegisteredUser para acceso a los endpoints protegidos.
- **Errores**: Los intentos de acceso sin token o con token inválido retornan 401 Unauthorized.
- **Base de datos**: PostgreSQL recomendado para producción.
- **Dependencias**: FastAPI, SQLAlchemy, PyJWT, bcrypt, passlib, email-validator, ccxt, TA-Lib.