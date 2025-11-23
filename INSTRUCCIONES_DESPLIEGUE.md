# Guía de Despliegue Local - Barbería Sparta

Este documento detalla los pasos para ejecutar el proyecto localmente en tu máquina.

## Prerrequisitos

1.  **Node.js**: Asegúrate de tener instalado Node.js (versión 20 o superior recomendada).
    *   Verifica con: `node -v`
2.  **Git**: Para clonar el repositorio (si no lo has hecho).

## Estructura del Proyecto

El proyecto es una aplicación Full Stack con:
*   **Frontend**: React + Vite (en la carpeta `client`)
*   **Backend**: Express (en la carpeta `server`)
*   **Base de Datos**: SQLite (gestionada con Prisma)

## Pasos para la Instalación

### 1. Instalar Dependencias

Abre una terminal en la carpeta raíz del proyecto y ejecuta:

```bash
npm install
```

### 2. Configurar la Base de Datos

El proyecto utiliza SQLite, por lo que no necesitas instalar un servidor de base de datos externo. Solo necesitas inicializar el archivo de base de datos.

Ejecuta los siguientes comandos en orden:

Generar el cliente de Prisma:
```bash
npx prisma generate
```

Crear la base de datos y aplicar migraciones:
```bash
npx prisma migrate dev --name init
```

(Opcional) Cargar datos de prueba (semilla):
```bash
npx tsx prisma/seed.ts
```

### 3. Ejecutar la Aplicación

Para iniciar el servidor de desarrollo (que inicia tanto el backend como el frontend):

```bash
npm run dev
```

La aplicación debería estar disponible en `http://localhost:5000`.

## Solución de Problemas Comunes

### Error con plugins de Replit
Si encuentras errores relacionados con `@replit/vite-plugin-...` al iniciar, edita el archivo `vite.config.ts` y elimina o comenta las líneas que importan estos plugins. El proyecto está configurado para ignorarlos si no está en Replit, pero a veces pueden causar conflictos.

### Puerto ocupado
Si el puerto 5000 está ocupado, puedes cambiarlo en el archivo `.env` modificando la variable `PORT`.

### Base de datos no encontrada
Asegúrate de que la carpeta `data` exista en la raíz del proyecto. Prisma debería crearla automáticamente, pero si tienes problemas, créala manualmente.
