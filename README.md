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

## Actualizar la versión de los MCP

**bc-code-intel**

1. Sube `VERSION` en [`bc365-plugin/scripts/bc-code-intel-launcher.cjs`](bc365-plugin/scripts/bc-code-intel-launcher.cjs).
2. Sube `version` en [`bc365-plugin/.claude-plugin/plugin.json`](bc365-plugin/.claude-plugin/plugin.json).
3. Avisa al equipo de que debe reinstalar el paquete global con la nueva versión.

**al (ALTool)**

1. Sube `TOOL_VERSION` en [`bc365-plugin/scripts/al-mcp-launcher.cjs`](bc365-plugin/scripts/al-mcp-launcher.cjs).
2. Sube `version` en `plugin.json`.
3. Los devs que ya tengan ALTool **no se actualizan solos**: el lanzador solo
   instala cuando falta, para no cambiarle a nadie la versión por la espalda.
   Hay que decirles que ejecuten el `dotnet tool update` de abajo.

## ¿Basta con actualizar el plugin?

Casi. Quedan dos cosas que el plugin no puede hacer por sí mismo:

1. **Instalar el SDK de .NET 10**, una vez por máquina:
   `winget install Microsoft.DotNet.SDK.10`. No necesita ser administrador.
2. **Reiniciar la sesión de Claude Code.** Los servidores MCP se conectan al
   arrancar, así que `al` no aparece hasta reabrirla.

**ALTool sí se instala solo.** Si hay SDK pero falta ALTool, el lanzador ejecuta
`dotnet tool update --global` por su cuenta en el primer arranque. Son ~33 MB, así
que esa primera vez puede pasar de los 30 s que espera Claude Code al conectar; si
caduca, basta con reiniciar la sesión, porque la herramienta ya queda instalada.
Para desactivar ese automatismo, define `AL_MCP_NO_AUTOINSTALL=1`.

Si un dev no hace el paso 1, el resto del plugin funciona igual: solo falta el MCP
`al`, y el lanzador explica por stderr qué instalar.

## MCP `al` (AL MCP Server de Microsoft)

El plugin habilita el [AL MCP Server](https://learn.microsoft.com/dynamics365/business-central/dev-itpro/developer/al-agent-tools/al-agent-tools-overview)
mediante [`bc365-plugin/scripts/al-mcp-launcher.cjs`](bc365-plugin/scripts/al-mcp-launcher.cjs).
Da a Claude 16 herramientas: `al_compile`, `al_getdiagnostics`, `al_symbolsearch`,
`al_symbolrelations`, `al_build`, `al_getnextobjectid`, `al_getpackagedependencies`,
`al_run_tests`, `al_inspectpage`, `al_searchtranslations`, `al_writetranslation`,
`al_downloadsymbols`, `al_publish`, `al_addproject`, `al_auth_login` y
`al_auth_logout`. Las cinco últimas de esa lista que no documenta Microsoft en la
página de overview existen igualmente; están comprobadas contra el servidor real.

### Instalación

**No hace falta VS Code.** ALTool es una herramienta global de .NET y el lanzador
la instala solo. Si prefieres hacerlo a mano:

```bash
dotnet tool update --global Microsoft.Dynamics.BusinessCentral.Development.Tools --version 18.0.43.1464
```

Siempre `update`, no `install`: instala si no está y actualiza si ya está, así que
el mismo comando vale la primera vez y en cada subida de versión. `install` falla
con «ya está instalada» si el dev la tenía.

Lo único imprescindible es el **SDK de .NET 10** (LTS). No basta el runtime, porque
`dotnet tool` es un comando del SDK; comprueba con `dotnet --list-sdks`. En Windows:

```powershell
winget install Microsoft.DotNet.SDK.10
```

El SDK instala también el runtime de ASP.NET Core de su versión, que ALTool
declara como framework obligatorio y sin el cual no arranca.

Por qué la 10 y no la 8, que técnicamente también valdría (el paquete NuGet trae
variantes `net8.0` y `net10.0`, y el SDK elige la que toca):

- **.NET 8 llega a fin de soporte el 10 de noviembre de 2026**; la 10 es LTS
  hasta noviembre de 2028.
- Con la 10 funciona además el `altool.exe` de la extensión AL Language de VS
  Code, que en la 18.x está compilado contra `net10.0`. Así el último recurso del
  lanzador deja de ser papel mojado.

### Cómo localiza el binario

1. `AL_TOOL_PATH` (ruta completa, para instalaciones fuera de lo normal).
2. `~/.dotnet/tools/al` — la herramienta global de arriba.
3. `PATH` (`altool` primero; al buscar `al` se descartan los directorios del SDK
   de Windows, donde vive un `al.exe` distinto, el Assembly Linker).
4. **Auto-instalación** con `dotnet tool update --global`, si hay SDK.
5. Extensión `ms-dynamics-smb.al-*` más reciente de VS Code. Va la última porque
   la 18.x exige .NET 10, mientras que la del NuGet vale con 8 o con 10.

### Variables de entorno

| Variable | Efecto |
| --- | --- |
| `AL_TOOL_PATH` | Ruta completa a ALTool; salta toda la búsqueda. |
| `AL_PROJECT_PATH` | Raíz desde la que buscar proyectos AL. |
| `AL_MCP_NO_AUTOINSTALL` | A `1`, no instala ALTool automáticamente. |
| `AL_MCP_DISABLE_TELEMETRY` | A `1`, pasa `--disableTelemetry` a ALTool. |

### Proyectos cargados

Parte de `AL_PROJECT_PATH`, o del directorio de trabajo de Claude Code. Si ahí hay
un `app.json` carga ese proyecto; si no, busca `app.json` hasta dos niveles por
debajo y los carga todos (cubre el layout de AL-Go con `app/` y `test/`),
ignorando `node_modules`, `.git` y `.alpackages`. Si no encuentra ninguno arranca
sin proyectos y se cargan con `al_addproject`.

Para publicar en cloud hay que llamar antes a `al_auth_login`.

### Telemetría

ALTool envía telemetría con nivel `all` por defecto. Para desactivarla, define
`AL_MCP_DISABLE_TELEMETRY=1` y el lanzador le pasará `--disableTelemetry`.
