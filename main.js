const path = require('path');
const fs = require('fs');
const { app, BrowserWindow, Menu, session } = require('electron');

app.commandLine.appendSwitch('disable-features', 'ServiceWorker');

let baseDir;
if (process.env.PORTABLE_EXECUTABLE_DIR) {
  baseDir = process.env.PORTABLE_EXECUTABLE_DIR;
} else if (process.env.PORTABLE_EXECUTABLE_FILE) {
  baseDir = path.dirname(process.env.PORTABLE_EXECUTABLE_FILE);
} else if (app.isPackaged) {
  baseDir = path.dirname(app.getPath('exe'));
} else {
  baseDir = __dirname;
}

const dataDir = path.join(baseDir, 'data');
try { fs.mkdirSync(dataDir, { recursive: true }); } catch (e) {}

app.setPath('userData', dataDir);
app.setPath('sessionData', dataDir);
app.setPath('cache', path.join(dataDir, 'cache'));
app.setPath('logs', path.join(dataDir, 'logs'));

function hardClean() {
  ['Service Worker','Cache','Code Cache','GPUCache','Cache Storage','Session Storage','blob_storage'].forEach(function(name) {
    const p = path.join(dataDir, name);
    try { if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true }); } catch (e) {}
  });
}

let mainWindow;
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100, height: 800, minWidth: 400, minHeight: 500,
    title: 'Electrocode',
    autoHideMenuBar: true,
    backgroundColor: '#0f172a',
    webPreferences: { contextIsolation: true, nodeIntegration: false }
  });
  mainWindow.loadFile(path.join(__dirname, 'app', 'index.html'));
  mainWindow.on('closed', function() { mainWindow = null; });
}

function buildMenu() {
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { label: 'Fichier', submenu: [{ role: 'reload' }, { type: 'separator' }, { role: 'quit' }]},
    { label: 'Edition', submenu: [{ role: 'undo' }, { role: 'redo' }, { type: 'separator' }, { role: 'cut' }, { role: 'copy' }, { role: 'paste' }, { role: 'selectAll' }]},
    { label: 'Affichage', submenu: [{ role: 'zoomIn' }, { role: 'zoomOut' }, { role: 'resetZoom' }, { type: 'separator' }, { role: 'togglefullscreen' }, { role: 'toggleDevTools' }]}
  ]));
}

app.whenReady().then(async function() {
  hardClean();
  try { await session.defaultSession.clearStorageData({ storages: ['serviceworkers','cachestorage','cookies','shadercache'] }); } catch (e) {}
  buildMenu();
  createWindow();
  app.on('activate', function() { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', function() { if (process.platform !== 'darwin') app.quit(); });