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
    createWindow()
  
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
      }
    })
})
  
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
})


