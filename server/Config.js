const fs = require('fs');
const os = require('os');

const EventEmitter = require('eventemitter3');

class Config extends EventEmitter {

  constructor(basePath) {
    super();
    this.basePath = basePath;

    // ensure settings exist
    const projectName = require(`${this.basePath}/package.json`).name;
    this._configDirPath = `${os.homedir()}/.${projectName}`;
    try {
      const stats = fs.lstatSync(this._configDirPath);
      if (!stats.isDirectory()) {
        console.error(`Cannot create config directory at '${this._configDirPath}' because a file already exist`);
        process.exit(1);
      }
      console.log('Config dir is: ' + this._configDirPath);
    } catch (e) {
      try {
        fs.mkdirSync(this._configDirPath);
      } catch (e) {
        console.error(`Cannot create config directory at '${this._configDirPath}' because: ${e.message}`);
        process.exit(1);
      }
    }

    this.load();
  }

  get(group, key, defaultValue) {
    if (!this.data[group]) {
      this.data[group] = {};
    }
    const value = this.data[group][key];
    return value !== undefined ? value : defaultValue;
  }

  put(group, key, value) {
    if (!this.data[group]) {
      this.data[group] = {};
    }
    this.data[group][key] = value;
    // TODO: autosave in future (throttle-aware)
    return this;
  }

  load() {
    try {
      this.data = require(`${this._configDirPath}/.session.json`);
    } catch (ignored) {
      console.log('Either no session or an invalid/corrupted one, try initial config...');
      try {
        this.data = require(`${this._configDirPath}/config.json`);
      } catch (ignored) {
        console.log('Either no config or an invalid/corrupted one, using internal defaults...');
        this.data = {};
      }
    }

    if (!this.data.dashboards) {
      this.data.dashboards = {};
    }

    if (!this.data.server) {
      this.data.server = {};
    }

    if (!this.data.window) {
      this.data.window = {};
    }

  }

  save() {
    //console.log('Writing session file');
    const current = {
      dashboards : {
        active : this.get('dashboards', 'active'),
        items : this.get('dashboards', 'items', []).map((item) => {
          return {
            id : item.id,
            display : item.display,
            url : item.url,
            description : item.description
          };
        })
      },
      server : this.data.server,
      window : this.data.window
    };
    // write out json with two spaces
    fs.writeFile(`${this._configDirPath}/.session.json`, JSON.stringify(current, null, 2), (err) => {
      if (err) {
        console.warn(`Could not write session file: ${err.message}`);
      }
    });
  }

}

module.exports = Config;
