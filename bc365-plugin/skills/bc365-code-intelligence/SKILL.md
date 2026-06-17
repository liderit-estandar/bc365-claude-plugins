---
name: bc365-code-intelligence
description: >-
  Usar SIEMPRE al trabajar en un proyecto de Microsoft Dynamics 365 Business
  Central (BC365) o desarrollo en lenguaje AL. Señales de activación: presencia
  de un fichero app.json en el repositorio, ficheros con extensión .al,
  referencias a "AL Language", "Business Central", "BC365", objetos AL (table,
  page, codeunit, report, tableextension, pageextension, enum, permissionset),
  configuración AL-Go for GitHub, o cualquier consulta sobre desarrollo,
  debugging, performance, upgrades, testing, code review, seguridad,
  integraciones, eventos, AppSource o CI/CD en Business Central. Al activarse,
  Claude debe usar las herramientas del MCP "bc-code-intel" (BC Code
  Intelligence) y sus especialistas en vez de responder solo desde su
  conocimiento general. Todo código AL generado, venga del MCP o no, debe
  cumplir SIEMPRE las normas de codificación de la empresa descritas más abajo.
---

# BC Code Intelligence en proyectos Business Central / AL

## Cuándo aplica

Esta skill se activa cuando el trabajo ocurre en un proyecto de Business
Central o de lenguaje AL. Indicadores típicos:

- Existe un `app.json` (manifiesto de extensión AL) en el repositorio.
- Hay ficheros `.al`.
- El usuario menciona Business Central, BC365, AL, AppSource, AL-Go for
  GitHub, ALOps, BCContainerHelper, o tareas de desarrollo/migración sobre BC.

## Qué hacer

Cuando esta skill esté activa, prioriza el uso de las herramientas del MCP
`bc-code-intel` (BC Code Intelligence) para resolver la petición del usuario,
en lugar de responder únicamente con conocimiento general.

El servidor expone un equipo de especialistas a los que se invoca por su
nombre. Encamina la consulta al especialista adecuado según la naturaleza de
la tarea:

- **Arquitectura y diseño de soluciones / estructura de extensión / patrones
  de integración** → Alex.
- **Escribir código AL, patrones de implementación, dudas de codificación** →
  Sam.
- **Debugging, errores, rendimiento, consultas lentas, FlowFields** → Dean.
- **Manejo de errores, validación, Try/Catch, ErrorInfo** → Eva.
- **Testing, test codeunits, escenarios de prueba, cobertura** → Quinn.
- **Code review, buenas prácticas, convenciones de nombres, code smells** →
  Roger.
- **Seguridad, permission sets, protección de datos, seguridad de API** → Seth.
- **Integraciones, APIs, eventos, suscriptores, conexiones externas** → Jordan.
- **Código legacy, modernización C/AL → AL, upgrades de versión** → Logan.
- **Migración de versión, breaking changes, obsolescencias, errores tras
  upgrade** → Victor.
- **DevOps y CI/CD: AL-Go, ALOps, BCContainerHelper, pipelines** → Lena.
- **Experiencia de usuario, diseño de páginas, usabilidad, acciones** → Uma.
- **AppSource e ISV: publicación, validación, baseline técnico** → Morgan.
- **Aprendizaje y explicación de conceptos BC** → Maya.
- **Documentación de código, READMEs, documentación XML** → Taylor.
- **Configuración del propio MCP (capas de conocimiento company/project)** →
  Chris.
- **Usuario nuevo en herramientas de IA o que quiere revisión previa y
  transparencia antes de aplicar cambios** → Parker.

## Cómo trabajar

- Invoca al especialista de forma natural (basta el nombre de pila).
- Aporta contexto concreto: mensajes de error exactos, fragmentos de código y
  número de versión de BC cuando sea relevante.
- Los especialistas se coordinan entre sí; permite los handoffs cuando una
  consulta abarque varias áreas.
- Para cambios sobre código existente del usuario, prefiere proponer cambios
  revisables antes que modificar directamente.

## Normas de codificación de LiderIT (OBLIGATORIAS)

Estas normas aplican a **todo** código AL que se genere o modifique en el
proyecto, tanto si proviene de un especialista del MCP como si no. Tienen
prioridad sobre cualquier sugerencia genérica. Antes de generar objetos nuevos,
Claude debe leer los ficheros de configuración del proyecto indicados a
continuación y respetar lo que contengan.

### 1. Numeración de objetos (idRanges de app.json)

- Antes de crear cualquier objeto nuevo (table, page, codeunit, report, enum,
  query, xmlport, etc.), **lee el `app.json`** del proyecto y localiza el array
  `idRanges`.
- Cada entrada de `idRanges` define un rango con `from` y `to`. Asigna a cada
  objeto nuevo un Id **dentro** de alguno de esos rangos.
- No reutilices Ids ya en uso: inspecciona los objetos existentes en el proyecto
  y elige el siguiente Id libre dentro del rango.
- Si hay varios rangos, usa el primero con Ids disponibles, salvo que el usuario
  indique otro.
- Si el `app.json` no tiene `idRanges` o el rango está agotado, **detente y
  avisa** al usuario en vez de inventar un Id fuera de rango.

### 2. Sufijo de objetos y campos (.vscode/settings.json)

- Lee la configuración del proyecto en **`.vscode/settings.json`** y obtén el
  sufijo de la clave **`CRS.ObjectNameSuffix`** (CRS AL Language Extension).
- Aplica ese sufijo **al final** del nombre de:
  - todos los **objetos nuevos** (tablas, páginas, codeunits, etc.), y
  - todos los **campos nuevos** que se añadan en **tableextensions**.
- Para objetos de **extensión** (tableextension, pageextension), si en
  `.vscode/settings.json` existe la clave **`CRS.ExtensionObjectNamePattern`**,
  respeta ese patrón para construir el nombre (puede usar variables como
  `<Suffix>`, `<ObjectType>`, `<BaseName>`, etc.) en lugar de concatenar el
  sufijo manualmente.
- Ten en cuenta que el sufijo puede incluir un espacio inicial (p. ej.
  `" LDT"`); respeta exactamente el valor configurado, incluidos espacios.
- No dupliques el sufijo si el nombre ya lo lleva. Recuerda el límite de 30
  caracteres de los nombres de objeto AL: si al añadir el sufijo se supera,
  avisa al usuario.
- Si no encuentras `CRS.ObjectNameSuffix` en `.vscode/settings.json`, pregunta
  al usuario antes de generar nombres, en lugar de asumir uno.

### 3. Textos visibles: Caption en inglés + traducción al castellano en Comment

- En **todas** las propiedades con texto visible (Caption, ToolTip, y labels /
  textos como Label, los textos de `error`, `message`, `confirm`, etc.), el
  texto va **en inglés** y la traducción al **castellano** se incluye en la
  propiedad `Comment` con el formato `ESP="..."`.
- Formato exacto a seguir:

  ```al
  Caption = 'Attribute Level', Comment = 'ESP="Nivel Atributo"';
  ```

- Aplica el mismo patrón a ToolTip y a labels:

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
indícalo al usuario: el servidor MCP debe estar habilitado (vía este plugin o
configuración administrada) antes de iniciar la sesión.
