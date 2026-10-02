import http.server
import socketserver
import json
import os
import urllib.parse
from datetime import datetime

PORT = 8080
BILLS_DIR = os.path.join(os.path.dirname(__file__), 'bills')

if not os.path.exists(BILLS_DIR):
    os.makedirs(BILLS_DIR)

class KPLRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_POST(self):
        if self.path == '/api/create-invoice-bill':
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            
            try:
                data = json.loads(post_data.decode('utf-8'))
                order_id = data.get('id', f"KPL-{int(datetime.now().timestamp())}")
                cust_name = data.get('customer', {}).get('name', 'Customer')
                cust_phone = data.get('customer', {}).get('phone', '')
                items = data.get('items', [])
                total = data.get('total', 0)
                date_str = datetime.now().strftime("%d/%m/%Y %I:%M %p")

                # Generate standalone HTML Bill File
                items_html = ""
                for idx, item in enumerate(items, 1):
                    pack = item.get('packInfo', '1 Pc')
                    subtotal = item.get('subtotal', item.get('price', 0) * item.get('qty', 1))
                    items_html += f"""
                    <tr>
                        <td style="padding:10px;border-bottom:1px solid #ddd;">{idx}</td>
                        <td style="padding:10px;border-bottom:1px solid #ddd;"><b>{item.get('name')}</b></td>
                        <td style="padding:10px;border-bottom:1px solid #ddd;"><small>{pack}</small></td>
                        <td style="padding:10px;border-bottom:1px solid #ddd;">{item.get('qty')}</td>
                        <td style="padding:10px;border-bottom:1px solid #ddd;">₹{item.get('price')}</td>
                        <td style="padding:10px;border-bottom:1px solid #ddd;text-align:right;"><b>₹{subtotal}</b></td>
                    </tr>
                    """

                html_bill = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>KPL Crackers Bill - {order_id}</title>
    <style>
        body {{ font-family: 'Poppins', Arial, sans-serif; background: #f4f6f9; margin: 0; padding: 20px; color: #0c2341; }}
        .bill-card {{ max-width: 650px; margin: auto; background: #fff; border-radius: 12px; padding: 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); border-top: 5px solid #ed1830; }}
        .header {{ display: flex; justify-content: space-between; border-bottom: 2px solid #061d3a; padding-bottom: 15px; margin-bottom: 20px; }}
        .logo {{ font-size: 26px; font-weight: 800; color: #ed1830; }}
        .meta {{ text-align: right; font-size: 13px; color: #555; }}
        .cust-info {{ background: #fff0f0; border-left: 4px solid #ed1830; padding: 12px; border-radius: 6px; margin-bottom: 20px; font-size: 14px; }}
        table {{ width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px; }}
        th {{ background: #061d3a; color: #fff; padding: 10px; text-align: left; }}
        th:last-child {{ text-align: right; }}
        .total-box {{ text-align: right; font-size: 22px; font-weight: 800; color: #ed1830; margin-top: 15px; border-top: 2px solid #061d3a; padding-top: 10px; }}
        .footer {{ text-align: center; margin-top: 30px; font-size: 12px; color: #777; border-top: 1px dashed #ccc; padding-top: 15px; }}
    </style>
</head>
<body>
    <div class="bill-card">
        <div class="header">
            <div>
                <div class="logo">KPL CRACKERS</div>
                <div style="font-size:12px;color:#666;">Bright Celebrations • Quality Crackers</div>
            </div>
            <div class="meta">
                <h2 style="margin:0;color:#ed1830;">ESTIMATE BILL</h2>
                <b>Order No:</b> {order_id}<br>
                <b>Date:</b> {date_str}<br>
                <b>WhatsApp:</b> +91 7538837392
            </div>
        </div>
        <div class="cust-info">
            <b>Customer Name:</b> {cust_name} | <b>Mobile Phone:</b> {cust_phone}
        </div>
        <table>
            <thead>
                <tr>
                    <th>#</th>
                    <th>Product</th>
                    <th>Pack</th>
                    <th>Qty</th>
                    <th>Rate</th>
                    <th style="text-align:right;">Total</th>
                </tr>
            </thead>
            <tbody>
                {items_html}
            </tbody>
        </table>
        <div class="total-box">
            Grand Total: ₹{total}
        </div>
        <div class="footer">
            ✨ Thank you for shopping with KPL Crackers! Wish you a safe & happy Diwali! ✨<br>
            Focus4 Product and Service based company
        </div>
    </div>
</body>
</html>
"""

                filename = f"KPL_Bill_{order_id}.html"
                filepath = os.path.join(BILLS_DIR, filename)
                with open(filepath, "w", encoding="utf-8") as f:
                    f.write(html_bill)

                bill_url = f"http://localhost:8080/bills/{filename}"

                response = {
                    "status": "success",
                    "order_id": order_id,
                    "bill_url": bill_url,
                    "filename": filename
                }

                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(response).encode('utf-8'))
                return

            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "error", "message": str(e)}).encode('utf-8'))
                return

        super().do_GET()

if __name__ == "__main__":
    os.chdir(os.path.dirname(__file__))
    with socketserver.TCPServer(("", PORT), KPLRequestHandler) as httpd:
        print(f"KPL Server running on http://localhost:{PORT}")
        httpd.serve_forever()
