#!/usr/bin/env node
// Lanzador del AL MCP Server de Microsoft (ALTool "launchmcpserver").
//
// Expone a Claude las herramientas al_compile, al_getdiagnostics, al_symbolsearch,
// al_build, al_getnextobjectid, al_publish, etc.
// Doc: https://learn.microsoft.com/dynamics365/business-central/dev-itpro/developer/al-agent-tools/al-agent-tools-overview
//
// COMO SE OBTIENE EL BINARIO
// La via recomendada NO necesita VS Code: el paquete NuGet "AL Development Tools"
// se instala como dotnet tool global y deja el comando "al":
//
//   dotnet tool install --global Microsoft.Dynamics.BusinessCentral.Development.Tools --version 18.0.43.1464
//
// Requiere el SDK de .NET 10 (no basta el runtime: "dotnet tool" es un comando del
// SDK). El SDK trae ademas el runtime de ASP.NET Core, que altool declara como
// framework obligatorio. El paquete tiene variantes net8.0 y net10.0 y el SDK elige
// la que toca, asi que .NET 8 tambien valdria, pero queda sin soporte en 11/2026.
//
// Como ultimo recurso se acepta el altool de la extension AL Language de VS Code.
// El de la extension 18.x esta compilado contra net10.0, asi que solo arranca si
// hay .NET 10; con .NET 8 falla con "You must install or update .NET".
//
// La version se fija a proposito (misma politica que bc-code-intel-launcher.cjs):
// si cada dev instala una distinta, los comportamientos dejan de ser reproducibles.
const { spawn, spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const TOOL_PACKAGE = 'Microsoft.Dynamics.BusinessCentral.Development.Tools';
const TOOL_VERSION = '18.0.43.1464';
const isWindows = process.platform === 'win32';

function log(msg) {
  console.error(`[al-mcp] ${msg}`);
}

function exe(name) {
  return isWindows ? `${name}.exe` : name;
}

function fileOrNull(p) {
  return p && fs.existsSync(p) && fs.statSync(p).isFile() ? p : null;
}

// --- Localizacion del binario ---------------------------------------------

// 1. dotnet tool global: ~/.dotnet/tools/al(.exe). Es la via sin VS Code, asi que
//    va antes que el PATH para no toparnos con homonimos (ver findOnPath).
function findDotnetTool() {
  const home = process.env.DOTNET_CLI_HOME || os.homedir();
  return fileOrNull(path.join(home, '.dotnet', 'tools', exe('al')));
}

// 2. PATH. Buscamos "altool" primero porque es inequivoco: en Windows existe otro
//    "al.exe" (Assembly Linker del SDK de Windows) que no tiene nada que ver y que
//    podria estar en el PATH, asi que descartamos esa ruta explicitamente.
function findOnPath() {
  const dirs = (process.env.PATH || '').split(path.delimiter).filter(Boolean);
  for (const name of ['altool', 'al']) {
    for (const dir of dirs) {
      if (name === 'al' && /Microsoft SDKs[\\/]Windows/i.test(dir)) continue;
      const hit = fileOrNull(path.join(dir, exe(name)));
      if (hit) return hit;
    }
  }
  return null;
}

// 3. Extension AL Language de VS Code. El binario esta en bin/ o en bin/win32/
//    segun la version; cogemos la extension mas reciente que encontremos.
function compareVersions(a, b) {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d) return d;
  }
  return 0;
}

function findInVsCodeExtensions() {
  const home = os.homedir();
  const platformDir = isWindows ? 'win32' : process.platform === 'darwin' ? 'darwin' : 'linux';
  const found = [];

  for (const root of [
    path.join(home, '.vscode', 'extensions'),
    path.join(home, '.vscode-insiders', 'extensions')
  ]) {
    let entries;
    try {
      entries = fs.readdirSync(root);
    } catch {
      continue;
    }
    for (const name of entries) {
      const m = /^ms-dynamics-smb\.al-(\d+(?:\.\d+)*)/i.exec(name);
      if (!m) continue;
      const bin =
        fileOrNull(path.join(root, name, 'bin', exe('altool'))) ||
        fileOrNull(path.join(root, name, 'bin', platformDir, exe('altool')));
      if (bin) found.push({ version: m[1], bin });
    }
  }

  found.sort((x, y) => compareVersions(y.version, x.version));
  return found[0] ?? null;
}

function resolveAlTool() {
  const override = process.env.AL_TOOL_PATH;
  if (override) {
    const hit = fileOrNull(override);
    if (hit) return { bin: hit, source: 'AL_TOOL_PATH' };
    log(`AL_TOOL_PATH apunta a un fichero inexistente: ${override}`);
  }

  const tool = findDotnetTool();
  if (tool) return { bin: tool, source: 'dotnet tool global' };

  const onPath = findOnPath();
  if (onPath) return { bin: onPath, source: 'PATH' };

  // Antes de caer a VS Code: el dotnet tool es la via soportada y funciona con
  // .NET 8 y 10, mientras que el de la extension 18.x exige .NET 10.
  const installed = autoInstall();
  if (installed) return installed;

  const vscode = findInVsCodeExtensions();
  if (vscode) {
    log(
      `Uso el altool de la extension AL ${vscode.version} de VS Code; necesita .NET 10. ` +
        `Lo recomendable es instalar el dotnet tool (ver README).`
    );
    return { bin: vscode.bin, source: `extension VS Code ${vscode.version}` };
  }

  return null;
}

// --- Auto-instalacion ------------------------------------------------------

// Si no hay ALTool pero si el SDK de .NET, lo instalamos solos. Mismo criterio que
// bc-code-intel-launcher.cjs, que cae a "npx -y" cuando el paquete no esta.
// El SDK no lo podemos instalar nosotros: eso queda en manos del dev (ver README).
function findDotnet() {
  const roots = [];
  if (process.env.DOTNET_ROOT) roots.push(process.env.DOTNET_ROOT);
  roots.push(...(process.env.PATH || '').split(path.delimiter).filter(Boolean));
  if (isWindows) {
    roots.push('C:\\Program Files\\dotnet');
  } else {
    roots.push('/usr/share/dotnet', '/usr/local/share/dotnet', path.join(os.homedir(), '.dotnet'));
  }
  for (const dir of roots) {
    const hit = fileOrNull(path.join(dir, exe('dotnet')));
    if (hit) return hit;
  }
  return null;
}

function autoInstall() {
  if (/^(1|true|yes)$/i.test(process.env.AL_MCP_NO_AUTOINSTALL || '')) return null;

  const dotnet = findDotnet();
  if (!dotnet) return null;

  // "dotnet tool" es un comando del SDK: con solo el runtime no sirve de nada.
  const sdks = spawnSync(dotnet, ['--list-sdks'], { encoding: 'utf8', windowsHide: true });
  if (sdks.status !== 0 || !sdks.stdout.trim()) {
    log('Hay runtime de .NET pero no SDK, que es lo que necesita "dotnet tool".');
    return null;
  }

  log(`ALTool no esta instalado; lo instalo con dotnet tool (${TOOL_VERSION}).`);
  log('La descarga son ~33 MB y la primera vez puede pasar de los 30s que espera');
  log('Claude Code al conectar. Si caduca, reinicia la sesion: ya quedara instalado.');

  // "update" y no "install": instala si falta y actualiza si ya esta, asi que es
  // idempotente. Nada debe ir a stdout, que es el canal JSON-RPC del MCP.
  const res = spawnSync(
    dotnet,
    ['tool', 'update', '--global', TOOL_PACKAGE, '--version', TOOL_VERSION],
    { encoding: 'utf8', windowsHide: true }
  );
  if (res.stdout) process.stderr.write(res.stdout);
  if (res.stderr) process.stderr.write(res.stderr);

  if (res.status !== 0) {
    log('No se pudo instalar ALTool automaticamente. Hazlo a mano (ver README).');
    return null;
  }

  const installed = findDotnetTool() || findOnPath();
  if (installed) log('ALTool instalado correctamente.');
  return installed ? { bin: installed, source: 'dotnet tool global (recien instalado)' } : null;
}

// --- Proyectos AL ----------------------------------------------------------

// El servidor acepta 0..N rutas de proyecto (carpetas con app.json). Si no pasamos
// ninguna arranca vacio y hay que cargarlas luego con al_addproject, asi que
// buscamos los app.json de la raiz y de un nivel por debajo (layout tipico de
// AL-Go: app/ y test/ colgando del repo).
const SKIP_DIRS = new Set(['node_modules', '.git', '.alpackages', '.vscode', '.snapshots', 'bin', 'obj']);
const MAX_PROJECTS = 24;

function findProjects(root) {
  if (fileOrNull(path.join(root, 'app.json'))) return [root];

  const projects = [];
  const walk = (dir, depth) => {
    if (depth > 2 || projects.length >= MAX_PROJECTS) return;
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (!entry.isDirectory() || SKIP_DIRS.has(entry.name) || entry.name.startsWith('.')) continue;
      const sub = path.join(dir, entry.name);
      if (fileOrNull(path.join(sub, 'app.json'))) {
        projects.push(sub); // proyecto AL: no seguimos bajando, no hay anidados
      } else {
        walk(sub, depth + 1);
      }
    }
  };

  walk(root, 1);
  return projects;
}

// --- Arranque --------------------------------------------------------------

const resolved = resolveAlTool();
if (!resolved) {
  log('No encuentro ALTool ni he podido instalarlo. Hazlo a mano (no hace falta VS Code):');
  log(`  dotnet tool update --global ${TOOL_PACKAGE} --version ${TOOL_VERSION}`);
  log('Necesita el SDK de .NET 10 (winget install Microsoft.DotNet.SDK.10).');
  log('Si ya tienes ALTool en otra ruta, define AL_TOOL_PATH.');
  process.exit(1);
}

const root = process.env.AL_PROJECT_PATH || process.env.CLAUDE_PROJECT_DIR || process.cwd();
const projects = findProjects(root);

if (projects.length === 0) {
  log(`Sin app.json bajo ${root}: arranco sin proyectos (cargalos con al_addproject).`);
} else {
  log(`Proyectos AL: ${projects.join(', ')}`);
}

log(`ALTool: ${resolved.bin} (${resolved.source})`);

// ALTool envia telemetria con nivel "all" por defecto. Se desactiva por entorno
// para no imponerlo a todo el equipo desde aqui.
const extra = [];
if (/^(1|true|yes)$/i.test(process.env.AL_MCP_DISABLE_TELEMETRY || '')) {
  extra.push('--disableTelemetry');
  log('Telemetria de ALTool desactivada (AL_MCP_DISABLE_TELEMETRY).');
}

const child = spawn(resolved.bin, ['launchmcpserver', ...projects, '--transport', 'stdio', ...extra], {
  stdio: 'inherit',
  windowsHide: true
});

child.on('error', (err) => {
  log(`No se pudo lanzar ALTool: ${err.message}`);
  process.exit(1);
});

child.on('exit', (code, signal) => {
  if (code && code !== 0) {
    log(`ALTool termino con codigo ${code}. Si se queja del framework, revisa que`);
    log('tengas instalados el runtime de .NET y el de ASP.NET Core de la misma version.');
  }
  // Los fallos del host de .NET devuelven codigos HRESULT que no caben en un
  // codigo de salida POSIX y se truncarian a un valor enganoso: los normalizamos.
  if (signal || code === null || code < 0 || code > 255) process.exit(code === 0 ? 0 : 1);
  process.exit(code);
});

for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => child.kill(sig));
}
