const { app, BrowserWindow } = require('electron');
const path = require('path');
const url = require('url');

let mainWindow;

function createWindow () {
    const win = new BrowserWindow({
      width: 1920,
      height: 1080,
      webPreferences: {
        webSecurity: false, 
        nodeIntegration: true,
        preload: path.join(__dirname, 'preload.js')
      }
    })

    win.loadURL(
        url.format({
            pathname: path.join(__dirname, '/dist/motoyaapp/browser/index.html'),
            protocol: 'file:',
            slashes: true
        })
    )

    win.on('closed', function () {
        mainWindow = null;
    })

     // Deshabilitar el menú contextual
     win.webContents.on('context-menu', (e) => {
      e.preventDefault();
      });

    mainWindow = win;
}
  
app.whenReady().then(() => {
  createWindow();

  // === ACTUALIZACIONES AUTOMÁTICAS DESDE GITHUB ===
  if (process.platform === 'win32') {
    const server = 'https://update.electronjs.org';
    const feed = `${server}/resourcegrouphdl/admin-motoya-v2`;

    autoUpdater.setFeedURL({ url: feed });

    autoUpdater.checkForUpdates();

    autoUpdater.on('update-available', () => {
      dialog.showMessageBox({
        type: 'info',
        title: 'Actualización disponible',
        message: 'Se encontró una nueva versión. Se descargará en segundo plano.',
      });
    });

    autoUpdater.on('update-downloaded', () => {
      dialog.showMessageBox(
        {
          type: 'info',
          title: 'Actualización lista',
          message: 'La nueva versión ha sido descargada. ¿Deseas reiniciar ahora para aplicar la actualización?',
          buttons: ['Reiniciar', 'Después'],
        }
      ).then((result) => {
        if (result.response === 0) autoUpdater.quitAndInstall();
      });
    });

    autoUpdater.on('error', (err) => {
      console.error('Error al actualizar:', err);
    });
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

