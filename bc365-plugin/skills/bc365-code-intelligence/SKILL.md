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
  conocimiento general.
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

## Nota

Si las herramientas del MCP `bc-code-intel` no están disponibles en la sesión,
indícalo al usuario: el servidor MCP debe estar habilitado (vía este plugin o
configuración administrada) antes de iniciar la sesión.
