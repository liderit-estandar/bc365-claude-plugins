# bc365-claude-plugins

Marketplace de plugins de Claude Code de LiderIT para desarrollo en Microsoft
Dynamics 365 Business Central (AL).

## Plugin `bc365-liderit`

Habilita el MCP [BC Code Intelligence](https://github.com/JeremyVyska/bc-code-intelligence-mcp)
y activa automáticamente las normas de codificación de LiderIT en cualquier
proyecto BC / AL.

Incluye las skills `bc365-normas`, `al-style-naming`, `al-performance`,
`al-error-handling`, `al-events` y `al-testing`.

## Instalación

### 1. Preinstalar el servidor MCP (importante)

```bash
npm i -g bc-code-intelligence-mcp@1.7.6
```

**No te saltes este paso.** El paquete son 18 MB y más de 12.000 ficheros: si el
plugin tiene que descargarlo con `npx` en el primer arranque, tarda unos 100
segundos y Claude Code corta la conexión a los 30 s con el error:

```
MCP server "plugin:bc365-liderit:bc-code-intel" connection timed out after 30000ms
```

Con el paquete preinstalado el servidor arranca en ~4 s. La versión debe ser
exactamente la que fija el plugin (`1.7.6`); el lanzador la comprueba y, si no
coincide, vuelve a caer en `npx` con el consiguiente riesgo de timeout.

Requisitos: Node.js 18 o superior con `npm` en el PATH.

### 2. Añadir el marketplace e instalar el plugin

En una sesión de Claude Code:

```
/plugin marketplace add https://github.com/liderit-estandar/bc365-claude-plugins.git
/plugin install bc365-liderit@liderit-marketplace
```

Se usa la URL HTTPS completa a propósito: el atajo `liderit-estandar/bc365-claude-plugins`
clona por SSH por defecto y fallaría en máquinas sin clave SSH configurada.

Reinicia la sesión y comprueba con `/mcp` que `bc-code-intel` aparece como
conectado.

## Si sigue dando timeout

- Verifica que la versión instalada es la correcta: `npm ls -g bc-code-intelligence-mcp`.
- Sube el margen de espera de Claude Code añadiendo a tu `settings.json`:
  `"env": { "MCP_TIMEOUT": "120000" }`.
- Máquinas con antivirus corporativo o proxy npm lento: el primer `npm i -g`
  puede tardar varios minutos, pero se hace una sola vez.

## Actualizar la versión del MCP

1. Sube `VERSION` en [`bc365-plugin/scripts/bc-code-intel-launcher.cjs`](bc365-plugin/scripts/bc-code-intel-launcher.cjs).
2. Sube `version` en [`bc365-plugin/.claude-plugin/plugin.json`](bc365-plugin/.claude-plugin/plugin.json).
3. Avisa al equipo de que debe reinstalar el paquete global con la nueva versión.

## Nota sobre el MCP `al` (AL Tool)

No viene incluido: requiere .NET 8 y el binario `altool` de la extensión AL
Language accesible en el PATH, algo que no está garantizado en las máquinas del
equipo. Quien lo quiera puede añadirlo a su configuración personal:

```bash
claude mcp add al -- altool launchmcpserver --transport stdio
```
