# Migración Manual de Datos

## Problema Detectado

Hay archivos bloqueados por procesos de Node.js. Necesitamos cerrar la aplicación primero.

## Pasos para Migrar Datos

### 1. Cerrar todos los procesos de Node.js

**Opción A - Cerrar terminal:**
- Cierra TODAS las terminales que tengas abiertas
- Esto cerrará cualquier proceso de `npm run dev` que esté corriendo

**Opción B - Matar procesos manualmente:**
```powershell
# En PowerShell como Administrador:
Get-Process node | Stop-Process -Force
```

### 2. Verificar que PostgreSQL está corriendo

```bash
# Si usas Docker:
docker ps | grep postgres

# Si no está corriendo:
docker start postgres-dev

# O iniciar nuevo contenedor:
docker run --name postgres-dev -e POSTGRES_PASSWORD=dev123 -e POSTGRES_DB=sparta_barber -p 5432:5432 -d postgres:15
```

### 3. Verificar tu archivo .env

Asegúrate de que `.env` tenga:
```env
DATABASE_URL="postgresql://postgres:dev123@localhost:5432/sparta_barber?schema=public"
```

### 4. Crear las tablas en PostgreSQL

```bash
npx prisma generate
npx prisma db push
```

### 5. Ejecutar el script de migración

```bash
npx tsx scripts/migrate-simple.ts
```

Si sigue fallando, prueba:
```bash
node --loader tsx scripts/migrate-simple.ts
```

### 6. Verificar los datos

```bash
npx prisma studio
```

---

## Alternativa: Migración Manual Paso a Paso

Si el script automático no funciona, puedo ayudarte a migrar los datos manualmente:

1. **Exportar datos de SQLite a JSON**
2. **Importar JSON a PostgreSQL**

¿Quieres que te ayude con esta alternativa?

---

## ⚠️ Checklist Antes de Migrar

- [ ] Todas las terminales cerradas
- [ ] PostgreSQL corriendo (Docker o instalación local)
- [ ] `.env` configurado con `DATABASE_URL` de PostgreSQL
- [ ] `npx prisma generate` ejecutado sin errores
- [ ] `npx prisma db push` ejecutado sin errores

Una vez completado el checklist, ejecuta:
```bash
npx tsx scripts/migrate-simple.ts
```
