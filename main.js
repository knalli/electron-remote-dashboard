const {BrowserWindow, app, ipcMain} = require('electron');
const Server = require('./server/Server');
const OnlineStatusManager = require('./server/OnlineStatusManager');
const Config = require('./server/Config');

// Load config manager (can persist and reload)
const config = new Config(__dirname);

const server = new Server(config);

// Online-status tracking
new OnlineStatusManager(__dirname).on('changed', (isOnline) => server.emit('state-changed', 'online', isOnline));

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width : config.get('window', 'height', 1024),
    height : config.get('window', 'height', 768),
    fullscreen : config.get('window', 'fullscreen'),
    titleBarStyle : config.get('window', 'titleBarStyle', 'hidden')
  });

  // and load the index.html of the app.
  mainWindow.loadURL(`file://${__dirname}/app/index.html`);

  // Open the DevTools.
  if (config.get('window', 'devtools')) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.send('server-started', {url : server.getControlServerUrl()});

    // forward webview event metrics
    ipcMain.on('webview-refreshed', (event, data) => server.emit('view-updated', data));
    ipcMain.on('webview-favicons-refreshed', (event, data) => server.emit('view-favicons-updated', data));
    ipcMain.on('webview-response-refreshed', (event, data) => server.emit('view-response-updated', data));
  });

  // Emitted when the window is closed.
  mainWindow.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

server.on('view-set-url', ({url}) => {
  //mainWindow.loadURL(url);
  mainWindow.webContents.send('open-url', url);
  mainWindow.webContents.send('screenshot-request');
});

server.on('server-started', ({portStarted}) => {
  console.log(`Server started @ ${portStarted}`);
});

server.on('dashboard-updated', (dashboards) => {
  //app.clearRecentDocuments();
  //app.addRecentDocument('/Users/USERNAME/Desktop/work.type');
});
