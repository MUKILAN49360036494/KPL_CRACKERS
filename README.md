# KPL Crackers Website

A complete responsive storefront + admin page based on the reference screenshots.

## Files
- `index.html` — customer/main website
- `admin.html` — product admin
- `styles.css` — responsive design
- `app.js` — cart, quantity limit, invoice and WhatsApp
- `admin.js` — add/edit/delete products and recent orders
- `supabase-config.js` — Supabase project URL and publishable key
- `supabase-schema.sql` — products table, sample products, realtime, and row-level security
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

## Supabase setup
1. In the Supabase SQL Editor, run `supabase-schema.sql`.
2. In Authentication settings, disable public sign-ups, then create an admin user with an email and password.
3. In the SQL Editor, assign that user's admin role, replacing the email:

   ```sql
   update auth.users
   set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
   where email = 'admin@example.com';
   ```

4. Sign out and back in on `admin.html` so the new role is included in the session.
5. Deploy the site over HTTPS (for example, with GitHub Pages). Products are shared through Supabase and changes are delivered to open storefronts in real time.

`supabase-config.js` contains the project's public publishable key, which is intended for browser use. Never put a Supabase secret or `service_role` key in the website. Product reads are public; product writes require Supabase authentication and the server-controlled `admin` role enforced by row-level security.

Cart and recent-order data still use browser `localStorage`; only product data is shared through Supabase. For best results, serve the folder through a web server rather than opening HTML files directly. The WhatsApp number is +91 7538837392.
