---
name: bc365-normas
description: >-
  Usar SIEMPRE al trabajar en un proyecto de Microsoft Dynamics 365 Business
  Central (BC365) o desarrollo en lenguaje AL. Señales de activación: presencia
  de un fichero app.json en el repositorio, ficheros con extensión .al,
  referencias a "AL Language", "Business Central", "BC365", objetos AL (table,
  page, codeunit, report, tableextension, pageextension, enum, permissionset),
  configuración AL-Go for GitHub, o cualquier consulta sobre desarrollo,
  debugging, performance, upgrades, testing, code review, seguridad,
  integraciones, eventos, AppSource o CI/CD en Business Central. Al activarse,
  Claude debe usar las herramientas de los MCP "bc-code-intel" (asesoramiento) y
  "al" (verificación y acciones sobre el proyecto) en vez de responder solo desde
  su conocimiento general. Todo código AL generado, venga de un MCP o no, debe
  cumplir SIEMPRE las normas de codificación de la empresa descritas más abajo.
---

# Normas y enrutado BC365 / AL (LiderIT)

## Cuándo aplica

Esta skill se activa cuando el trabajo ocurre en un proyecto de Business
Central o de lenguaje AL. Indicadores típicos:

- Existe un `app.json` (manifiesto de extensión AL) en el repositorio.
- Hay ficheros `.al`.
- El usuario menciona Business Central, BC365, AL, AppSource, AL-Go for
  GitHub, ALOps, BCContainerHelper, o tareas de desarrollo/migración sobre BC.

## MCP disponibles y cuándo usar cada uno

Este plugin habilita `bc-code-intel`. El MCP `al` es opcional y cada dev lo
configura por su cuenta (ver **Nota** al final): úsalo solo si sus herramientas
están presentes en la sesión.

### `bc-code-intel` — asesoramiento y conocimiento experto
Para **cómo** hacer las cosas: diseño, patrones, buenas prácticas, debugging,
performance, upgrades, review, seguridad. Expone un equipo de especialistas a los
que se invoca por su nombre. Encamina la consulta al especialista adecuado:

- **Arquitectura / estructura de extensión / integración** → Alex.
- **Escribir código AL, patrones de implementación** → Sam.
- **Debugging, rendimiento, consultas lentas, FlowFields** → Dean.
- **Manejo de errores, validación, Try/Catch, ErrorInfo** → Eva.
- **Testing, escenarios de prueba, cobertura** → Quinn.
- **Code review, convenciones, code smells** → Roger.
- **Seguridad, permission sets, seguridad de API** → Seth.
- **Integraciones, APIs, eventos, conexiones externas** → Jordan.
- **Código legacy, C/AL → AL, upgrades** → Logan.
- **Migración de versión, breaking changes, obsolescencias** → Victor.
- **DevOps y CI/CD: AL-Go, ALOps, BCContainerHelper** → Lena.
- **UX, diseño de páginas, usabilidad** → Uma.
- **AppSource e ISV: publicación, validación** → Morgan.
- **Aprendizaje y explicación de conceptos BC** → Maya.
- **Documentación de código, XML docs** → Taylor.
- **Configuración del propio MCP** → Chris.
- **Usuario nuevo en IA o que quiere revisión previa** → Parker.

### `al` (opcional) — verificación y acciones reales sobre el proyecto
Para **comprobar** que lo hecho funciona y para operar sobre el proyecto real
(AL MCP Server de Microsoft). Herramientas principales:

- `al_compile` — validar que el código AL compila (rápido, sin generar .app).
- `al_getdiagnostics` — obtener los diagnósticos de compilación (errores/avisos).
- `al_symbolsearch` — buscar símbolos AL en el proyecto y sus dependencias.
- `al_build` — construir el paquete .app.
- `al_getpackagedependencies` — listar dependencias declaradas en app.json.
- `al_downloadsymbols` / `al_publish` — descargar símbolos / publicar (requieren
  conexión y, en cloud, `al_auth_login` previo).

**Regla de uso** (si el MCP `al` está disponible): después de generar o modificar
código AL, **verifica con `al_compile` y revisa `al_getdiagnostics`** antes de dar
la tarea por terminada; si hay errores, corrígelos y recompila. Usa
`al_symbolsearch` para resolver nombres exactos de objetos/campos base en lugar de
asumirlos. No ejecutes `al_publish` salvo que el usuario lo pida explícitamente.

Flujo recomendado al implementar: asesorarse con el especialista de
`bc-code-intel` → escribir el código cumpliendo las normas de empresa →
verificar con `al_compile` + `al_getdiagnostics` → corregir y recompilar. Si el
MCP `al` no está disponible, indica al usuario que la compilación queda sin
verificar.

## Normas de codificación de LiderIT (OBLIGATORIAS)

Estas normas aplican a **todo** código AL que se genere o modifique, venga de un
MCP o no. Tienen prioridad sobre cualquier sugerencia genérica. Antes de generar
objetos nuevos, Claude debe leer los ficheros de configuración indicados.

### 1. Numeración de objetos (idRanges de app.json)

- Antes de crear cualquier objeto nuevo, **lee el `app.json`** del proyecto y
  localiza el array `idRanges`.
- Cada entrada define un rango con `from` y `to`. Asigna a cada objeto nuevo un
  Id **dentro** de alguno de esos rangos.
- No reutilices Ids en uso: inspecciona los objetos existentes y elige el
  siguiente Id libre. Puedes apoyarte en `al_symbolsearch` para comprobarlo.
- Si hay varios rangos, usa el primero con Ids disponibles salvo indicación
  distinta.
- Si no hay `idRanges` o el rango está agotado, **detente y avisa** en vez de
  inventar un Id fuera de rango.

### 2. Sufijo de objetos y campos (.vscode/settings.json)

- Lee **`.vscode/settings.json`** y obtén el sufijo de la clave
  **`CRS.ObjectNameSuffix`**.
- Aplica ese sufijo **al final** del nombre de: todos los objetos nuevos, y todos
  los campos nuevos en **tableextensions**.
- Para objetos de **extensión**, si existe **`CRS.ExtensionObjectNamePattern`**,
  respeta ese patrón (`<Suffix>`, `<ObjectType>`, `<BaseName>`, etc.).
- Respeta el valor exacto configurado, incluidos espacios iniciales. No dupliques
  el sufijo. Recuerda el límite de 30 caracteres; si se supera, avisa.
- Si no encuentras `CRS.ObjectNameSuffix`, pregunta antes de generar nombres.

### 3. Textos visibles: Caption en inglés + traducción al castellano en Comment

- En **todas** las propiedades con texto visible (Caption, ToolTip, y labels /
  textos de `error`, `message`, `confirm`), el texto va en **inglés** y la
  traducción al **castellano** en la propiedad `Comment` con el formato
  `ESP="..."`.

  ```al
  Caption = 'Attribute Level', Comment = 'ESP="Nivel Atributo"';
  ```

  ```al
  ToolTip = 'Specifies the attribute level', Comment = 'ESP="Especifica el nivel de atributo"';
  ```

  ```al
  AttributeLevelLbl: Label 'Attribute Level', Comment = 'ESP="Nivel Atributo"';
  ```

- El inglés es el idioma base del literal; el castellano nunca va en el literal,
  siempre en el `Comment` con `ESP="..."`.

## Nota

Si las herramientas del MCP `bc-code-intel` no están disponibles en la sesión,
indícalo al usuario: el servidor MCP debe estar habilitado (vía este plugin)
antes de iniciar la sesión.

El MCP `al` (AL Tool) no lo proporciona este plugin porque requiere .NET 8 y el
binario `altool` de la extensión AL Language accesible en el PATH, algo que no
está garantizado en las máquinas del equipo. Quien lo quiera puede añadirlo a su
configuración propia con `claude mcp add al -- altool launchmcpserver
--transport stdio`.
