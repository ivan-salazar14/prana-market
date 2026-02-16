# Guía para ejecutar scripts en Railway

## Opción 1: Railway CLI (Recomendado)

### 1. Instalar Railway CLI (si no lo tienes)

```bash
npm install -g @railway/cli
```

### 2. Autenticarte

```bash
railway login
```

### 3. Vincular tu proyecto

```bash
cd backend
railway link
```

### 4. Ejecutar el script directamente

```bash
railway run node scripts/seed-cities.js
```

### 5. Ejecutar permisos (después de seed)

```bash
railway run node scripts/fix-city-permissions.js
```

---

## Opción 2: Conectarse vía SSH a Railway

### 1. Abrir una shell en el contenedor

```bash
railway shell
```

### 2. Ejecutar el script

```bash
node scripts/seed-cities.js
node scripts/fix-city-permissions.js
```

---

## Opción 3: Agregar comando en package.json

### 1. Editar backend/package.json

Agregar en la sección "scripts":

```json
"seed:cities": "node scripts/seed-cities.js",
"fix:permissions": "node scripts/fix-city-permissions.js"
```

### 2. Ejecutar desde Railway CLI

```bash
railway run npm run seed:cities
railway run npm run fix:permissions
```

---

## Opción 4: Script de despliegue automático

Crear un script que se ejecute después del deploy:

### 1. Crear backend/scripts/post-deploy.js

```javascript
const { execSync } = require('child_process');

console.log('🚀 Running post-deployment tasks...');

try {
  console.log('📦 Seeding cities...');
  execSync('node scripts/seed-cities.js', { stdio: 'inherit' });
  
  console.log('🔐 Fixing permissions...');
  execSync('node scripts/fix-city-permissions.js', { stdio: 'inherit' });
  
  console.log('✅ Post-deployment completed!');
} catch (error) {
  console.error('❌ Post-deployment failed:', error);
  process.exit(1);
}
```

### 2. Agregar a package.json

```json
"scripts": {
  "postdeploy": "node scripts/post-deploy.js"
}
```

### 3. Configurar en Railway

En Railway Dashboard → Settings → Deploy → Build Command:

```
npm run build && npm run postdeploy
```

---

## Notas Importantes

- ⚠️ El script solo necesita ejecutarse **UNA VEZ** después del deploy inicial
- ⚠️ Si ya tienes ciudades en la BD, el script puede crear duplicados
- ✅ Verifica que la variable `DATABASE_URL` esté configurada en Railway
- ✅ El script tardará ~2-3 minutos en importar las 1,123 ciudades
