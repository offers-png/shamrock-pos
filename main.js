const { app, BrowserWindow, ipcMain, dialog, screen } = require('electron');
const path = require('path');
const fs = require('fs');
const { autoUpdater } = require('electron-updater');

let mainWindow;
let customerWindow;
let currentTheme = 'light';

autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

function isAutoUpdateConfigured() {
  try {
    const pkg = require('./package.json');
    const publish = pkg.build?.publish;
    
    if (!publish) return false;
    
    const configs = Array.isArray(publish) ? publish : [publish];
    
    return configs.some(cfg => {
      if (!cfg || typeof cfg !== 'object') return false;
      return cfg.provider && cfg.owner && !String(cfg.owner).includes('YOUR_');
    });
  } catch {
    return false;
  }
}

function setupAutoUpdater() {
  if (!app.isPackaged) {
    console.log('Skipping auto-updater in development mode');
    return;
  }

  if (!isAutoUpdateConfigured()) {
    console.log('Auto-update not configured. Set publish config in package.json to enable.');
    return;
  }

  autoUpdater.on('checking-for-update', () => {
    console.log('Checking for updates...');
  });

  autoUpdater.on('update-available', (info) => {
    console.log('Update available:', info.version);
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Update Available',
      message: `A new version (${info.version}) is available. Would you like to download it now?`,
      buttons: ['Download', 'Later']
    }).then((result) => {
      if (result.response === 0) {
        autoUpdater.downloadUpdate();
      }
    });
  });

  autoUpdater.on('update-not-available', () => {
    console.log('No updates available');
  });

  autoUpdater.on('download-progress', (progressObj) => {
    console.log(`Download progress: ${progressObj.percent.toFixed(1)}%`);
  });

  autoUpdater.on('update-downloaded', (info) => {
    console.log('Update downloaded:', info.version);
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Update Ready',
      message: 'Update downloaded. The application will restart to install the update.',
      buttons: ['Restart Now', 'Later']
    }).then((result) => {
      if (result.response === 0) {
        autoUpdater.quitAndInstall();
      }
    });
  });

  autoUpdater.on('error', (err) => {
    console.error('Auto-updater error:', err.message);
  });

  autoUpdater.checkForUpdates().catch((err) => {
    console.error('Failed to check for updates:', err.message);
  });
}

app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('no-sandbox');

function setupPaths() {
  const userData = app.getPath('userData');
  
  process.env.SHAMROCK_DB_PATH = path.join(userData, 'shamrock.db');
  process.env.SHAMROCK_IS_PACKAGED = app.isPackaged ? 'true' : 'false';
  
  if (app.isPackaged) {
    process.env.SHAMROCK_SQLJS_DIR = process.resourcesPath;
    process.env.SHAMROCK_STATIC_DIR = app.getAppPath();
    process.env.SHAMROCK_RESOURCES_DIR = process.resourcesPath;
  } else {
    process.env.SHAMROCK_SQLJS_DIR = path.join(__dirname, 'node_modules', 'sql.js', 'dist');
    process.env.SHAMROCK_STATIC_DIR = __dirname;
    process.env.SHAMROCK_RESOURCES_DIR = __dirname;
  }
  
  const seedDb = app.isPackaged 
    ? path.join(process.resourcesPath, 'shamrock.db')
    : path.join(__dirname, 'shamrock.db');
    
  if (!fs.existsSync(process.env.SHAMROCK_DB_PATH) && fs.existsSync(seedDb)) {
    console.log('Copying seed database to userData...');
    fs.copyFileSync(seedDb, process.env.SHAMROCK_DB_PATH);
  }
  
  console.log('Database path:', process.env.SHAMROCK_DB_PATH);
  console.log('SQL.js directory:', process.env.SHAMROCK_SQLJS_DIR);
  console.log('Static directory:', process.env.SHAMROCK_STATIC_DIR);
  console.log('Resources directory:', process.env.SHAMROCK_RESOURCES_DIR);
}

async function waitForServer(url, maxAttempts = 30) {
  const http = require('http');
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.get(url, (res) => {
          resolve(true);
        });
        req.on('error', reject);
        req.setTimeout(500, () => {
          req.destroy();
          reject(new Error('timeout'));
        });
      });
      return true;
    } catch (e) {
      await new Promise(r => setTimeout(r, 200));
    }
  }
  return false;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    },
    autoHideMenuBar: true
  });

  mainWindow.loadURL('http://localhost:5000');

  mainWindow.on('closed', () => {
    mainWindow = null;
    if (customerWindow) {
      customerWindow.close();
    }
  });
}

function getMarketingImages() {
  const marketingDir = app.isPackaged 
    ? path.join(process.resourcesPath, 'marketing-images')
    : path.join(__dirname, 'marketing-images');
  
  try {
    if (!fs.existsSync(marketingDir)) {
      console.log('Marketing images folder not found:', marketingDir);
      return [];
    }
    
    const files = fs.readdirSync(marketingDir);
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
    
    const images = files
      .filter(file => imageExtensions.includes(path.extname(file).toLowerCase()))
      .map(file => {
        const filePath = path.join(marketingDir, file);
        return 'file://' + filePath.replace(/\\/g, '/');
      });
    
    console.log('Found marketing images:', images.length);
    return images;
  } catch (err) {
    console.error('Error reading marketing images:', err.message);
    return [];
  }
}

function createCustomerDisplay() {
  const displays = screen.getAllDisplays();
  console.log('Available displays:', displays.length);
  
  let externalDisplay = displays.find(display => display.bounds.x !== 0 || display.bounds.y !== 0);
  
  if (!externalDisplay && displays.length > 1) {
    externalDisplay = displays[1];
  }
  
  const targetDisplay = externalDisplay || displays[0];
  console.log('Customer display on:', targetDisplay.bounds);
  
  customerWindow = new BrowserWindow({
    x: targetDisplay.bounds.x,
    y: targetDisplay.bounds.y,
    width: targetDisplay.bounds.width,
    height: targetDisplay.bounds.height,
    fullscreen: true,
    frame: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  const customerDisplayPath = path.join(process.env.SHAMROCK_STATIC_DIR || __dirname, 'customer-display.html');
  customerWindow.loadFile(customerDisplayPath);
  
  customerWindow.on('closed', () => {
    customerWindow = null;
  });
  
  customerWindow.webContents.on('did-finish-load', () => {
    const images = getMarketingImages();
    customerWindow.webContents.send('marketing-images', images);
  });
}

app.whenReady().then(async () => {
  setupPaths();
  
  try {
    const server = require('./server.js');
    await server.start();
    console.log('Server started successfully');
  } catch (err) {
    console.error('Failed to start server:', err);
  }
  
  const serverReady = await waitForServer('http://localhost:5000/api/products');
  if (serverReady) {
    console.log('Server is responding, creating window...');
    createWindow();
    setTimeout(() => {
      createCustomerDisplay();
    }, 1000);
  } else {
    console.error('Server failed to respond after multiple attempts');
    createWindow();
  }
  
  setTimeout(() => {
    setupAutoUpdater();
  }, 3000);
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('print-receipt', async (event, payload) => {
  try {
    const { printReceipt } = require('./printer');
    const openDrawer = payload?.paymentType === 'Cash';
    await new Promise(resolve => setTimeout(resolve, 300));
    await printReceipt(mainWindow, payload, openDrawer);
    return { ok: true };
  } catch (err) {
    console.error('Print error:', err.message);
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('complete-sale', async (event, payload) => {
  const { openCashDrawer } = require('./printer');
  let drawerWarning = null;
  
  if (payload.openDrawer !== false) {
    try {
      await openCashDrawer();
    } catch (err) {
      console.warn('Cash drawer failed (non-fatal):', err.message);
      drawerWarning = 'Cash drawer could not be opened';
    }
  }
  
  return { ok: true, warning: drawerWarning };
});

ipcMain.handle('open-drawer', async () => {
  try {
    const { openCashDrawer } = require('./printer');
    await openCashDrawer();
    return { ok: true };
  } catch (err) {
    console.error('Open drawer error:', err.message);
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('get-printers', async () => {
  try {
    const { getAvailablePrinters, printerName } = require('./printer');
    const printers = await getAvailablePrinters();
    return { ok: true, printers, currentPrinter: printerName };
  } catch (err) {
    console.error('Get printers error:', err.message);
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('check-for-updates', async () => {
  if (!app.isPackaged) {
    return { ok: false, error: 'Updates only available in packaged app' };
  }
  if (!isAutoUpdateConfigured()) {
    return { ok: false, error: 'Auto-update not configured. Set GitHub publish config in package.json to enable updates.' };
  }
  try {
    const result = await autoUpdater.checkForUpdates();
    return { ok: true, updateInfo: result?.updateInfo };
  } catch (err) {
    console.error('Check for updates error:', err.message);
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('get-app-version', async () => {
  return { version: app.getVersion() };
});

ipcMain.handle('update-customer-cart', async (event, cartData) => {
  try {
    if (customerWindow && !customerWindow.isDestroyed()) {
      customerWindow.webContents.send('cart-update', cartData);
    }
    return { ok: true };
  } catch (err) {
    console.error('Customer cart update error:', err.message);
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('set-theme', async (event, theme) => {
  try {
    currentTheme = theme;
    // Broadcast theme change to all windows
    const allWindows = BrowserWindow.getAllWindows();
    allWindows.forEach(win => {
      if (!win.isDestroyed()) {
        win.webContents.send('theme-changed', theme);
      }
    });
    return { ok: true };
  } catch (err) {
    console.error('Theme change error:', err.message);
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('request-current-theme', async (event) => {
  try {
    event.sender.send('theme-changed', currentTheme);
    return { ok: true, theme: currentTheme };
  } catch (err) {
    console.error('Request theme error:', err.message);
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('sync-theme', async (event, theme) => {
  currentTheme = theme;
  return { ok: true };
});
