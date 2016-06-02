# electron-remote-dashboard

Remote dashboard with a control app

This app starts an Electron based window showing a controlled web view. Additionally, a web server provides
a control interface configuring the displayed sites/dashboards.

## Idea

Imagine a hand free screen (like a TV) on which you want to show multiple sites/dashboards depending on specific
constraints like time, demand or even an event.

Ideally, you do not want to connect to the corresponding machine via VNC only for switching the websites. Instead of
doing this, you would prefer a nice web interface for managing and controlling the display.

Welcome!

## Features

- session data are persisted between restarts
- a complete "hands free" mode: after the first configuration, all configurations can be applied by the control interface remotely
  - sites/dashboards can be created and removed
  - the active dashboard can be switched
  - simultaneous control app interface users (note: there is currently no security applied)
  - the control app provides live feedback between all connected control app users (new active dashboard, online status, ...)

## How to download?

At the moment, there is **no packaging or building process available**. Sorry, no downloads.

## How to use

1. Clone the git repository and install the node dependencies: `npm install`. Please be ensure having at least NodeJS 4.4 (actually, 4.x should be fine).
2. Start the app with `npm start`.

## Configuration and data

* The dashboard app will load and store information at `$userDir/.electron-remote-dashboard/.session.json`.
* The dashboard app will load information at `$userDir/.electron-remote-dashboard/config.json`.

### Rules

* If the file `.session.json` is available, it will be preferred.
* The file `config.json` will be read only.
* A configuration file can contain three entries: `dashboards`, `server` and `window`.

### Example config

```json
{
  "dashboards": {
    "active": "github-knalli",
    "items": [
      {
        "id": "github-knalli",
        "display": "GitHub knalli",
        "url": "https://github.com/knalli",
        "description": "GitHub profile of <em>knalli</em>"
      }
  ]
}
```

### dashboard options

`active` is the current selected id of a dashboard. No value means no default, and an invalid one will be removed on startup automatically.

`items` is an array of `dashboard`.

`items[].dashboard` contains

- `id` is something unique like `github` or `dashboard1`.
- `display` is the title/display. It must not be unique, also it should be.
- `url` is the actual URL of the site. Can be any valid URL a browser/webview can display.
- `description` is an optional field only for the control app.

### server options

`port` is the control webserver's port. Default is `33333`.

### window options

`height` and `width` are the window dimensions. Defaults are `768` and `1024`.

`fullscreen` controls wether the window should be displayed in full screen mode.
Default is `undefined` (which results into `false` mentioned by the Electron docs).

####

## License

Copyright 2016 by Jan Philipp. Licensed under MIT.
