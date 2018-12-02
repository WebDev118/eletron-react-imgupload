import { app, BrowserWindow, Tray, Menu, ipcRenderer, dialog, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import MenuBuilder from './menu';
import { configureRequestOptions } from 'builder-util-runtime';
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database/database.db');

db.run('CREATE TABLE IF NOT EXISTS appid (id INTEGER PRIMARY KEY AUTOINCREMENT, app_id text NOT NULL)');
db.run('CREATE TABLE IF NOT EXISTS image (remote_id INTEGER PRIMARY KEY AUTOINCREMENT, filename text NOT NULL, app_id text NOT NULL, event_id text NOT NULL, server_id text, path text NOT NULL,  Timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)');
export default class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow = null;

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

if (
  process.env.NODE_ENV === 'development' ||
  process.env.DEBUG_PROD === 'true'
) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS', 'REDUX_DEVTOOLS'];

  return Promise.all(
    extensions.map(name => installer.default(installer[name], forceDownload))
  ).catch(console.log);
};

/**
 * Add event listeners...
 */
app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
app.on('resize', function (e, x, y) {
  win.setSize(x, y);
});
app.on('ready', async () => {
  if (
    process.env.NODE_ENV === 'development' ||
    process.env.DEBUG_PROD === 'true'
  ) {
    await installExtensions();
  }

  mainWindow = new BrowserWindow({
    show: false,
    width: 600,
    height: 650
  });

  mainWindow.loadURL(`file://${__dirname}/app.html`);

  // @TODO: Use 'ready-to-show' event
  //        https://github.com/electron/electron/blob/master/docs/api/browser-window.md#using-ready-to-show-event
  mainWindow.webContents.on('did-finish-load', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  db.all("SELECT * FROM appid ", function(err, allRows) {
    if(err != null){
        console.log(err);
    }
    else {
      if(allRows.length !== 0) {
        var app_id = allRows[0].app_id;
        var Pusher = require('pusher-client');
        var pusher = new Pusher('99e2d18acf825c974622', {
          cluster: 'mt1'
        });
        var channel = pusher.subscribe('select-'+ app_id );
        channel.bind('photo_request', function(data) {
          var server_id = data.message.server_id;
          var event_id = data.message.event_id;
          let query = "SELECT * FROM image WHERE server_id ='"+server_id+"' AND event_id='"+event_id+"'";
         db.all(query, function(err, allRows) {
            if(err != null){
                console.log(err);
            }
            else {
              if(allRows.length !== 0) {
                var sendData = {"state": "ok", "data":allRows}
                mainWindow.webContents.send('pusher-notification', sendData);
              }
              else{
                var sendData = {"state": "no", "data":""}
                mainWindow.webContents.send('pusher-notification', sendData);
              }
            }
          });
        });
      }
    }
  });
  ipcMain.on('selectDirectory', (event, arg) => {
    let dir = dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory']
    });
    event.sender.send('selectDirectory-reply', dir)
  });
  ipcMain.on('uuid', (event, arg) => {
    db.all('SELECT * FROM appid', function(err, allRows) {
      if(err != null){
          console.log(err);
      }
      else {
        if(allRows.length === 0) {
          let sql = "INSERT INTO appid(app_id) VALUES ('"+ arg +"')";
          db.run(sql, function(err) {
            if (err) {
              return console.error(err.message);
            }
          });
          event.sender.send('uuid-reply', arg)
        } else{
          event.sender.send('uuid-reply', allRows[0].app_id);
        }
      }
    });
  });
  ipcMain.on('imgSaveInfo', (event, arg) => {
    let query = "SELECT * FROM image WHERE filename = '"+arg.filename+"'";
    db.all(query, function(err, allRows) {
      if(err != null){
          console.log(err);
      }
      else {
        if(allRows.length === 0) {
          let sql = "INSERT INTO image(filename, app_id, event_id, path) VALUES ('"+arg.filename+"','"+arg.app_id+"','"+arg.event_id+"','"+arg.path+"')";
          db.run(sql, function(err) {
            if (err) {
              return console.error(err.message);
            }
            else{
              event.sender.send('imageSave-reply', arg.filename);
            }
          });
        }
        else{
          event.sender.send('imageSave-reply', "")
        }
      }
    });
  });

  ipcMain.on('getThumbdata', (event, arg) => {
    let query = "SELECT * FROM image WHERE filename = '"+ arg + "'";
    db.all(query, function(err, allRows) {
      if(err != null){
          console.log(err);
      }
      else {
        if(allRows.length !== 0) {
          event.sender.send('getThumbdata-reply', allRows);
        }
      }
    });
  });
  ipcMain.on('serverid_update', (event, arg) => {
    let server_id = arg.server_id;
    let remote_id = arg.remote_id;
    let query = "UPDATE image SET server_id = " + server_id + " WHERE remote_id = " + remote_id;
    db.all(query, function(err) {
      if(err){
          console.log(err);
      }
    });
  });
  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
});
