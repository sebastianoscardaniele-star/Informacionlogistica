# Sellers App - Vite con deploy rápido en Vercel

Este ZIP incluye el proyecto Vite y también la carpeta `dist` ya compilada.

## Configuración recomendada en Vercel

- Framework Preset: Other
- Install Command: `echo skip install`
- Build Command: `echo using prebuilt dist`
- Output Directory: `dist`

El archivo `vercel.json` ya trae esa configuración, para evitar que Vercel quede trabado en `npm install` o `npm ci`.

## Para editar localmente

```bash
npm install
npm run dev
```

Para regenerar el build local:

```bash
npm run build
```

## Funcionalidades

- Tiendas separadas por solapa: BNA, Macro y demás tiendas cargadas.
- Estado editable con desplegable.
- Datos del seller editables.
- Operadores logísticos con checks editables.
- Forma de envío editable.
- Configuración logística editable.
- Datos de depósito editables.
- Direcciones de retiro por sucursal editables.
- Exportación a XLSX desde el navegador.
