# Shamrock Market POS System

## Overview

Shamrock Market POS is a professional point-of-sale desktop application built with Electron for retail operations. The system provides complete POS functionality including product management, sales transactions, receipt printing, inventory tracking, user authentication with role-based access, shift management, and comprehensive reporting. It uses SQLite as the primary database for fully offline operation with no cloud costs.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes (December 2024)

- **v1.0.25 Customer Display**: Added customer-facing second screen support
  - Second Electron window opens automatically on the second monitor (Volcora dual display)
  - Left side: Shows cart items, quantity, and running total (syncs live with POS)
  - Right side: Marketing slideshow - just drop images in the `marketing-images` folder
  - Images rotate every 5 seconds automatically
  - No coding needed to manage marketing content
- **v1.0.24 Google Credentials Fix**: Fixed credentials path for Windows POS
  - Checks multiple credential sources including C:\pos-secrets\google-creds.json
- **v1.0.23 Search Focus Fix**: Fixed focus returning to search bar after selecting a product
  - Search bar regains focus after closing search results popup
  - Scanning can resume immediately after product selection
- **v1.0.22 Search by Name**: Search now finds products by name, not just barcode
  - Type product name in search bar (e.g., "top") and press Enter
  - If one match found, adds it to cart directly
  - If multiple matches found, shows popup to select from list
  - Still works with barcode scanning as before
- **v1.0.21 Sync from Sheets**: Added button to sync products FROM Google Sheets
  - New "Sync from Sheets" button on Products page
  - Pulls all products from Google Sheets into local SQLite database
  - Shows count of new and updated products after sync
- **v1.0.20 EOD Date Fix**: Fixed sales not appearing in End of Day report
  - Fixed timestamp format mismatch between SQLite and date filtering
  - Sales now correctly appear in EOD report on the same day they're made
- **v1.0.19 EOD Report History**: Added View History button to End of Day Report
  - View History button shows last 7 days of saved reports
  - Click any date to view that day's report details
  - Back button returns to today's current report
- **v1.0.18 Store Credit & EOD Auto-Save**: Added Store Credit to EOD and auto-save reports
  - Store Credit now included in EOD report totals and transaction counts
  - EOD reports auto-save to database when printed (manual or auto-print)
  - Auto-print timer logs startup confirmation message
- **v1.0.17 Timezone & Stock Fix**: Fixed date filtering and stock update errors
  - SQL date filtering now uses local timezone boundaries (not UTC)
  - Fixed updateStock() receiving undefined userId (null/undefined handling)
  - EOD report format optimized for 30-char width on 80mm thermal paper
- **v1.0.16 EOD Print & Sheets Fix**: Fixed EOD report printing and Google Sheets sync
  - EOD Report now prints full table with all payment types to POS-80C thermal printer
  - Added printCustomHTML function for reports (bypasses receipt format)
  - Fixed Google Sheets credentials path for packaged apps (extraResources)
  - Improved credentials file search (tries multiple paths)
  - White text on dark mode, black text on printed receipts
- **v1.0.15 EOD Report Printing**: Added Print button and auto-print for End of Day report
  - Print Report button added to End of Day Report popup
  - Auto-print at 11:59 PM daily - automatically generates and prints EOD report
  - Report formatted for thermal printer (monospace, receipt-style layout)
- **v1.0.14 Google Sheets Column Fix**: Fixed column mismatch for Google Sheets sync
  - Products sync now uses 4 columns (barcode, name, price, category) to match existing sheet
  - Sales sync now uses 8 columns (no items JSON) to match existing sheet
  - Both spreadsheets use separate IDs for products and sales
- **v1.0.13 Google Sheets Sync Restored**: Re-added Google Sheets sync for products and sales
  - Products sync to both SQLite AND Google Sheets on add/update/delete
  - Sales transactions sync to Google Sheets automatically
  - Offline-first: saves to SQLite immediately, syncs to Sheets when online
  - Sheet names: "Sheet1" tabs in both spreadsheets
- **v1.0.12 UI Improvements**: Added global barcode scanner, theme toggle, daily reports, and ID cutoff date
  - Global barcode listener - scanner works anywhere on POS screen without needing input focus
  - Working light/dark theme toggle in Settings with localStorage persistence across all pages
  - Daily reports now savable to database with date picker to view past reports
  - Print button for reports page
  - ID verification modal shows legal cutoff date ("Must be born on or before: [date]")
- **v1.0.11 Cash Drawer Fix**: Fixed drawer not opening on checkout
  - Drawer command now sent as part of receipt print job (before paper cut)
  - Order: receipt text → open drawer → cut paper
  - Added Windows PowerShell fallback when native printer module unavailable
  - Multiple fallback methods: native ESC/POS → PowerShell → print command
- **v1.0.10 Printer Configuration**: Updated printer settings for POS-80C
  - Changed default printer name from "POS-80" to "POS-80C"
  - Fixed paper cut command (0x42 instead of 0x41) for proper receipt cutting
  - Cash drawer command verified working (ESC p 0 25 250)
- **v1.0.9 Receipt Items Fix**: Fixed items not displaying on receipts
  - Ensured cart items are fully cloned with all properties (name, price, qty) before checkout
  - Fixed timing issue where cart was cleared before receipt data was captured
- **v1.0.8 Receipt Width**: Increased receipt width from 42 to 48 characters for 80mm thermal paper
- **v1.0.7 Optional Receipt Printing**: Made receipt printing optional
  - Removed auto-print after sales - no more automatic print dialogs
  - Manual Print button on receipt screen sends to thermal printer
  - Cash drawer only opens on Cash payments (not Debit/EBT)
- **v1.0.6 Packaging Fixes**: Fixed path handling for packaged Electron apps
  - Added SHAMROCK_STATIC_DIR (app.getAppPath for HTML/CSS/JS in asar)
  - Added SHAMROCK_RESOURCES_DIR (process.resourcesPath for JSON/DB files)
  - Added asarUnpack for native printer modules
  - Removed unused better-sqlite3 native dependency
- **SQLite Migration**: Migrated from Google Sheets/JSON to SQLite database using sql.js (pure JavaScript implementation for Electron compatibility)
- **User Authentication**: Added PIN-based login with bcrypt password hashing and session management
- **User Roles**: Implemented Owner, Manager, Cashier roles with role-based permissions
- **Shift Management**: Added shift open/close functionality with starting/ending cash tracking
- **Theme Support**: Added dark/light theme toggle in Settings with localStorage persistence
- **Enhanced Reporting**: Added X Report (mid-day), Z Report (end-of-day), and CSV export
- **Backup System**: Added database backup/restore functionality
- **Inventory Tracking**: Products now include stock levels that auto-decrement on sales
- **Windows Installer**: Configured electron-builder for NSIS installer with desktop shortcuts

## Default Credentials

- **Owner PIN**: 1234 (change after first login)

## System Architecture

### Application Structure

**Desktop Framework**: The application is built as an Electron desktop app, providing a native-like experience on Windows, macOS, and Linux. The main process (`main.js`) manages the application lifecycle and window creation, while the renderer processes handle the UI components.

**Process Isolation**: Uses Electron's recommended security model with `contextIsolation: true` and `nodeIntegration: false`. A preload script (`preload.js`) bridges the gap between the main process and renderer, exposing specific IPC channels through `contextBridge` for printing, sales completion, and cash drawer operations.

**Multi-Page Architecture**: The application uses separate HTML files for different functional areas:
- `login.html` - User authentication with PIN keypad
- `index.html` - Main POS transaction interface
- `products.html` - Product catalog management
- `reports.html` - Sales reporting and analytics
- `settings.html` - System configuration

### Data Storage

**Primary Storage (SQLite)**: The application uses sql.js (WebAssembly-based SQLite) for data storage. This provides:
- Full offline operation with no internet required
- No cloud costs or external dependencies
- Fast local queries
- Portable database file (`shamrock.db`)

**Database Schema**:
- `products` - Product catalog with barcode, name, price, category, stock, cost, margin
- `sales` - Transaction records with items, totals, payment types
- `users` - User accounts with roles and PIN authentication
- `shifts` - Shift records with cash tracking and sales totals
- `settings` - Application configuration
- `inventory_adjustments` - Stock adjustment history
- `backups` - Backup metadata

### Backend Server

**Express Server**: A Node.js Express server (`server.js`) handles API requests and data persistence. It runs on localhost:5000 alongside the Electron app and provides REST endpoints.

**Key Endpoints**:
- `POST /api/auth/login` - PIN authentication
- `GET/POST /api/products` - Product CRUD
- `POST /api/sales` - Record sales
- `GET/POST /api/shifts/*` - Shift management
- `GET /api/reports/*` - X/Z Reports, CSV export
- `POST /api/backup` - Database backup

### Printing System

**Hybrid Printing Architecture**: 
- **Receipt Printing**: Uses Windows printer driver via Electron's `webContents.print()` API for reliability
- **Default Printer**: "volcora recipit printer" (configurable via SHAMROCK_PRINTER_NAME env var)
- **Receipt Format**: HTML-based receipts rendered to 80mm thermal paper width

**Cash Drawer**: 
- Opens via ESC/POS USB command (0x1B, 0x70, 0x00, 0x19, 0xFA)
- Requires USB thermal printer connection with drawer attached
- Triggered by "No Sale" button or after completing sales

**IPC Channels**:
- `print-receipt` - Print a formatted receipt
- `open-drawer` - Open the cash drawer
- `get-printers` - List available Windows printers
- `get-app-version` - Get current app version
- `check-for-updates` - Manually check for updates (when configured)

### Frontend Architecture

**Vanilla JavaScript**: The UI is built with vanilla JavaScript, HTML, and CSS without frontend frameworks.

**CSS Custom Properties**: A comprehensive design system with light/dark theme support using CSS custom properties in `styles.css`.

**Theme Toggle**: Users can switch between light and dark themes in Settings > Display.

### User Authentication

**Role-Based Access**:
- **Owner**: Full system access, user management, reports, settings
- **Manager**: Product management, reports, shift management
- **Cashier**: POS transactions, shift operations

**Session Management**: User sessions are stored in sessionStorage and validated on each page load.

### Shift Management

**Day Operations**:
- Open shift with starting cash amount
- Track sales by payment type (Cash, Card, EBT)
- Close shift with ending cash count
- Generate shift summary report

### Product Data Structure

Products are stored with:
- `barcode` (string) - Unique identifier for barcode scanning
- `name` (string) - Product display name
- `price` (number) - Unit price in dollars
- `category` (string) - Product category
- `stock` (number) - Current inventory level
- `cost` (number) - Product cost for margin calculation

### Sales Data Structure

Sales transactions include:
- `timestamp` (ISO 8601) - Transaction time
- `saleId` (string) - Unique sale identifier
- `paymentType` (string) - Cash, Card, EBT
- `subtotal`, `discount`, `tax`, `total` (numbers)
- `itemCount` (number) - Total items sold
- `items` (JSON) - Line items with details
- `shiftId` (number) - Associated shift
- `userId` (number) - Cashier who made the sale

## Hardware Integration

**USB Thermal Printers**:
- ESC/POS compatible receipt printers
- Connected via USB interface
- Libraries: `escpos` (v3.0.0-alpha.6) and `escpos-usb` (v3.0.0-alpha.4)
- 48-character width thermal paper support

**Cash Drawer**:
- Triggered via printer connection
- "No Sale" button for cash drawer only

## Building for Windows

Run `npm run dist` to build the Windows installer. The output will be in the `dist` folder.

The installer includes:
- Desktop shortcut
- Start Menu shortcut
- Uninstaller
- Custom installation directory option

### Auto-Update System

**electron-updater Integration**:
- Auto-update checking on startup (when configured)
- Download/install dialogs for new versions
- Manual update checking via IPC
- Requires GitHub repository configuration in package.json for updates

**Configuration**: Set publish config in package.json to enable:
```json
"publish": {
  "provider": "github",
  "owner": "your-github-username",
  "repo": "shamrock-pos"
}
```

## Product Categories (15 Total)

"Tobacco", "Beer", "Drinks", "Snacks", "Food", "Household", "Lottery", "Hot Food", "Grocery", "Medicine/Pharmacy", "Frozen / Ice", "Dairy", "Cold Subs", "Pets", "Other / Misc"

## Core Dependencies

- **Electron** (v39.2.4): Desktop application framework
- **Express**: Web server for API routes
- **sql.js**: SQLite database (WebAssembly)
- **bcryptjs**: Password hashing
- **electron-builder**: Windows installer creation
- **electron-updater**: GitHub-based auto-updates

## Development Notes

- The D-Bus errors seen in Replit logs are Linux-specific and do not occur on Windows
- The database file (`shamrock.db`) is automatically created on first run
- Products are auto-migrated from `products.json` if the database is empty
- The server runs on port 5000 and must be accessible from the Electron renderer
