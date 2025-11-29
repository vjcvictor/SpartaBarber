# 🔄 Recuperación Rápida de Datos

## Opción 1: Migrar Datos a PostgreSQL (Recomendado para Producción)

### Paso 1: Instalar dependencia
```bash
npm install better-sqlite3 @types/better-sqlite3 --save-dev
```

### Paso 2: Ejecutar migración
```bash
npx tsx scripts/migrate-simple.ts
```

Verás algo como:
```
🚀 Iniciando migración de SQLite a PostgreSQL...

📋 Migrando configuración...
✅ 1 configuración(es)

👥 Migrando usuarios...
✅ 3 usuario(s)

💈 Migrando servicios...
✅ 12 servicio(s)

✂️ Migrando barberos...
✅ 2 barbero(s)

👤 Migrando clientes...
✅ 15 cliente(s)

📅 Migrando citas...
✅ 25 cita(s)

🎉 ¡Migración completada!
```

### Paso 3: Verificar
```bash
npx prisma studio
```

---

## Opción 2: Volver a SQLite Temporalmente (Más Rápido)

Si solo quieres que funcione YA mientras decides sobre PostgreSQL:

### Paso 1: Editar `prisma/schema.prisma`

Cambia estas líneas:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Por:

```prisma
datasource db {
  provider = "sqlite"
  url      = "file:../data/app.db"
}
```

### Paso 2: Regenerar Prisma
```bash
npx prisma generate
```

### Paso 3: Iniciar aplicación
```bash
npm run dev
```

**✅ Tu aplicación volverá a funcionar exactamente como antes con todos tus datos.**

---

## ⚠️ Importante

- **SQLite funciona** para desarrollo local
- **PostgreSQL es NECESARIO** para desplegar en Render/Railway/Heroku
- **No perderás datos** - tu archivo `data/app.db` sigue intacto

---

## 🤔 ¿Qué opción elegir?

| Situación | Recomendación |
|-----------|---------------|
| Solo quiero que funcione ahora | **Opción 2** (volver a SQLite) |
| Voy a desplegar pronto | **Opción 1** (migrar a PostgreSQL) |
| Desarrollo local solamente | **Opción 2** (SQLite está bien) |
| Necesito producción | **Opción 1** (PostgreSQL obligatorio) |

---

## 💡 Mi Recomendación

1. **Ahora**: Usa Opción 2 para volver a trabajar inmediatamente
2. **Cuando estés listo para desplegar**: Ejecuta Opción 1 para migrar a PostgreSQL
3. **Mantén backup**: No borres `data/app.db` hasta confirmar que todo funciona

---

## 🆘 ¿Necesitas ayuda?

Si tienes problemas, dime:
- ¿Qué opción prefieres?
- ¿Cuándo planeas desplegar?
- ¿Algún error que veas?
