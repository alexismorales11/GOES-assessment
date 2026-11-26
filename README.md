# Catálogo de Productos UPC

Prueba técnica full-stack: **NestJS** (API) · **Next.js** (Front) · **PostgreSQL**.

```
api/    API NestJS + TypeORM (migraciones y carga inicial)
web/    Front Next.js (pendiente)
data/   productos.csv para la carga inicial
ia/     Documentación del uso de IA
```

## Requisitos

- Node.js **22 LTS** (versión exacta en [`.nvmrc`](.nvmrc)) y npm. `api/package.json` declara `"engines": { "node": ">=22.0.0 <23.0.0" }` y `api/.npmrc` activa `engine-strict`, por lo que **`npm install` falla con `EBADENGINE`** si se usa otra versión de Node.
- Docker Desktop (o Docker Engine + Compose v2)

Con nvm-windows (la versión 1.2.2 **no** lee `.nvmrc` automáticamente):

```powershell
nvm install (Get-Content .nvmrc)
nvm use (Get-Content .nvmrc)
```

Con nvm en Linux/macOS: `nvm install && nvm use`.

## 1. Levantar la base de datos

```bash
cp .env.example .env
docker compose up -d
docker compose ps          # el servicio "db" debe aparecer como (healthy)
```

## 2. Instalar dependencias de la API

```bash
cd api
cp .env.example .env
npm install
```

## 3. Carga inicial

```bash
cd api
npm run seed
```

Un solo comando que:

1. Compila la API y **aplica las migraciones pendientes** (crea el esquema si la BD está vacía).
2. Lee y valida `data/productos.csv`. Si alguna fila es inválida, la carga se aborta completa y se listan los errores por línea.
3. Inserta Categorías, SubCategorías, Productos y los usuarios de prueba en **una sola transacción**.
4. Muestra un resumen:

```
┌───────────────┬──────────┬───────┐
│ (index)       │ inserted │ total │
├───────────────┼──────────┼───────┤
│ Categorías    │ 5        │ 5     │
│ SubCategorías │ 17       │ 17    │
│ Productos     │ 100      │ 100   │
│ Usuarios      │ 2        │ 2     │
└───────────────┴──────────┴───────┘
```

`inserted` = registros creados en esta ejecución; `total` = registros en la BD.
La carga se puede ejecutar varias veces: en la segunda ejecución `inserted` es 0 y no se duplica nada.

### Migraciones (TypeORM)

| Comando (dentro de `api/`) | Descripción |
|---|---|
| `npm run migration:run` | Aplica las migraciones pendientes |
| `npm run migration:show` | Lista migraciones aplicadas / pendientes |
| `npm run migration:revert` | Revierte la última migración |
| `npm run migration:generate -- src/database/migrations/<Nombre>` | Genera una migración a partir de los cambios en las entidades |

Los comandos compilan primero y ejecutan el CLI de TypeORM sobre `dist/` (el proyecto es ESM).

### Reiniciar desde cero

```bash
docker compose down -v     # elimina el contenedor y los datos
docker compose up -d
cd api && npm run seed
```

## Variables de entorno

Cada parte tiene su propio `.env` (ninguno se versiona; solo los `.env.example`):

| Archivo | Variable | Uso |
|---|---|---|
| `.env` (raíz) | `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_PORT` | Contenedor de PostgreSQL (docker-compose) |
| `api/.env` | `PORT` | Puerto de la API (3000) |
| `api/.env` | `DATABASE_URL` | Conexión de la API, migraciones y seed. Debe coincidir con las credenciales del `.env` de la raíz |
| `api/.env` | `JWT_SECRET`, `JWT_EXPIRES_IN` | Autenticación (pendiente) |
| `api/.env` | `SEED_CSV_PATH` | Opcional. Ruta al CSV, relativa a `api/`. Por defecto `../data/productos.csv` |

La API busca `api/.env` a partir de su propia ubicación, así que los comandos funcionan desde cualquier directorio. Las variables ya definidas en el entorno (por ejemplo, por docker-compose) tienen prioridad sobre el archivo.

## Credenciales de prueba

Creadas por `npm run seed` (contraseñas almacenadas con hash bcrypt):

| Usuario | Contraseña |
|---|---|
| admin@prueba.local | Admin123! |
| manager@prueba.local | Manager123! |

## Pruebas

```bash
cd api
npm test
```

## Supuestos y decisiones

- **Un repositorio con carpetas `api/`, `web/` e `ia/`**, sin herramientas de monorepo: el enunciado pide un único repositorio, `ia/` en la raíz y un `docker-compose.yml` que levante todo.
- **Un `.env` por parte** (raíz para Docker, `api/.env` para la API): cada proyecto es independiente y se puede construir por separado; a cambio, las credenciales de la BD aparecen en ambos.
- **TypeORM** como ORM por su integración con NestJS (`@nestjs/typeorm`). `synchronize` desactivado: el esquema solo cambia con migraciones.
- **Carga inicial como comando (`npm run seed`)** y no como endpoint, para no exponer por HTTP una operación que modifica datos masivamente. Se ejecuta como contexto standalone de Nest reutilizando la misma configuración de TypeORM que la API.
- **Idempotencia con `ON CONFLICT DO NOTHING`**: una segunda carga no duplica ni sobrescribe registros, por lo que respeta los cambios hechos desde la aplicación.
- **Nombre de Categorías y SubCategorías vacío (`null`)**: el CSV solo trae códigos. No se inventan nombres; la columna existe y acepta valores para cuando el negocio los defina.
- **Producto → SubCategoría → Categoría**: el producto guarda solo su SubCategoría; la Categoría se obtiene por relación, así un producto no puede quedar con una combinación inconsistente.
- **Se conserva el `Id` del CSV** como Id del producto; la identidad se ajusta después de la carga para que los nuevos productos continúen a partir del Id más alto.
- **Hash de contraseñas con `bcryptjs`** (bcrypt en JavaScript puro): se instala igual en cualquier sistema sin compilar código nativo. Se evaluó argon2 (verificado en Windows y Alpine), pero se descartó porque no trae binarios para macOS Intel ni Windows ARM y ahí requeriría herramientas de compilación.
- **Fechas en `timestamptz`** (UTC), tal como vienen en el CSV.
- **Auditoría siempre completa**: al crear un producto, `UpdatedDate`/`ModifiedBy` se llenan con los mismos valores que `DateAdded`/`AddedBy` (igual que en el CSV, donde todos los registros traen ambos). Por eso las cuatro columnas son `NOT NULL`.
- **`UpcDescription` es opcional**: las reglas de negocio solo marcan como obligatorios `UpcCode`, `CategoryCode` y `SubCategoryCode`.
- **NestJS 12 genera el proyecto como ESM y con Vitest**; se cambió a **Jest** porque el enunciado (HU-E3) lo pide explícitamente. Se eliminó `@nestjs/observe` (telemetría externa no requerida).
