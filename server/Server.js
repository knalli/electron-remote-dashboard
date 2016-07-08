const EventEmitter = require('eventemitter3');

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

class Server extends EventEmitter {

  constructor(config) {
    super();
    this.basePath = config.basePath || `${__dirname}/..`;
    this.config = config;
    this.serverPort = config.get('server', 'port', 33333);
    this.appServer = express();
    this.httpServer = http.Server(this.appServer);
    this.ioServer = socketIo(this.httpServer);
    this.initialize();
    this.start();
  }

  initialize() {
    let appBasePath = `${__dirname}/../control_app`;
    let dependenciesPath = `${__dirname}/../node_modules`;
    let cachePath = `${__dirname}/../.cache`;
    this.appServer.use('/', express.static(appBasePath));
    this.appServer.use('/node_modules', express.static(dependenciesPath));

    // Configure cache directory
    this.appServer.use('/.cache', express.static(cachePath, {
      setHeaders : (res, path, stat) => {
        res.setHeader('Cache-Control', 'no-cache, no-store, max-age=0, must-revalidate');
        res.setHeader('Expires', '0');
        res.setHeader('Pragma', 'no-cache');
      }
    }));

    this.states = {};
    this.webviewData = {};

    // bridge Socket.IO events
    this.ioServer.on('connection', (socket) => {
      socket.on('list-dashboards', (fn) => {
        fn(this.getDashboards());
      });
      socket.on('change-dashboard', (dashboardId, fn) => {
        this.changeDashboard(dashboardId, fn);
      });
      socket.on('create-dashboard', (dashboard, fn) => {
        this.createDashboard(dashboard, fn);
      });
      socket.on('remove-dashboard', (dashboardId, fn) => {
        this.removeDashboard(dashboardId, fn);
      });
      socket.on('toggle-fullscreen', (fn) => {
        this.toggleFullscreen(fn);
      });
      if (this.states) {
        socket.emit('states-updated', this.states);
      }
      if (this.webviewData) {
        socket.emit('view-updated', this.webviewData);
      }
    });
    this.on('state-changed', (name, value) => {
      this.states[name] = value;
      this.ioServer.emit('states-updated', this.states);
    });
    this.on('states-changed', (data) => {
      for (let key of Object.keys(data)) {
        this.states[key] = data[key];
      }
      this.ioServer.emit('states-updated', this.states);
    });
    this.on('view-updated', (data) => {
      for (let key of Object.keys(data)) {
        this.webviewData[key] = data[key];
      }
      this.ioServer.emit('view-updated', this.webviewData);
    });
    this.on('view-favicons-updated', (favicons) => {
      this.webviewData.favicon = favicons[0];
      this.ioServer.emit('view-updated', this.webviewData);
    });
    this.on('view-response-updated', (response) => {
      this.webviewData.lastResponse = response;
      this.ioServer.emit('view-updated', this.webviewData);
    });
  }

  start() {
    this.httpServer.listen(this.serverPort, () => {
      this.emit('server-started', {http : this.httpServer, portStarted : this.serverPort});
    });
    //this.emit('dashboards-updated', this.getDashboards());

    if (this.config.get('dashboards', 'active')) {
      console.log(`Loading dashboard "${this.config.get('dashboards', 'active')}"...`);
      setTimeout(() => {
        this.changeDashboard(this.config.get('dashboards', 'active'), ({success}) => {
          if (!success) {
            this.config.put('dashboards', 'active', undefined);
          }
        });
      }, 1000);
    } else {
      this.config.save();
    }
  }

  changeDashboard(dashboardId, fn) {
    let dashboard = this.config.get('dashboards', 'items', []).filter((db) => db.id === dashboardId)[0];
    if (!dashboard) {
      if (fn) {
        console.warn(`Dashboard ${dashboardId} not found`);
        fn({success : false, message : 'Bad luck'});
      }
      this.config.save();
    } else {
      this.config.put('dashboards', 'active', dashboard.id);
      this.applyViewUrl({url : dashboard.url});
      if (fn) {
        fn({success : true});
      }
      this.ioServer.emit('dashboard-changed', dashboard);
      this.webviewData.description = dashboard.description;
      this.config.save();
    }
  }

  createDashboard(dashboard, fn) {
    if (!(dashboard && dashboard.id && dashboard.display && dashboard.url)) {
      if (fn) {
        console.warn(`Dashboard ${dashboard.id} not complete`);
        fn({success : false, message : 'Bad luck'});
      }
    } else {
      if (this.config.get('dashboards', 'items', []).filter((db) => db.id === dashboard.id)[0]) {
        if (fn) {
          console.warn(`Dashboard ${dashboard.id} already present`);
          fn({success : false, message : 'Bad luck'});
        }
      } else {
        const items = this.config.get('dashboards', 'items', []);
        items.push(dashboard);
        this.config.put('dashboards', 'items', items);
        if (fn) {
          fn({success : true});
        }
        this.ioServer.emit('dashboards-updated', this.getDashboards());
        this.config.save();
      }
    }
  }

  removeDashboard(dashboardId, fn) {
    let dashboard = this.config.get('dashboards', 'items', []).filter((db) => db.id === dashboardId)[0];
    if (!dashboard) {
      if (fn) {
        console.warn(`Dashboard ${dashboardId} not found`);
        fn({success : false, message : 'Bad luck'});
      }
    } else {
      this.config.put('dashboards', 'items', this.config.get('dashboards', 'items', []).filter((db) => db.id !== dashboardId));
      if (fn) {
        fn({success : true});
      }
      this.ioServer.emit('dashboards-updated', this.getDashboards());

      if (this.config.get('dashboards', 'active') === dashboardId) {
        const firstDashboard = this.config.get('dashboards', 'items', [])[0];
        if (firstDashboard) {
          this.changeDashboard(firstDashboard.id);
        } else {
          // TODO: fix use case no dashboard left
          this.config.save();
        }
      } else {
        this.config.save();
      }
    }
  }

  stop() {
    this.emit('server-stopped');
  }

  applyViewUrl({url}) {
    this.emit('view-set-url', {url});
  }

  getControlServerUrl() {
    return `http://localhost:${this.serverPort}/`;
  }

  getDashboards() {
    return {
      active : this.config.get('dashboards', 'active'),
      items : this.config.get('dashboards', 'items', [])
    };
  }

  // Incoming fullscreen request
  toggleFullscreen(fn){
    this.emit('toggle-fullscreen');
    if (fn) {
      fn({success : true});
    }
  }

}

module.exports = Server;
