const STORE_ORDERS="kpl_orders_v1";

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

let products=[];
let currentBase64Image="";
let orderIdToDelete=null;
let productsChannel=null;

function load(k,f){try{const x=localStorage.getItem(k);return x?JSON.parse(x):f}catch(e){return f}}
function save(k,v){localStorage.setItem(k,JSON.stringify(v))}
function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}
function money(n){return "₹"+Number(n||0).toLocaleString("en-IN",{maximumFractionDigits:2})}
function refreshStats(){document.getElementById("statProducts").textContent=products.length;document.getElementById("statCategories").textContent=new Set(products.map(p=>p.category)).size}

async function checkAuthSession(){
 const {data,error}=await window.KPLSupabase.auth.getSession();
 if(error)throw error;
 const session=data.session;
 const loginOverlay = document.getElementById("adminLoginOverlay");
 const mainContent = document.getElementById("adminMainContent");
 const logoutBtn = document.getElementById("adminLogoutBtn");

 if(session && session.user.app_metadata?.role==="admin"){
  if(loginOverlay) loginOverlay.classList.add("hidden");
  if(mainContent) mainContent.classList.remove("hidden");
  if(logoutBtn) logoutBtn.classList.remove("hidden");
  await loadProducts();
  renderAll();
  if(productsChannel)window.KPLSupabase.removeChannel(productsChannel);
  productsChannel=window.KPLSupabase.channel("admin-products")
   .on("postgres_changes",{event:"*",schema:"public",table:"products"},()=>{
    loadProducts().then(renderAll).catch(error=>{
     console.error("Could not refresh admin products:",error);
    });
   })
   .subscribe();
 }else{
  if(session) await window.KPLSupabase.auth.signOut();
  if(loginOverlay) loginOverlay.classList.remove("hidden");
  if(mainContent) mainContent.classList.add("hidden");
  if(logoutBtn) logoutBtn.classList.add("hidden");
  if(session){
   const errBox=document.getElementById("loginErrorMsg");
   errBox.textContent="This account is not authorized as an administrator.";
   errBox.classList.remove("hidden");
  }
 }
}

async function loadProducts(){
 const {data,error}=await window.KPLSupabase.from("products").select("*").order("sort_order");
 if(error)throw error;
 products=data.map(p=>({...p,order:p.sort_order}));
}

async function handleAdminLogin(e){
 e.preventDefault();

 const errBox = document.getElementById("loginErrorMsg");
 const submitBtn = e.target.querySelector("button[type='submit']");
 submitBtn.disabled=true;
 try{
  const {error}=await window.KPLSupabase.auth.signInWithPassword({
   email:document.getElementById("loginUserId").value.trim(),
   password:document.getElementById("loginPassword").value
  });
  if(error)throw error;
  if(errBox)errBox.classList.add("hidden");
  document.getElementById("adminLoginForm").reset();
  await checkAuthSession();
 }catch(error){
  if(errBox){
   errBox.textContent=error.message||"Login failed. Check your email and password.";
   errBox.classList.remove("hidden");
  }
 }finally{
  submitBtn.disabled=false;
 }
}

async function handleAdminLogout(){
 const {error}=await window.KPLSupabase.auth.signOut();
 if(error)throw error;
 if(productsChannel)window.KPLSupabase.removeChannel(productsChannel);
 await checkAuthSession();
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
 if(confirm(`Delete "${p.name}"?`)){
  window.KPLSupabase.from("products").delete().eq("id",id).then(async({error})=>{
   if(error)throw error;
   await loadProducts();
   renderAll();
  }).catch(error=>alert(`Could not delete product: ${error.message}`));
 }
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
 checkAuthSession().catch(error=>{
  console.error("Could not initialize admin:",error);
  const errBox=document.getElementById("loginErrorMsg");
  errBox.textContent=`Could not connect to the product database: ${error.message}`;
  errBox.classList.remove("hidden");
 });

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
 if(logoutBtn) logoutBtn.onclick=()=>handleAdminLogout().catch(error=>{
  alert(`Could not log out: ${error.message}`);
 });

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
  const row={...item,sort_order:item.order};
  delete row.order;
  const saveButton=document.getElementById("saveProductBtn");
  saveButton.disabled=true;
  window.KPLSupabase.from("products").upsert(row).then(async({error})=>{
   if(error)throw error;
   await loadProducts();
   resetForm();
   renderAll();
   alert(idx>=0?"Product updated successfully!":"Product added successfully!");
  }).catch(error=>alert(`Could not save product: ${error.message}`)).finally(()=>{
   saveButton.disabled=false;
  });
 };

 document.getElementById("resetForm").onclick=resetForm;
 document.getElementById("seedProducts").onclick=async()=>{
  if(!confirm("Load sample products? This will add or update the sample products."))return;
  try{
   const rows=SAMPLE_PRODUCTS.map(({order,...p})=>({...p,sort_order:order}));
   const {error}=await window.KPLSupabase.from("products").upsert(rows);
   if(error)throw error;
   await loadProducts();
   renderAll();
  }catch(error){
   alert(`Could not load sample products: ${error.message}`);
  }
 };
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