# Sesión 01 — Análisis del paquete y preparación del entorno

Herramienta: Claude Code · Modelo: Claude Opus 5.5 · Fecha: 2026-11-26

## Prompts (textuales)

1. `/goal analiza la siguiente carpete @../../paquete_candidato/`
2. > Necesito que nunca asumas nada. 1. ya instale Docker desktop. 2. Para que necesitas Python? 3. Necesito que se use Node JS 20 o 22LTS. Por que un monorepo?
3. > 1. Ya reinicie la terminal. 2. OK. 3. Prefiero la instalación de nvm-windows con el .nvmrc en el repositorio 4. Estoy de acuerdo, solo me que me gustaria debatir con tus sugerencias el nombre de las carpetas para el frontend y el backend. Ya cree el repo con github desktop y lo publique en github como repo publico. De lo contrario si no tienes dudas me gustaria que iniciemos. Recuerda nunca asumir nada y siempre consultar cualquier duda que tengas
4. > Listo, 5 pasos realizados

## Extractos relevantes de la respuesta de la IA

### Análisis del CSV (`data/productos.csv`)
Validado con un script de Node:
- 100 filas, UTF-8 sin BOM, CRLF, sin comillas. `Id` 1–100 sin duplicados.
- 100 UPC únicos, 12 dígitos y **dígito verificador válido** en todos.
- 5 categorías (BEB 34, LAC 26, SNK 16, LIM 14, PAN 10) y 17 subcategorías; toda subcategoría tiene el prefijo de su categoría y ninguna pertenece a dos categorías.
- Fechas ISO 8601 UTC válidas; `UpdatedDate >= DateAdded` siempre; sin campos vacíos ni espacios sobrantes.
- **Hallazgo:** el CSV no trae nombre de Categoría/SubCategoría, solo códigos → decisión pendiente a documentar en "Supuestos y decisiones".

### Observación de pesos de evaluación
30 % de la nota (commits 15 % + carpeta `ia/` 15 %) no depende del código → commits pequeños desde el inicio y registro de prompts durante el trabajo.

### Preparación del entorno (pasos ejecutados por mí, fuera de la sesión)
```powershell
winget uninstall --id OpenJS.NodeJS.24 -e
winget install --id CoreyButler.NVMforWindows -e
nvm install 22
nvm use 22.23.5
npm install -g @anthropic-ai/claude-code
```
Verificado después por la IA: nvm 1.2.2, Node v22.23.5, npm 10.9.9, `C:\Program Files\nodejs` eliminado.

### Prueba de `.nvmrc` con nvm-windows
```
> nvm use        # en carpeta con .nvmrc = 22.23.5
activation error: A version argument is required but missing.
```
Conclusión: usar `nvm use (Get-Content .nvmrc)` en Windows.
