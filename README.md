# KPL Crackers Website

A complete responsive storefront + admin page based on the reference screenshots.

## Files
- `index.html` — customer/main website
- `admin.html` — product admin
- `styles.css` — responsive design
- `app.js` — cart, quantity limit, invoice and WhatsApp
- `admin.js` — add/edit/delete products and recent orders
- `assets/logo.svg` — KPL-style logo

## Features
- Responsive desktop/mobile storefront
- Product categories and search
- Add to cart
- Quantity is limited to a maximum of 10 per product
- Admin can add, edit and delete products
- Products added in Admin are displayed on the main page
- Cart total and item count
- Order Now generates an invoice/estimate
- Print / Save as PDF
- WhatsApp order button sends the order to +91 7538837392
- Recent orders are shown in Admin

## Run
For a quick test, open `index.html` in a browser. For best results, serve the folder with a simple web server, e.g. VS Code Live Server.

## Important for production
This version uses browser `localStorage`, so Admin and Main Page are connected when used in the same browser/device. It is a complete working prototype, but a real public website needs a backend/database so that products added by an administrator are visible to customers on other phones/computers.

For production deployment, the next step is to connect the same UI to a database/API and add secure admin login. The WhatsApp number is already set to +91 7538837392.
