# Guía de Recuperación de Datos

## 🔄 Migrar Datos de SQLite a PostgreSQL

Tu base de datos SQLite original (`data/app.db`) todavía existe y contiene todos tus datos. Este script los transferirá a PostgreSQL.

---

## 📋 Pasos para Recuperar tus Datos

### 1. Verificar que PostgreSQL está corriendo

Asegúrate de que tu base de datos PostgreSQL está activa y la aplicación puede conectarse.

```bash
# Si usas Docker:
docker ps | grep postgres

# Si no está corriendo:
docker start postgres-dev
```

### 2. Crear un schema temporal para SQLite

Necesitamos generar un cliente Prisma que pueda leer SQLite:

```bash
# Hacer backup del schema actual
copy prisma\schema.prisma prisma\schema.postgres.prisma

# Crear schema temporal para SQLite
```

Crea un archivo `prisma/schema.sqlite.prisma` con este contenido:

```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../node_modules/.prisma/client-sqlite"
}

datasource db {
  provider = "sqlite"
  url      = "file:../data/app.db"
}

// Copiar todos los modelos de schema.prisma aquí
// (User, Service, Barber, Client, Appointment, etc.)
```

### 3. Ejecutar el Script de Migración

```bash
# Generar cliente Prisma para SQLite
npx prisma generate --schema=prisma/schema.sqlite.prisma

# Ejecutar script de migración
npx tsx scripts/migrate-data.ts
```

El script mostrará el progreso:
```
🚀 Iniciando migración de datos...

📋 Migrando configuración...
✅ 1 configuración(es) migrada(s)

👥 Migrando usuarios...
✅ 3 usuario(s) migrado(s)

💈 Migrando servicios...
✅ 12 servicio(s) migrado(s)

...

🎉 ¡Migración completada exitosamente!
```

### 4. Verificar los Datos

```bash
# Abrir Prisma Studio para ver los datos
npx prisma studio
```

Deberías ver todos tus datos originales en PostgreSQL.

---

## 🔧 Solución Alternativa: Restaurar SQLite Temporalmente

Si prefieres usar SQLite temporalmente mientras decides:

### Opción A: Volver a SQLite (temporal)

1. **Editar `prisma/schema.prisma`:**
   ```prisma
   datasource db {
     provider = "sqlite"
     url      = "file:../data/app.db"
   }
   ```

2. **Regenerar cliente:**
   ```bash
   npx prisma generate
   ```

3. **Iniciar aplicación:**
   ```bash
   npm run dev
   ```

**NOTA:** Esto es solo temporal. Para producción DEBES usar PostgreSQL.

### Opción B: Usar ambas bases de datos

Puedes mantener SQLite para desarrollo local y PostgreSQL para producción usando variables de entorno.

---

## ⚠️ Importante

- **No borres** `data/app.db` hasta confirmar que la migración fue exitosa
- **Haz backup** de `data/app.db` antes de cualquier cambio
- **PostgreSQL es necesario** para desplegar en Render u otros servicios gratuitos

---

## 🆘 Si algo sale mal

Si el script de migración falla:

1. **Revisa los logs** para ver qué tabla causó el error
2. **Verifica la conexión** a PostgreSQL
3. **Asegúrate** de que las migraciones de Prisma se ejecutaron: `npx prisma migrate deploy`
4. **Intenta de nuevo** - el script usa `upsert` así que es seguro ejecutarlo múltiples veces

---

## 📞 Necesitas ayuda?

Si tienes problemas con la migración, puedo ayudarte a:
- Crear un script personalizado para tu caso específico
- Depurar errores de migración
- Configurar una estrategia de migración por fases
