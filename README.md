# Sellers BNA, Macro y demás tiendas

Aplicación React/Vite para visualizar y editar la información de sellers separada por marca: BNA, Macro y demás tiendas.

## Funcionalidades

- Selección por marca: BNA / Macro.
- Listado de sellers con buscador.
- Un click sobre un seller muestra toda su información.
- Todos los campos son editables.
- Guardado local automático en el navegador.
- Alta y eliminación de sellers.
- Exportación e importación de datos en JSON.
- Restauración de datos originales del Excel.

## Ejecutar localmente

```bash
npm install
npm run dev
```

## Publicar en Vercel

1. Subí esta carpeta a un repositorio de GitHub.
2. En Vercel, elegí **Add New Project**.
3. Importá el repo.
4. Vercel detectará Vite automáticamente.
5. Build command: `npm run build`.
6. Output directory: `dist`.

## Importante

Los datos iniciales vienen del archivo Excel original y quedan embebidos en `src/data.js`. Los cambios que haga cada usuario se guardan localmente en su navegador mediante `localStorage`.


## Tiendas incluidas
- BNA: 346 sellers
- Macro: 163 sellers
- Comafi: 43 sellers
- Ciudad: 43 sellers
- MasBanco: 44 sellers
