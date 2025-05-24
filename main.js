const { app, BrowserWindow, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const url = require('url');

let mainWindow;

autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';
log.info('MotoyaApp - Iniciando aplicación');

function createWindow () {
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    webPreferences: {
      webSecurity: false, 
      nodeIntegration: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, '/dist/motoyaapp/browser/index.html'),
      protocol: 'file:',
      slashes: true
    })
  );

  mainWindow.on('closed', function () {
    mainWindow = null;
  });

  // Deshabilitar menú contextual (clic derecho)
  mainWindow.webContents.on('context-menu', (e) => {
    e.preventDefault();
  });
}

app.whenReady().then(() => {
  createWindow();

  // === ACTUALIZACIONES AUTOMÁTICAS DESDE GITHUB ===
  if (process.platform === 'win32') {
   autoUpdater.checkForUpdatesAndNotify();


    autoUpdater.on('update-available', () => {
      dialog.showMessageBox({
        type: 'info',
        title: 'Actualización disponible',
        message: 'Se encontró una nueva versión. Se descargará en segundo plano.',
      });
    });

    autoUpdater.on('update-downloaded', () => {
      dialog.showMessageBox({
        type: 'info',
        title: 'Actualización lista',
        message: 'La nueva versión ha sido descargada. ¿Deseas reiniciar ahora para aplicar la actualización?',
        buttons: ['Reiniciar', 'Después'],
      }).then((result) => {
        if (result.response === 0) autoUpdater.quitAndInstall();
      });

      // ✅ Notificar a Angular que terminó la actualización
      if (mainWindow) {
        mainWindow.webContents.send('update-finished');
      }
    });

    autoUpdater.on('error', (err) => {
      console.error('Error al actualizar:', err);
      if (mainWindow) {
        mainWindow.webContents.send('update-finished');
      }
    });

    autoUpdater.on('update-not-available', () => {
      if (mainWindow) {
        mainWindow.webContents.send('update-finished');
      }
    });
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

