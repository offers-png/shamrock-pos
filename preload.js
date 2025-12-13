const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  printReceipt: (data) => ipcRenderer.invoke('print-receipt', data),
  completeSale: (data) => ipcRenderer.invoke('complete-sale', data),
  openDrawer: () => ipcRenderer.invoke('open-drawer'),
  getPrinters: () => ipcRenderer.invoke('get-printers'),
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  updateCustomerCart: (data) => ipcRenderer.invoke('update-customer-cart', data),
  onCartUpdate: (callback) => ipcRenderer.on('cart-update', (event, data) => callback(data)),
  onMarketingImages: (callback) => ipcRenderer.on('marketing-images', (event, images) => callback(images))
});
