# Guía de Despliegue - Barbería Sparta en Render

Esta guía te llevará paso a paso para publicar tu aplicación en Render.com de forma **GRATUITA**.

## 📋 Requisitos Previos

1. Cuenta en [Render.com](https://render.com) (gratuita)
2. Cuenta en [GitHub](https://github.com) (para conectar el repositorio)
3. Tu código debe estar en un repositorio de Git

---

## 🚀 Paso 1: Preparar el Repositorio

### 1.1 Verificar que .env NO esté en Git

```bash
# Verificar status de Git
git status

# Si .env aparece en la lista, NO lo agregues
# El archivo .gitignore ya está configurado para ignorarlo
```

### 1.2 Generar un SESSION_SECRET seguro

```bash
# En PowerShell (Windows):
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Guarda este valor, lo necesitarás más adelante
```

### 1.3 Subir cambios a GitHub

```bash
git add .
git commit -m "Preparado para despliegue en producción"
git push origin main
```

---

## 🌐 Paso 2: Crear Cuenta en Render

1. Ve a [https://render.com](https://render.com)
2. Haz clic en "Get Started for Free"
3. Regístrate con tu cuenta de GitHub
4. Autoriza a Render para acceder a tus repositorios

---

## 🗄️ Paso 3: Crear Base de Datos PostgreSQL

1. En el dashboard de Render, haz clic en **"New +"** → **"PostgreSQL"**
2. Configura la base de datos:
   - **Name**: `sparta-barber-db`
   - **Database**: `sparta_barber`
   - **User**: `sparta_barber_user`
   - **Region**: Selecciona la más cercana (ej: Oregon)
   - **Plan**: **Free** (1GB de almacenamiento)
3. Haz clic en **"Create Database"**
4. **IMPORTANTE**: Copia la **Internal Database URL** (la necesitarás en el siguiente paso)
   - Se ve así: `postgresql://user:password@host:5432/database`

---

## 🌍 Paso 4: Crear Web Service

1. En el dashboard, haz clic en **"New +"** → **"Web Service"**
2. Conecta tu repositorio de GitHub:
   - Selecciona tu repositorio `SpartaBarber`
   - Haz clic en **"Connect"**
3. Configura el servicio:
   - **Name**: `sparta-barber` (o el nombre que prefieras)
   - **Region**: Misma que la base de datos
   - **Branch**: `main`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: **Free**

---

## 🔐 Paso 5: Configurar Variables de Entorno

En la sección **"Environment Variables"**, agrega las siguientes variables:

### Variables Obligatorias:

| Variable | Valor |
|----------|-------|
| `NODE_ENV` | `production` |
| `SESSION_SECRET` | El valor generado en el Paso 1.2 |
| `DATABASE_URL` | La Internal Database URL del Paso 3 |
| `PORT` | `10000` |

### Variables Opcionales (para funcionalidades avanzadas):

| Variable | Descripción |
|----------|-------------|
| `SMTP_HOST` | Servidor SMTP para emails (ej: smtp.gmail.com) |
| `SMTP_PORT` | Puerto SMTP (ej: 587) |
| `SMTP_USER` | Usuario SMTP |
| `SMTP_PASS` | Contraseña SMTP |
| `SMTP_FROM` | Email remitente |
| `SMTP_ENABLED` | `true` o `false` |
| `WHATSAPP_TOKEN` | Token de WhatsApp Business API |
| `WHATSAPP_PHONE_NUMBER_ID` | ID del número de WhatsApp |
| `VAPID_PUBLIC_KEY` | Clave pública para notificaciones push |
| `VAPID_PRIVATE_KEY` | Clave privada para notificaciones push |

---

## 🗃️ Paso 6: Ejecutar Migraciones de Base de Datos

Una vez que el servicio esté desplegado:

1. Ve a tu Web Service en Render
2. Haz clic en **"Shell"** (en el menú lateral)
3. Ejecuta los siguientes comandos:

```bash
# Generar el cliente de Prisma
npx prisma generate

# Ejecutar migraciones
npx prisma migrate deploy

# Cargar datos iniciales (opcional)
npx tsx prisma/seed.ts
```

---

## ✅ Paso 7: Verificar el Despliegue

1. Render te dará una URL como: `https://sparta-barber.onrender.com`
2. Abre la URL en tu navegador
3. Verifica que la aplicación cargue correctamente
4. Prueba el endpoint de salud: `https://sparta-barber.onrender.com/api/health`
   - Deberías ver: `{"status":"ok","timestamp":"...","uptime":...}`

---

## 🔧 Solución de Problemas

### Error: "Application failed to respond"

- Verifica que `PORT=10000` esté en las variables de entorno
- Revisa los logs en Render: **"Logs"** en el menú lateral

### Error: "Prisma Client could not connect to database"

- Verifica que `DATABASE_URL` esté correctamente configurada
- Asegúrate de usar la **Internal Database URL**, no la External

### Error: "SESSION_SECRET is required"

- Verifica que `SESSION_SECRET` esté configurado en las variables de entorno
- Debe tener al menos 32 caracteres

### La aplicación se reinicia constantemente

- Revisa los logs para ver el error específico
- Verifica que todas las dependencias estén en `package.json`
- Asegúrate de que el build se completó correctamente

---

## 🔄 Actualizaciones Futuras

Cada vez que hagas cambios en tu código:

1. Haz commit y push a GitHub:
   ```bash
   git add .
   git commit -m "Descripción de cambios"
   git push origin main
   ```

2. Render detectará los cambios automáticamente y redesplegará la aplicación

---

## 💰 Límites del Plan Gratuito

- **Web Service**: 750 horas/mes (suficiente para 24/7)
- **PostgreSQL**: 1GB de almacenamiento, 1 millón de filas
- **Inactividad**: El servicio se suspende después de 15 minutos sin tráfico
  - Se reactiva automáticamente cuando alguien visita la URL (tarda ~30 segundos)

---

## 🎯 Alternativas de Hosting Gratuito

Si Render no funciona para ti, aquí hay otras opciones:

### Railway.app
- Similar a Render
- 500 horas gratuitas/mes
- PostgreSQL incluido
- [https://railway.app](https://railway.app)

### Vercel (solo para frontend)
- Excelente para el frontend
- Necesitarías otro servicio para el backend
- [https://vercel.com](https://vercel.com)

### Heroku (con limitaciones)
- Requiere tarjeta de crédito (no cobra)
- PostgreSQL gratuito limitado
- [https://heroku.com](https://heroku.com)

---

## 📞 Soporte

Si tienes problemas:

1. Revisa los logs en Render
2. Verifica que todas las variables de entorno estén configuradas
3. Asegúrate de que el código funciona localmente primero
4. Consulta la documentación de Render: [https://render.com/docs](https://render.com/docs)

---

## ✨ ¡Listo!

Tu aplicación de Barbería Sparta ahora está en producción y accesible desde cualquier lugar del mundo. 🎉

**URL de tu aplicación**: `https://[tu-nombre-de-servicio].onrender.com`
