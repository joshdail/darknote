const {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
  Menu
} = require('electron');
const fs = require('fs').promises;
const path = require('path');

let win;
let filepath = undefined;

app.on('ready', function() {
  win = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true
    }
  });
  win.loadFile('index.html');
  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);
});

app.on('window-all-closed', function() {
  app.quit();
});

ipcMain.on('save', function(event, text) {
  if (!filepath) {
    newSave(event, text);
  } else {
    writeToFile(text);
  }
});

ipcMain.on('save-as', function(event, text) {
  newSave(event, text);
});

async function newSave(event, text) {
  try {
    let result = await dialog.showSaveDialog(win, {
      defaultPath: path.join(__dirname, '/notes/untitled.txt')
    });
    if (result.filePath) {
      filepath = result.filePath;
    } else {
      return;
    }
  } catch (e) {
    console.log('Error on save dialog box: ', e);
    return;
  }
  writeToFile(text);
}

async function selectFileToOpen() {
  try {
    let result = await dialog.showOpenDialog(win, {
      defaultPath: path.join(__dirname, '/notes')
    });
    if (!result.canceled) {
      let newPath = result.filePaths[0];
      readFileToOpen(newPath);
    }
  } catch (e) {
    console.log(e);
  }
}

async function readFileToOpen(newPath) {
  try {
    const data = await fs.readFile(newPath, 'utf8');
    if (data) {
      filepath = newPath;
      win.webContents.send('file-opened', data);
    }
  } catch (e) {
    console.log(e);
  }
}

async function writeToFile(data) {
  try {
    await fs.writeFile(filepath, data);
  } catch (e) {
    console.log('Error writing to disk: ' + e);
  }
}

const menuTemplate = [{
    label: 'File',
    submenu: [{
        label: 'Open',
        accelerator: 'CmdOrCtrl+O',
        click() {
          selectFileToOpen();
        }
      },
      {
        label: 'Save',
        accelerator: 'CmdOrCtrl+S',
        click() {
          win.webContents.send('save-clicked');
        }
      },
      {
        label: 'Save As',
        accelerator: 'CmdOrCtrl+Shift+S',
        click() {
          win.webContents.send('save-as-clicked');
        }
      },
      {
        label: 'Exit',
        accelerator: 'CmdOrCtrl+Q',
        click() {
          app.quit();
        }
      }
    ]
  },
  // Use default template for Edit
  {
    role: 'editMenu'
  },
  {
    label: 'View',
    submenu: [{
        role: 'reload'
      },
      {
        role: 'forceReload'
      },
      {
        role: 'zoomIn'
      },
      {
        role: 'zoomOut'
      },
      {
        role: 'resetZoom'
      },
      {
        role: 'toggleFullScreen'
      }
    ]
  }
];