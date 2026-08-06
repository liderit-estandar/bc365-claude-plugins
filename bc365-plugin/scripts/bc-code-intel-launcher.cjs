#!/usr/bin/env node
// Lanzador multiplataforma del servidor MCP bc-code-intelligence-mcp.
//
// Claude Code arranca los servidores MCP stdio con spawn() sin shell. En Windows
// "npx" es en realidad "npx.cmd" y spawn() no resuelve esa extension, asi que una
// entrada { "command": "npx" } falla con "Failed to connect" en cualquier maquina
// Windows del equipo. Aqui usamos "node" (ejecutable real en Windows, macOS y
// Linux) y desde el proceso Node localizamos el paquete.
//
// Estrategia (importa por el timeout de 30s que aplica Claude Code al conectar):
//   1. Si el paquete ya esta instalado (global o junto al plugin) con la version
//      fijada, lo arrancamos directamente con node -> ~3.5s.
//   2. Si no, caemos a "npx -y paquete@version" -> ~11s en caliente, pero la
//      PRIMERA vez tiene que descargar 18 MB / 12.000 ficheros y suele pasar de
//      los 30s, con lo que la conexion caduca. De ahi el aviso por stderr y la
//      recomendacion de preinstalar (ver README).
//
// La version esta fijada a proposito: con "@latest" cada dev podria acabar con una
// revision distinta del MCP y los comportamientos dejarian de ser reproducibles en
// el equipo. Para actualizar, sube VERSION aqui y publica una version nueva del plugin.
const { spawn } = require('child_process');
const path = require('path');

const PACKAGE = 'bc-code-intelligence-mcp';
const VERSION = '1.7.6';
const isWindows = process.platform === 'win32';

// Directorios donde puede vivir una instalacion previa del paquete.
function candidateRoots() {
  const roots = [__dirname, path.join(__dirname, '..')];
  const prefix = process.env.npm_config_prefix || process.env.NPM_CONFIG_PREFIX;
  const nodeDir = path.dirname(process.execPath);

  if (prefix) {
    roots.push(path.join(prefix, 'node_modules'));
    roots.push(path.join(prefix, 'lib', 'node_modules'));
  }
  if (isWindows) {
    if (process.env.APPDATA) roots.push(path.join(process.env.APPDATA, 'npm', 'node_modules'));
    roots.push(path.join(nodeDir, 'node_modules'));
  } else {
    // Cubre instalaciones del sistema y layouts tipo nvm (node en <prefix>/bin).
    roots.push(path.join(nodeDir, '..', 'lib', 'node_modules'));
    roots.push('/usr/local/lib/node_modules');
    roots.push('/usr/lib/node_modules');
  }
  return roots;
}

// Devuelve la ruta al entry point si hay una instalacion con la version exacta.
function resolveInstalled() {
  let manifestPath;
  try {
    manifestPath = require.resolve(`${PACKAGE}/package.json`, { paths: candidateRoots() });
  } catch {
    return null;
  }

  const manifest = require(manifestPath);
  if (manifest.version !== VERSION) {
    console.error(
      `[${PACKAGE}] Instalado ${manifest.version} pero el plugin fija ${VERSION}; uso npx.`
    );
    return null;
  }

  // Ojo: el paquete expone varios bin (dist/cli.js es la CLI interactiva, no el
  // servidor MCP). Hay que coger el bin homonimo del paquete, que es el que
  // ejecutaria "npx bc-code-intelligence-mcp", o en su defecto "main".
  const bin = manifest.bin;
  const entry = (typeof bin === 'string' ? bin : bin?.[PACKAGE]) ?? manifest.main;
  return entry ? path.join(path.dirname(manifestPath), entry) : null;
}

const installed = resolveInstalled();
let child;

if (installed) {
  child = spawn(process.execPath, [installed], { stdio: 'inherit', windowsHide: true });
} else {
  console.error(
    `[${PACKAGE}] No encontrado en local; lo descargo con npx. La primera vez puede ` +
      `tardar mas de los 30s que espera Claude Code: si la conexion caduca, ejecuta ` +
      `"npm i -g ${PACKAGE}@${VERSION}" una vez y reinicia la sesion.`
  );
  child = spawn(isWindows ? 'npx.cmd' : 'npx', ['-y', `${PACKAGE}@${VERSION}`], {
    stdio: 'inherit',
    shell: isWindows,
    windowsHide: true
  });
}

child.on('error', (err) => {
  console.error(`[${PACKAGE}] No se pudo lanzar el servidor: ${err.message}`);
  console.error(`[${PACKAGE}] Comprueba que Node.js y npm estan instalados y en el PATH.`);
  process.exit(1);
});

child.on('exit', (code, signal) => {
  process.exit(signal ? 1 : code ?? 0);
});

for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => child.kill(sig));
}
