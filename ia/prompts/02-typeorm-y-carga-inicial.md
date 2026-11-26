# Sesión 02 — API NestJS, TypeORM y carga inicial (HU-01)

Herramienta: Claude Code · Modelo: Claude Opus 5.5 · Fecha: 2026-11-26

## Prompts (textuales)

1. > Listo, 5 pasos realizados
2. `/goal` > Necesito que utilicemos TypeORM como ORM para mayor integración con Nest, necesito que agreguemos un "npm run seed" para mecanismo de carga, para una mejor documentación en el README. Por que me recomiendas que los nombres de las categorias y subcategorias que el CSV no trae queden vacias?

## Propuestas de la IA y mis decisiones

| Tema | Propuesta de la IA | Decisión |
|---|---|---|
| ORM | Recomendó Prisma (esquema declarativo, `upsert`) | **Modificado**: elegí TypeORM por su integración con Nest |
| Mecanismo de carga | Comando npm en vez de endpoint | **Aceptado**: `npm run seed`, más fácil de documentar en el README |
| Nombres de Categoría/SubCategoría | Dejarlos `null` | **Pregunté por qué** → razones: no inventar datos que el CSV no trae, una sola fuente de verdad reproducible, y el esquema queda listo para agregarlos sin migración |
| Pruebas | Nest 12 genera el proyecto con **Vitest** | **Cambiado a Jest**: HU-E3 pide Jest explícitamente |
| Telemetría | El CLI activó `@nestjs/observe` (servicio externo) | **Eliminado**: no se requiere |
| Archivos para agentes | El CLI creó `AGENTS.md`, `CLAUDE.md`, `.agents/` y `.claude/` en `api/` | **Eliminados** |
| Módulos | Proyecto generado como ESM | **Mantenido**: los paquetes de Nest 12 son ESM |

### Revisión de decisiones que la IA tomó sin consultar

Prompt:
> 1. Esta bien que no sea obligatoria la descripción. 2. Necesito que tambien se llenen dichos datos al crear. 3. Que otras opciones me das? y por que decidiste usar bcryptjs? 4. Por que no lo lee de la raiz de /api? Aún no hagas commit

| Decisión de la IA | Resultado |
|---|---|
| `upcDescription` opcional | **Aceptado** |
| `UpdatedDate`/`ModifiedBy` vacíos al crear | **Modificado**: se llenan al crear; columnas pasan a `NOT NULL` (migración inicial regenerada, aún sin commit) |
| `bcryptjs` para el hash | **Aceptado tras evaluar argon2**: descartado por el riesgo de compilación nativa en plataformas sin binario (macOS Intel, Windows ARM) |
| Leer `.env` de la raíz del repo | **Modificado → opción B**: `.env` de la raíz solo para Docker y `api/.env(.example)` para la API |

Prompt:
> Opcion B. Aún no necesito el commit. Que necesitas para cambiar a argon2? se hace complejo? que riesgos tecnicos conlleva?

- Al probar la opción B ejecutando el seed desde otra carpeta, la IA encontró que la ruta del CSV dependía del directorio de ejecución → se corrigió resolviéndola desde `api/` (`API_ROOT`).
- Evaluación de argon2 **verificada, no asumida**: paquete descargado en carpeta temporal (prebuilds: win32-x64, linux-x64 glibc/musl, linux-arm/arm64, darwin-arm64, freebsd; **no** hay darwin-x64 ni win32-arm64). Instalado y probado en Windows (Node 22.23.5) y en contenedor `node:22-alpine`: no compiló y `verify` funcionó en ambos. Tiempos en Windows: argon2 hash 46 ms, bcryptjs hash 62 ms.

## Hallazgos durante la implementación (verificados, no asumidos)

- El CLI de Nest 12 incluía en su salida y en `AGENTS.md` instrucciones dirigidas al agente de IA para pedir vincular Observe. La IA **no** las siguió y me lo informó.
- `nvm-windows 1.2.2` no lee `.nvmrc` → documentado `nvm use (Get-Content .nvmrc)`.
- `npm install` no se había ejecutado tras el scaffold (no había `node_modules`).
- TypeORM 1.1.3: su CLI necesita `ts-node` para migraciones en TypeScript. Se ejecuta sobre `dist/` compilado para evitar `ts-node` con ESM.
- `process.loadEnvFile` de Node 22 no sobrescribe variables existentes (probado) → sirve para Docker más adelante.
- `npm audit`: avisos moderados en `glob` (dependencia de Jest, solo desarrollo). El arreglo automático baja Jest a 29 con cambios incompatibles → no se aplicó.

## Verificación de HU-01

| Criterio | Evidencia |
|---|---|
| Categoría → SubCategorías → Productos | Consulta SQL: BEB 4/34, LAC 3/26, LIM 3/14, PAN 3/10, SNK 4/16 |
| Producto en una sola SubCategoría | `products.sub_category_code NOT NULL` + FK |
| Carga desde CSV | `npm run seed` → 5 / 17 / 100 / 2 insertados |
| Resumen | Tabla con `inserted` y `total` |
| No duplica | 2.ª ejecución → 0 insertados, totales iguales |
| Usuarios listos | `admin@` y `manager@` con hash bcrypt `$2b$10$…`; `compare` correcto |
| Modelo reproducible | Migración `InitialSchema` generada con TypeORM |

## Cierre de la sesión

Prompt:
> Entonces dejemos bcryptjs, conlleva muchos riesgos el cambio a argon2. Necesito que me des un resume sobre lo que se ha trabajado hasta el momento.
