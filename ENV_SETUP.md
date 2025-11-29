# Configuración de Variables de Entorno

## ⚠️ IMPORTANTE: Actualizar .env

El archivo `.env` ahora está protegido por `.gitignore` (como debe ser). 

### Para desarrollo local:

1. **Generar SESSION_SECRET seguro:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   
2. **Actualizar tu archivo `.env` local:**
   ```env
   SESSION_SECRET=<el-valor-generado-arriba>
   PORT=5000
   NODE_ENV=development
   DATABASE_URL="postgresql://postgres:dev123@localhost:5432/sparta_barber?schema=public"
   ```

3. **Instalar PostgreSQL localmente:**
   
   **Opción A - Con Docker (recomendado):**
   ```bash
   docker run --name postgres-dev -e POSTGRES_PASSWORD=dev123 -e POSTGRES_DB=sparta_barber -p 5432:5432 -d postgres:15
   ```
   
   **Opción B - Instalación directa:**
   - Windows: Descargar de [postgresql.org](https://www.postgresql.org/download/windows/)
   - Crear base de datos: `sparta_barber`
   - Usuario: `postgres`
   - Contraseña: `dev123` (o la que prefieras)

4. **Ejecutar migraciones:**
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   npx tsx prisma/seed.ts
   ```

### Para producción (Render):

Las variables de entorno se configuran en el dashboard de Render. Ver `DEPLOYMENT_GUIDE.md` para instrucciones detalladas.

## ✅ Cambios Realizados

- ✅ `.gitignore` actualizado para proteger `.env`
- ✅ `.env.example` creado con documentación completa
- ✅ Base de datos migrada de SQLite a PostgreSQL
- ✅ Índices agregados para mejor rendimiento
- ✅ Helmet middleware para seguridad HTTP
- ✅ Health check endpoint: `/api/health`
- ✅ Configuración de Render lista: `render.yaml`
- ✅ Guía de despliegue completa: `DEPLOYMENT_GUIDE.md`
