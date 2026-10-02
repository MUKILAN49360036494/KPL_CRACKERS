const STORE_PRODUCTS="kpl_products_v1", STORE_ORDERS="kpl_orders_v1", AUTH_KEY="kpl_admin_session_auth";

// Precomputed SHA-256 hashes of "USER_ID:PASSWORD" for encrypted security
// User 1: KPLCRACKERS / @KPL4!
// User 2: MUKILAN4 / M4@F4V
const ENCRYPTED_AUTH_HASHES=[
 "8dfc6d9670eb8972ec226bb872658efdf3cbe54020a45eb578ca5e100fce9d34",
 "e00fbffcf35ed2bd06a72e8e50bdf60cbdf077bdfd9db3ebc69f23497d391aa5"
];

const SAMPLE_PRODUCTS=[
 {id:"p1",name:"Spin Master Mini Red & Green",price:65,quantity:"1 Box - 10 pcs",category:"Ground Chakkars",image:"",description:"1 Box - 10 pcs",order:1},
 {id:"p2",name:"Spin Master Max Red & Green",price:124,quantity:"1 Box - 10 pcs",category:"Ground Chakkars",image:"",description:"1 Box - 10 pcs",order:2},
 {id:"p3",name:'4" Elephant Lakshmi Dlx',price:180,quantity:"1 Pkt - 5 Pieces",category:"Crackers",image:"",description:"1 Pkt - 5 Pieces",order:3},
 {id:"p4",name:"Color Fountain",price:95,quantity:"1 Box - 5 pcs",category:"Fountains",image:"",description:"1 Box",order:4},
 {id:"p5",name:"Rocket Special",price:150,quantity:"1 Box - 10 pcs",category:"Rockets",image:"",description:"1 Box",order:5},
 {id:"p6",name:"Electric Sparklers",price:75,quantity:"1 Pkt - 10 pcs",category:"Sparklers",image:"",description:"10 pcs",order:6},
 {id:"p7",name:"Diwali Gift Box",price:499,quantity:"1 Box",category:"Gift Boxes",image:"",description:"Family celebration pack",order:7},
 {id:"p8",name:"Special Combo Pack",price:999,quantity:"1 Combo Pack",category:"Special Combo Packs",image:"",description:"Festival combo",order:8}
];

let products=load(STORE_PRODUCTS,SAMPLE_PRODUCTS);
let currentBase64Image="";
let orderIdToDelete=null;

function load(k,f){try{const x=localStorage.getItem(k);return x?JSON.parse(x):f}catch(e){return f}}
function save(k,v){localStorage.setItem(k,JSON.stringify(v))}
function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}
function money(n){return "₹"+Number(n||0).toLocaleString("en-IN",{maximumFractionDigits:2})}
function refreshStats(){document.getElementById("statProducts").textContent=products.length;document.getElementById("statCategories").textContent=new Set(products.map(p=>p.category)).size}

// Cryptographic SHA-256 Hashing helper
async function sha256(str){
 if(window.crypto && crypto.subtle){
  const buffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
 }
 // Fallback hash function
 let hash = 0;
 for (let i = 0; i < str.length; i++) {
  hash = ((hash << 5) - hash) + str.charCodeAt(i);
  hash |= 0;
 }
 return hash.toString();
}

let failedAttempts = 0;
let lockoutTimer = null;

function checkAuthSession(){
 const isAuth = sessionStorage.getItem(AUTH_KEY);
 const loginOverlay = document.getElementById("adminLoginOverlay");
 const mainContent = document.getElementById("adminMainContent");
 const logoutBtn = document.getElementById("adminLogoutBtn");

 if(isAuth === "true"){
  if(loginOverlay) loginOverlay.classList.add("hidden");
  if(mainContent) mainContent.classList.remove("hidden");
  if(logoutBtn) logoutBtn.classList.remove("hidden");
  renderAll();
 }else{
  if(loginOverlay) loginOverlay.classList.remove("hidden");
  if(mainContent) mainContent.classList.add("hidden");
  if(logoutBtn) logoutBtn.classList.add("hidden");
 }
}

async function handleAdminLogin(e){
 e.preventDefault();

 const errBox = document.getElementById("loginErrorMsg");
 const submitBtn = e.target.querySelector("button[type='submit']");

 if(failedAttempts >= 5){
  if(errBox){
   errBox.textContent = "⚠️ Too many failed attempts. Locked out for 30 seconds for security.";
   errBox.classList.remove("hidden");
  }
  return;
 }

 const uId = document.getElementById("loginUserId")?.value.trim() || "";
 const uPass = document.getElementById("loginPassword")?.value.trim() || "";

 const combo = `${uId.toUpperCase()}:${uPass}`;
 const hash = await sha256(combo);

 const isUser1 = (uId.toUpperCase() === "KPLCRACKERS" && uPass === "@KPL4!");
 const isUser2 = (uId.toUpperCase() === "MUKILAN4" && uPass === "M4@F4V");
 const isValidHash = ENCRYPTED_AUTH_HASHES.includes(hash);

 if(isValidHash || isUser1 || isUser2){
  failedAttempts = 0;
  sessionStorage.setItem(AUTH_KEY, "true");
  if(errBox) errBox.classList.add("hidden");
  document.getElementById("adminLoginForm").reset();
  checkAuthSession();
 }else{
  failedAttempts++;
  if(failedAttempts >= 5){
   if(errBox){
    errBox.textContent = "🚫 Security Alert: 5 failed attempts! Locked out for 30 seconds.";
    errBox.classList.remove("hidden");
   }
   if(submitBtn) submitBtn.disabled = true;
   lockoutTimer = setTimeout(() => {
    failedAttempts = 0;
    if(submitBtn) submitBtn.disabled = false;
    if(errBox) errBox.classList.add("hidden");
   }, 30000);
  }else{
   if(errBox){
    errBox.textContent = `❌ Invalid User ID or Password. (${5 - failedAttempts} attempts remaining)`;
    errBox.classList.remove("hidden");
   }
  }
 }
}

function handleAdminLogout(){
 sessionStorage.removeItem(AUTH_KEY);
 checkAuthSession();
}

function updateImagePreview(src){
 const box=document.getElementById("imagePreviewContainer"), img=document.getElementById("imagePreview");
 if(src){img.src=src;box.classList.remove("hidden");}else{box.classList.add("hidden");img.src="";}
}

function renderProducts(){
 const body=document.getElementById("adminProductList");
 body.innerHTML=products.slice().sort((a,b)=>(a.order||0)-(b.order||0)).map(p=>`<tr>
   <td>${p.image?`<img src="${esc(p.image)}" alt="${esc(p.name)}">`:"🎆"}</td>
   <td><b>${esc(p.name)}</b><br><small>${esc(p.description||"")}</small></td>
   <td>${esc(p.category)}</td>
   <td><b>${money(p.price)}</b></td>
   <td><small>${esc(p.quantity||"1 Pc")}</small></td>
   <td>
     <button class="action-btn edit" onclick="editProduct('${p.id}')">Edit</button>
     <button class="action-btn delete" onclick="deleteProduct('${p.id}')">Delete</button>
   </td>
 </tr>`).join("")||`<tr><td colspan="6">No products.</td></tr>`;
}

function resetForm(){
 document.getElementById("productForm").reset();
 document.getElementById("productId").value="";
 document.getElementById("productQuantity").value="";
 document.getElementById("productOrder").value=products.length+1;
 document.getElementById("formTitle").textContent="Add Product";
 document.getElementById("saveProductBtn").textContent="Add Product";
 currentBase64Image="";
 updateImagePreview("");
}

function editProduct(id){
 const p=products.find(x=>x.id===id);if(!p)return;
 document.getElementById("productId").value=p.id;
 document.getElementById("productName").value=p.name;
 document.getElementById("productPrice").value=p.price;
 document.getElementById("productQuantity").value=p.quantity||p.description||"";
 document.getElementById("productCategory").value=p.category;
 document.getElementById("productImage").value=p.image||"";
 document.getElementById("productDescription").value=p.description||"";
 document.getElementById("productOrder").value=p.order||0;
 document.getElementById("formTitle").textContent="Edit Product";
 document.getElementById("saveProductBtn").textContent="Update Product";
 currentBase64Image=p.image||"";
 updateImagePreview(p.image||"");
 window.scrollTo({top:0,behavior:"smooth"});
}

function deleteProduct(id){
 const p=products.find(x=>x.id===id);if(!p)return;
 if(confirm(`Delete "${p.name}"?`)){products=products.filter(x=>x.id!==id);save(STORE_PRODUCTS,products);renderAll()}
}

function renderOrders(){
 const orders=load(STORE_ORDERS,[]), el=document.getElementById("ordersList");
 if(!orders.length){
  el.innerHTML='<div class="empty">No recent orders found.</div>';
  return;
 }

 el.innerHTML=orders.slice(0,30).map(o=>`
  <div class="order-row">
    <div>
      <b>${esc(o.id)}</b>
      <span class="order-date">• ${new Date(o.date).toLocaleString("en-IN")}</span><br>
      <small><b>Customer:</b> ${esc(o.customer?.name||"N/A")} (${esc(o.customer?.phone||"N/A")})</small><br>
      <small class="order-items-summary">${o.items.map(i=>`${esc(i.name)} × ${i.qty}`).join(", ")}</small>
    </div>
    <div class="order-right-actions">
      <strong>${money(o.total)}</strong>
      <div class="order-btn-group">
        <button class="action-btn edit" onclick="viewOrderInvoice('${esc(o.id)}')">👁️ View</button>
        <button class="action-btn delete" onclick="promptDeleteOrder('${esc(o.id)}')">🗑️ Delete</button>
      </div>
    </div>
  </div>
 `).join("");
}

function viewOrderInvoice(orderId){
 const orders=load(STORE_ORDERS,[]);
 const o=orders.find(x=>x.id===orderId);
 if(!o)return;

 const dateStr=new Date(o.date).toLocaleDateString("en-IN",{day:"2-digit",month:"2-digit",year:"numeric"});
 const timeStr=new Date(o.date).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"});

 document.getElementById("adminOrderInvoiceContent").innerHTML=`
 <div class="printable-invoice">
   <div class="invoice-header">
     <div>
       <img src="assets/logo.svg" alt="KPL Crackers" class="invoice-logo">
       <p class="invoice-tagline">Bright Celebrations • Quality Crackers</p>
     </div>
     <div class="invoice-meta">
       <h2 class="invoice-title">ESTIMATE RECEIPT</h2>
       <b>Order No:</b> ${esc(o.id)}<br>
       <b>Date:</b> ${dateStr} ${timeStr}<br>
       <b>WhatsApp Contact:</b> +91 7538837392
     </div>
   </div>
   <div class="customer-receipt-info"><b>Customer Name:</b> ${esc(o.customer?.name||"N/A")} | <b>Phone:</b> ${esc(o.customer?.phone||"N/A")}</div>
   <table class="invoice-table">
     <thead>
       <tr>
         <th>#</th>
         <th>Product Description</th>
         <th>Pack Details</th>
         <th>Qty</th>
         <th>Rate / Pc (₹)</th>
         <th>Subtotal (₹)</th>
       </tr>
     </thead>
     <tbody>
       ${o.items.map((x,idx)=>`
         <tr>
           <td>${idx+1}</td>
           <td><b>${esc(x.name)}</b></td>
           <td><small>${esc(x.packInfo||"1 Pc")}</small></td>
           <td>${x.qty}</td>
           <td>${money(x.price)}</td>
           <td><b>${money(x.subtotal||x.price*x.qty)}</b></td>
         </tr>
       `).join("")}
     </tbody>
   </table>
   <div class="invoice-summary-box">
     <div class="summary-line"><span>Total Items:</span> <b>${o.items.reduce((a,b)=>a+b.qty,0)}</b></div>
     <div class="summary-line grand-total"><span>Grand Total Subtotal:</span> <b>${money(o.total)}</b></div>
   </div>
 </div>`;

 document.getElementById("adminOrderModal").classList.remove("hidden");
}

function promptDeleteOrder(orderId){
 orderIdToDelete=orderId;
 document.getElementById("deleteConfirmModal").classList.remove("hidden");
}

function confirmDeleteOrder(){
 if(!orderIdToDelete)return;
 let orders=load(STORE_ORDERS,[]);
 orders=orders.filter(x=>x.id!==orderIdToDelete);
 save(STORE_ORDERS,orders);
 orderIdToDelete=null;
 document.getElementById("deleteConfirmModal").classList.add("hidden");
 renderOrders();
}

function renderAll(){refreshStats();renderProducts();renderOrders()}

document.addEventListener("DOMContentLoaded",()=>{
 document.getElementById("productOrder").value=products.length+1;
 checkAuthSession();
 window.addEventListener("storage", renderAll);

 const loginForm=document.getElementById("adminLoginForm");
 if(loginForm) loginForm.onsubmit=handleAdminLogin;

 const togglePassBtn=document.getElementById("togglePasswordBtn");
 const passInput=document.getElementById("loginPassword");
 if(togglePassBtn && passInput){
  togglePassBtn.onclick=()=>{
   if(passInput.type==="password"){
    passInput.type="text";
    togglePassBtn.textContent="🙈";
   }else{
    passInput.type="password";
    togglePassBtn.textContent="👁️";
   }
  };
 }

 const logoutBtn=document.getElementById("adminLogoutBtn");
 if(logoutBtn) logoutBtn.onclick=handleAdminLogout;

 const fileInput=document.getElementById("productImageFile");
 const urlInput=document.getElementById("productImage");

 if(fileInput){
  fileInput.addEventListener("change",e=>{
   const file=e.target.files[0];
   if(file){
    const reader=new FileReader();
    reader.onload=evt=>{
     currentBase64Image=evt.target.result;
     urlInput.value="";
     updateImagePreview(currentBase64Image);
    };
    reader.readAsDataURL(file);
   }
  });
 }

 if(urlInput){
  urlInput.addEventListener("input",e=>{
   const val=e.target.value.trim();
   if(val){
    currentBase64Image=val;
    if(fileInput)fileInput.value="";
    updateImagePreview(val);
   }
  });
 }

 document.getElementById("productForm").onsubmit=e=>{
  e.preventDefault();
  const id=document.getElementById("productId").value||"p_"+Date.now();
  const imageUrl=currentBase64Image || document.getElementById("productImage").value.trim();
  const item={
   id,
   name:document.getElementById("productName").value.trim(),
   price:Number(document.getElementById("productPrice").value),
   quantity:document.getElementById("productQuantity").value.trim()||"1 Box/Pkt",
   category:document.getElementById("productCategory").value.trim(),
   image:imageUrl,
   description:document.getElementById("productDescription").value.trim()||document.getElementById("productQuantity").value.trim(),
   order:Number(document.getElementById("productOrder").value)||0
  };
  const idx=products.findIndex(p=>p.id===id);
  if(idx>=0)products[idx]=item;else products.push(item);
  save(STORE_PRODUCTS,products);
  resetForm();
  renderAll();
  alert(idx>=0?"Product updated successfully!":"Product added successfully!");
 };

 document.getElementById("resetForm").onclick=resetForm;
 document.getElementById("seedProducts").onclick=()=>{if(confirm("Load sample products? This will replace your current product list.")){products=SAMPLE_PRODUCTS;save(STORE_PRODUCTS,products);renderAll()}};
 document.getElementById("clearOrders").onclick=()=>{
  orderIdToDelete="ALL";
  document.getElementById("deleteConfirmModal").classList.remove("hidden");
 };

 document.getElementById("closeAdminOrderModal").onclick=()=>document.getElementById("adminOrderModal").classList.add("hidden");
 document.getElementById("cancelDeleteBtn").onclick=()=>{
  orderIdToDelete=null;
  document.getElementById("deleteConfirmModal").classList.add("hidden");
 };
 document.getElementById("confirmDeleteBtn").onclick=()=>{
  if(orderIdToDelete==="ALL"){
   localStorage.removeItem(STORE_ORDERS);
   orderIdToDelete=null;
   document.getElementById("deleteConfirmModal").classList.add("hidden");
   renderOrders();
  }else{
   confirmDeleteOrder();
  }
 };
});