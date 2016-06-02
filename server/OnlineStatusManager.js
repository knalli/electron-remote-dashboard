const EventEmitter = require('eventemitter3');
const {BrowserWindow, app, ipcMain} = require('electron');

// Online-status tracking
class OnlineStatusManager extends EventEmitter {

  constructor(baseDir) {
    super();
    this.init(baseDir);
  }

  init(baseDir) {
    app.on('ready', () => {
      let window = new BrowserWindow({width : 0, height : 0, show : false});
      window.loadURL(`file://${baseDir}/app/online-status.html`);
      //window.webContents.openDevTools();
      ipcMain.on('online-status-changed', (event, status) => {
        switch (status) {
          case 'online':
            this.emit('changed', true);
            break;
          case 'offline':
            this.emit('changed', false);
            break;
        }
      });
    });
  }

}

module.exports = OnlineStatusManager;
