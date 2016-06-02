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

## License

Copyright 2016 by Jan Philipp. Licensed under MIT.
