#!/usr/bin/env node
// Lanzador multiplataforma del servidor MCP bc-code-intelligence-mcp.
//
// Claude Code arranca los servidores MCP stdio con spawn() sin shell. En Windows
// "npx" es en realidad "npx.cmd" y spawn() no resuelve esa extension, asi que una
// entrada { "command": "npx" } falla con "Failed to connect" en cualquier maquina
// Windows del equipo. Aqui usamos "node" (ejecutable real en Windows, macOS y
// Linux) y desde el proceso Node invocamos npx con el shell que corresponda a
// cada plataforma.
const { spawn } = require('child_process');

// La version esta fijada a proposito: con "@latest" cada dev podria acabar con una
// revision distinta del MCP y los comportamientos dejarian de ser reproducibles en
// el equipo. Para actualizar, sube VERSION aqui y publica una version nueva del plugin.
const PACKAGE = 'bc-code-intelligence-mcp';
const VERSION = '1.7.6';
const isWindows = process.platform === 'win32';

const child = spawn(isWindows ? 'npx.cmd' : 'npx', ['-y', `${PACKAGE}@${VERSION}`], {
  stdio: 'inherit',
  shell: isWindows,
  windowsHide: true
});

child.on('error', (err) => {
  console.error(`[${PACKAGE}] No se pudo lanzar npx: ${err.message}`);
  console.error(`[${PACKAGE}] Comprueba que Node.js y npm estan instalados y en el PATH.`);
  process.exit(1);
});

child.on('exit', (code, signal) => {
  process.exit(signal ? 1 : code ?? 0);
});

for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => child.kill(sig));
}
