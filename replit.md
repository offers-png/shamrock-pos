# Shamrock Market POS System

## Overview

Shamrock Market POS is a professional, offline-first point-of-sale (POS) desktop application built with Electron, designed for retail operations. It offers comprehensive POS functionalities, including product and inventory management, sales processing, receipt printing, user authentication with role-based access, and detailed reporting. The system uses SQLite for entirely offline operation, eliminating cloud dependencies and costs. It aims to provide a robust and cost-effective solution for small to medium-sized retail businesses.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Application Structure

The application is an Electron desktop app, using `main.js` for lifecycle management and `preload.js` for secure IPC communication. It features a multi-page architecture (`login.html`, `index.html`, `products.html`, `reports.html`, `settings.html`) for different functional areas.

### Data Storage

The primary data storage is an offline SQLite database via `sql.js`, providing local data persistence. The database schema includes tables for `products`, `sales`, `users`, `shifts`, `settings`, `inventory_adjustments`, and `backups`.

### Backend Server

A Node.js Express server (`server.js`) runs locally on `localhost:5000`, providing REST API endpoints for authentication, product and sales management, shift operations, and reporting.

### Printing System

The system employs a hybrid printing architecture using Windows printer drivers via Electron's `webContents.print()` for receipts on 80mm thermal paper. Cash drawer operations are managed via ESC/POS commands sent through the printer.

### Frontend Architecture

The UI is built with vanilla JavaScript, HTML, and CSS, utilizing CSS custom properties for a comprehensive design system with light/dark theme support.

### User Authentication

The system features PIN-based login with role-based access (Owner, Manager, Cashier) and session management.

### Shift Management

Includes functionalities to open and close shifts, track starting and ending cash, and generate shift summary reports.

### Hardware Integration

Supports USB thermal printers (ESC/POS compatible) for receipts and cash drawers triggered via the printer connection.

### Auto-Update System

Integrates `electron-updater` for automatic application updates via GitHub releases.

### Features

- **Customer Display**: Supports a second screen for customer-facing displays, showing cart items and a marketing slideshow.
- **Product Search**: Allows searching products by name or barcode.
- **Google Sheets Sync**: Integrates with Google Sheets for syncing product and sales data, operating in an offline-first manner.
- **Reporting**: Provides X and Z reports, customizable date-range reports, and CSV export, with auto-save and history for End of Day reports.
- **Inventory Tracking**: Products include stock levels that auto-decrement upon sale.
- **Theme Support**: Light/dark theme toggle with persistence.
- **Global Barcode Scanner**: Barcode scanning works globally across the POS screen without needing input focus.
- **Windows Installer**: Provided via `electron-builder` for easy installation.
- **ID Verification (21+)**: Age-restricted products (Beer, Tobacco) trigger ID check modal with two options: scan driver's license barcode (PDF417) or manually enter DOB. System calculates age and blocks sale if under 21. All ID checks are logged to database for compliance.
- **EBT/SNAP Split Payment**: Automatic category-based EBT eligibility detection. When cart contains both EBT-eligible (food) and non-eligible items (alcohol, tobacco, hot food), the system displays split totals and triggers a split payment modal. EBT pays for food portion, then customer pays remaining balance with cash or card. Tax is only applied to non-EBT items. Receipts show itemized breakdown with both payment portions clearly displayed. EBT-eligible categories: Drinks, Snacks, Food, Grocery, Frozen/Ice, Dairy, Cold Subs.

## External Dependencies

- **Electron**: Desktop application framework.
- **Express**: Local web server.
- **sql.js**: SQLite database implementation (WebAssembly).
- **bcryptjs**: Password hashing for user authentication.
- **electron-builder**: For creating Windows installers.
- **electron-updater**: For application auto-updates from GitHub.
- **Google Sheets API**: For product and sales data synchronization.
- **escpos** & **escpos-usb**: Libraries for ESC/POS printer communication.