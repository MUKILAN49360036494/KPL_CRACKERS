const STORE_CART="kpl_cart_v1", STORE_ORDERS="kpl_orders_v1";
const WA_NUMBER="917538837392";

let products=[], cart=load(STORE_CART,{}), activeCategory="All", searchTerm="";

function load(k,f){try{const x=localStorage.getItem(k);return x?JSON.parse(x):f}catch(e){return f}}
function save(k,v){localStorage.setItem(k,JSON.stringify(v))}
function money(n){return "₹"+Number(n||0).toLocaleString("en-IN",{maximumFractionDigits:2})}
function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}
function placeholder(category){return `<div class="placeholder" title="${esc(category)}">🎆</div>`}

function renderCategories(){
 const cats=["All",...new Set(products.map(p=>p.category).filter(Boolean))];
 document.getElementById("categoryRow").innerHTML=cats.map(c=>`<button class="category-btn ${c===activeCategory?"active":""}" data-cat="${esc(c)}">${esc(c)}</button>`).join("");
 document.querySelectorAll(".category-btn").forEach(b=>b.onclick=()=>{activeCategory=b.dataset.cat;renderAll()});
}

function renderProducts(){
 const q=searchTerm.toLowerCase();
 const list=products.filter(p=>(activeCategory==="All"||p.category===activeCategory)&&(!q||(`${p.name} ${p.category} ${p.description||""} ${p.quantity||""}`).toLowerCase().includes(q))).sort((a,b)=>(a.order||0)-(b.order||0));
 const grid=document.getElementById("productGrid"), empty=document.getElementById("emptyState");
 empty.classList.toggle("hidden",list.length>0);

 grid.innerHTML=list.map(p=>{
  const packInfo=p.quantity||p.description||"1 Pc";
  return `<article class="product-card">
   <div class="product-img">${p.image?`<img src="${esc(p.image)}" alt="${esc(p.name)}" onerror="this.style.display='none';this.nextElementSibling.style.display='block'"><span style="display:none">${placeholder(p.category)}</span>`:placeholder(p.category)}</div>
   <div class="product-body">
     <div class="product-category">${esc(p.category)}</div>
     <h3 class="product-name">${esc(p.name)}</h3>
     <div class="product-desc">${esc(packInfo)}</div>
     <div class="price-row">
       <div class="price">${money(p.price)}</div>
       <small class="price-unit">per piece / pack</small>
     </div>
     <div class="qty-row">
       <div class="qty-stepper">
         <button type="button" onclick="adjustCardQty('${esc(p.id)}', -1)">−</button>
         <input type="number" id="qty-${esc(p.id)}" value="1" min="1" max="99">
         <button type="button" onclick="adjustCardQty('${esc(p.id)}', 1)">+</button>
       </div>
       <button class="btn btn-primary add-btn" onclick="addToCart('${esc(p.id)}')">Add to Cart</button>
     </div>
   </div>
 </article>`;
 }).join("");
}

function adjustCardQty(id, delta){
 const inp=document.getElementById("qty-"+id);
 if(!inp)return;
 let val=parseInt(inp.value)||1;
 val=Math.max(1, Math.min(99, val+delta));
 inp.value=val;
}

function addToCart(id){
 const p=products.find(x=>x.id===id); if(!p)return;
 const inp=document.getElementById("qty-"+id);
 const qtyToAdd=Math.max(1, parseInt(inp?.value)||1);
 const currentQty=cart[id]||0;
 cart[id]=currentQty+qtyToAdd;
 save(STORE_CART,cart);
 updateCartUI();
 openCart();
}

function setQty(id,q){
 if(q<=0)delete cart[id];
 else cart[id]=q;
 save(STORE_CART,cart);
 updateCartUI();
 renderCart();
}

function updateCartUI(){
 let count=0, total=0;
 Object.entries(cart).forEach(([id,qty])=>{
  const p=products.find(x=>x.id===id);
  if(p){
   count+=qty;
   total+=p.price*qty;
  }
 });

 const topCount=document.getElementById("cartCountTop");
 const topSubtotal=document.getElementById("cartSubtotalTop");
 const itemsCount=document.getElementById("cartItemsCount");
 const cartTotal=document.getElementById("cartTotal");
 const stickyBar=document.getElementById("stickyCartBar");
 const stickyCount=document.getElementById("stickyCartCount");
 const stickyTotal=document.getElementById("stickyCartTotal");

 if(topCount) topCount.textContent=count;
 if(topSubtotal) topSubtotal.textContent=money(total);
 if(itemsCount) itemsCount.textContent=count;
 if(cartTotal) cartTotal.textContent=money(total);

 if(stickyBar){
  if(count>0){
   stickyBar.classList.remove("hidden");
   if(stickyCount) stickyCount.textContent=count;
   if(stickyTotal) stickyTotal.textContent=money(total);
  }else{
   stickyBar.classList.add("hidden");
  }
 }
}

function renderCart(){
 const el=document.getElementById("cartItems");
 const entries=Object.entries(cart).map(([id,qty])=>({p:products.find(x=>x.id===id),qty})).filter(x=>x.p);
 let total=0;
 if(!entries.length){
  el.innerHTML='<div class="empty">Your cart is empty. Please add items to proceed.</div>';
  document.getElementById("cartTotal").textContent=money(0);
  return;
 }
 el.innerHTML=entries.map(({p,qty})=>{
  const sub=p.price*qty;
  total+=sub;
  return `<div class="cart-item">
    <div class="cart-item-img">${p.image?`<img src="${esc(p.image)}" alt="">`:"🎆"}</div>
    <div class="cart-item-info">
      <h4>${esc(p.name)}</h4>
      <small>${money(p.price)} / piece (${esc(p.quantity||p.description||"")})</small>
      <div class="cart-qty">
        <button onclick="setQty('${p.id}',${qty-1})">−</button>
        <b>${qty}</b>
        <button onclick="setQty('${p.id}',${qty+1})">+</button>
      </div>
    </div>
    <div class="cart-item-right">
      <b>${money(sub)}</b>
    </div>
  </div>`;
 }).join("");
 document.getElementById("cartTotal").textContent=money(total);
}

function openCart(){
 document.getElementById("cartDrawer").classList.add("open");
 document.getElementById("cartDrawer").setAttribute("aria-hidden","false");
 renderCart();
}

function closeCart(){
 document.getElementById("cartDrawer").classList.remove("open");
}

function makeInvoice(){
 const entries=Object.entries(cart).map(([id,qty])=>({p:products.find(x=>x.id===id),qty})).filter(x=>x.p);
 if(!entries.length){
  alert("Your cart is empty! Please add products before placing an order.");
  return;
 }
 let total=0;
 entries.forEach(x=>total+=x.p.price*x.qty);

 const custName=document.getElementById("custName")?.value.trim()||"";
 const custPhone=document.getElementById("custPhone")?.value.trim()||"";

 const now=new Date();
 const orderNo="KPL-"+now.getFullYear()+String(now.getMonth()+1).padStart(2,"0")+String(now.getDate()).padStart(2,"0")+"-"+Math.floor(1000+Math.random()*9000);
 const order={
  id:orderNo,
  date:now.toISOString(),
  customer:{name:custName, phone:custPhone},
  items:entries.map(x=>({id:x.p.id,name:x.p.name,packInfo:x.p.quantity||x.p.description||"",price:x.p.price,qty:x.qty,subtotal:x.p.price*x.qty})),
  total
 };

 const orders=load(STORE_ORDERS,[]);
 orders.unshift(order);
 save(STORE_ORDERS,orders.slice(0,50));

 const dateStr=now.toLocaleDateString("en-IN",{day:"2-digit",month:"2-digit",year:"numeric"});
 const timeStr=now.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"});

 document.getElementById("invoiceContent").innerHTML=`
 <div class="printable-invoice">
   <div class="invoice-header">
     <div>
       <img src="assets/logo.svg" alt="KPL Crackers" class="invoice-logo">
       <p class="invoice-tagline">Bright Celebrations • Quality Crackers</p>
     </div>
     <div class="invoice-meta">
       <h2 class="invoice-title">ESTIMATE RECEIPT</h2>
       <b>Order No:</b> ${orderNo}<br>
       <b>Date:</b> ${dateStr} ${timeStr}<br>
       <b>WhatsApp Contact:</b> +91 7538837392
     </div>
   </div>
   ${(custName || custPhone)?`<div class="customer-receipt-info"><b>Customer Name:</b> ${esc(custName||"N/A")} | <b>Phone:</b> ${esc(custPhone||"N/A")}</div>`:""}
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
       ${entries.map((x,idx)=>`
         <tr>
           <td>${idx+1}</td>
           <td><b>${esc(x.p.name)}</b></td>
           <td><small>${esc(x.p.quantity||x.p.description||"1 Pc")}</small></td>
           <td>${x.qty}</td>
           <td>${money(x.p.price)}</td>
           <td><b>${money(x.p.price*x.qty)}</b></td>
         </tr>
       `).join("")}
     </tbody>
   </table>
   <div class="invoice-summary-box">
     <div class="summary-line"><span>Total Items:</span> <b>${entries.reduce((a,b)=>a+b.qty,0)}</b></div>
     <div class="summary-line grand-total"><span>Grand Total Subtotal:</span> <b>${money(total)}</b></div>
   </div>
   <div class="invoice-footer-note">
     <p>✨ <i>Thank you for shopping with KPL Crackers! We wish you a safe & bright celebration.</i></p>
     <p><small>Note: Click "Send Invoice on WhatsApp" to send this exact order estimate to +91 7538837392 for instant confirmation.</small></p>
   </div>
 </div>`;

 document.getElementById("invoiceModal").classList.remove("hidden");
 window.currentOrder=order;
 closeCart();
}

function initHeroCanvas(){
 const canvas=document.getElementById("heroCanvas");
 if(!canvas)return;
 const ctx=canvas.getContext("2d");
 let width=canvas.width=canvas.parentElement.offsetWidth;
 let height=canvas.height=canvas.parentElement.offsetHeight;

 window.addEventListener("resize",()=>{
  if(!canvas.parentElement)return;
  width=canvas.width=canvas.parentElement.offsetWidth;
  height=canvas.height=canvas.parentElement.offsetHeight;
 });

 // 3D Stars
 const stars=[];
 const numStars=120;
 for(let i=0;i<numStars;i++){
  stars.push({
   x:(Math.random()-0.5)*width*2,
   y:(Math.random()-0.5)*height*2,
   z:Math.random()*width,
   size:Math.random()*1.8+0.5,
   opacity:Math.random()*0.8+0.2
  });
 }

 // Fireworks Particles
 const particles=[];
 const rockets=[];
 const colors=["#ff3366","#ffcc00","#33ccff","#ff9900","#cc33ff","#33ff99","#ffffff","#ff5500"];

 function createFirework(x, y){
  const count=45;
  const color=colors[Math.floor(Math.random()*colors.length)];
  for(let i=0;i<count;i++){
   const angle=Math.random()*Math.PI*2;
   const speed=Math.random()*5+1.5;
   particles.push({
    x:x,
    y:y,
    vx:Math.cos(angle)*speed,
    vy:Math.sin(angle)*speed,
    color:color,
    alpha:1,
    decay:Math.random()*0.025+0.015,
    size:Math.random()*3+1
   });
  }
 }

 function launchRandomRocket(){
  if(rockets.length<3 && Math.random()<0.04){
   rockets.push({
    x:Math.random()*(width*0.8)+width*0.1,
    y:height,
    targetY:Math.random()*(height*0.4)+height*0.1,
    speed:Math.random()*4+5,
    color:colors[Math.floor(Math.random()*colors.length)]
   });
  }
 }

 // Interactive mouse/touch tracking
 const heroElem=canvas.parentElement;
 function triggerUserFirework(e){
  const rect=heroElem.getBoundingClientRect();
  const x=(e.clientX || (e.touches && e.touches[0].clientX))-rect.left;
  const y=(e.clientY || (e.touches && e.touches[0].clientY))-rect.top;
  if(x>=0 && x<=width && y>=0 && y<=height){
   createFirework(x, y);
  }
 }

 heroElem.addEventListener("mousemove", (e)=>{
  if(Math.random()<0.25) triggerUserFirework(e);
 });
 heroElem.addEventListener("click", triggerUserFirework);
 heroElem.addEventListener("touchstart", triggerUserFirework, {passive:true});

 function animate(){
  ctx.clearRect(0,0,width,height);

  // Render 3D Starfield
  const cx=width/2, cy=height/2;
  stars.forEach(s=>{
   s.z -= 0.6;
   if(s.z<=0) s.z=width;
   const k=250/s.z;
   const px=s.x*k+cx;
   const py=s.y*k+cy;
   if(px>=0 && px<=width && py>=0 && py<=height){
    ctx.beginPath();
    ctx.arc(px, py, Math.max(0.5, s.size*k*0.5), 0, Math.PI*2);
    ctx.fillStyle=`rgba(255, 255, 255, ${s.opacity})`;
    ctx.fill();
   }
  });

  // Launch & animate rockets
  launchRandomRocket();
  for(let i=rockets.length-1;i>=0;i--){
   const r=rockets[i];
   r.y -= r.speed;
   ctx.beginPath();
   ctx.arc(r.x, r.y, 2.5, 0, Math.PI*2);
   ctx.fillStyle=r.color;
   ctx.fill();

   if(r.y <= r.targetY){
    createFirework(r.x, r.y);
    rockets.splice(i,1);
   }
  }

  // Animate Firework Particles
  for(let i=particles.length-1;i>=0;i--){
   const p=particles[i];
   p.x += p.vx;
   p.y += p.vy;
   p.vy += 0.08; // Gravity
   p.alpha -= p.decay;

   if(p.alpha<=0){
    particles.splice(i,1);
   }else{
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
    ctx.fillStyle=p.color;
    ctx.globalAlpha=Math.max(0, p.alpha);
    ctx.fill();
    ctx.globalAlpha=1;
   }
  }

  requestAnimationFrame(animate);
 }

 animate();
}

function generateBillImage(element, filename, callback){
 if(typeof html2canvas !== 'undefined'){
  html2canvas(element, { scale: 3, useCORS: true, backgroundColor: '#ffffff' }).then(canvas => {
   canvas.toBlob(blob => {
    // 1. Auto Download Image File
    const link = document.createElement("a");
    link.download = filename;
    link.href = URL.createObjectURL(blob);
    link.click();

    // 2. Try copying HD image to clipboard
    if(navigator.clipboard && window.ClipboardItem){
     try{
      navigator.clipboard.write([
       new ClipboardItem({'image/png': blob})
      ]).catch(e => console.log("Clipboard write error:", e));
     }catch(err){
      console.log("Clipboard not supported:", err);
     }
    }

    if(callback) callback(blob, link.href);
   }, 'image/png');
  }).catch(err => {
   console.error("Canvas image error:", err);
   if(callback) callback(null, null);
  });
 } else if(callback){
  callback(null, null);
 }
}

function addMoreProducts(){
 closeCart();
 const sec=document.getElementById("products");
 if(sec) sec.scrollIntoView({behavior:"smooth"});
}

function saveOrderToStorage(order){
 const orders = load(STORE_ORDERS, []);
 const idx = orders.findIndex(o => o.id === order.id);
 if(idx >= 0){
  orders[idx] = order;
 }else{
  orders.unshift(order);
 }
 save(STORE_ORDERS, orders.slice(0, 50));
 window.dispatchEvent(new Event("storage"));
}

function cleanPhone(raw){
 let digits = String(raw || "").replace(/\D/g, "");
 if(digits.length === 12 && digits.startsWith("91")){
  digits = digits.slice(2);
 }else if(digits.length === 11 && digits.startsWith("0")){
  digits = digits.slice(1);
 }
 return digits;
}

function downloadPDFBill(){
 const el=document.querySelector("#invoiceContent .printable-invoice");
 if(!el){
  alert("Invoice not ready yet. Please click Order Now first.");
  return;
 }
 const orderId=window.currentOrder?.id || "KPL";
 const filename=`KPL-Invoice-${orderId}.pdf`;
 if(typeof html2pdf !== "undefined"){
  html2pdf().set({
   margin:10,
   filename,
   image:{type:"jpeg", quality:0.98},
   html2canvas:{scale:2, useCORS:true, backgroundColor:"#ffffff"},
   jsPDF:{unit:"mm", format:"a4", orientation:"portrait"}
  }).from(el).save();
  return;
 }
 generateBillImage(el, filename.replace(/\.pdf$/,".png"));
}

function openWhatsAppChat(phone, text){
 const encoded=encodeURIComponent(text);
 const waUrl=`https://wa.me/${phone}?text=${encoded}`;
 const a=document.createElement("a");
 a.href=waUrl;
 a.target="_blank";
 a.rel="noopener noreferrer";
 document.body.appendChild(a);
 a.click();
 a.remove();
}

function whatsappOrder(){
 const o=window.currentOrder;
 if(!o){
  alert("No active order found. Please add products to cart and click Order Now.");
  return;
 }

 const custName=document.getElementById("custName")?.value.trim()||"";
 const rawPhone=document.getElementById("custPhone")?.value.trim()||"";
 const errBox=document.getElementById("custFormError");

 const cleanedPhone = cleanPhone(rawPhone);
 const isPhoneValid = /^\d{10}$/.test(cleanedPhone);

 if(!custName || !isPhoneValid){
  if(errBox){
   errBox.textContent = "⚠️ Please enter your Full Name and a valid 10-digit Mobile Number.";
   errBox.classList.remove("hidden");
  }
  const nameInput=document.getElementById("custName");
  const phoneInput=document.getElementById("custPhone");
  if(!custName && nameInput) nameInput.focus();
  else if(!isPhoneValid && phoneInput) phoneInput.focus();
  return;
 }

 if(errBox) errBox.classList.add("hidden");

 o.customer={name:custName, phone:cleanedPhone};
 window.currentOrder = o;
 saveOrderToStorage(o);

 const d = new Date(o.date);
 const dateStr = d.toLocaleDateString("en-IN", {day:"numeric", month:"numeric", year:"numeric"});
 const timeStr = d.toLocaleTimeString("en-IN", {hour:"2-digit", minute:"2-digit", hour12:true}).toLowerCase();

 let msg=`KPL CRACKERS - NEW ORDER INVOICE\n`;
 msg+=`=================================\n`;
 msg+=`Order No: ${o.id}\n`;
 msg+=`Date: ${dateStr}, ${timeStr}\n`;
 msg+=`Customer Name: ${custName}\n`;
 msg+=`Customer Phone: ${cleanedPhone}\n`;
 msg+=`=================================\n\n`;
 msg+=`ORDERED ITEMS:\n`;

 o.items.forEach((item, index)=>{
  msg+=`${index+1}. ${item.name}\n`;
  if(item.packInfo) msg+=`   Pack: ${item.packInfo}\n`;
  msg+=`   Qty: ${item.qty} x ${money(item.price)} = ${money(item.subtotal)}\n\n`;
 });

 msg+=`---------------------------------\n`;
 msg+=`SUBTOTAL / GRAND TOTAL: ${money(o.total)}\n`;
 msg+=`---------------------------------\n\n`;
 msg+=`Please confirm my order and share delivery details. Thank you!`;

 openWhatsAppChat(WA_NUMBER, msg);
}

function renderAll(){
 renderCategories();
 renderProducts();
 updateCartUI();
}

document.addEventListener("DOMContentLoaded",()=>{
 renderAll();
 initHeroCanvas();
 window.KPLSupabase.from("products")
  .select("*")
  .order("sort_order")
  .then(({data,error})=>{
   if(error)throw error;
   document.getElementById("emptyState").textContent="No products found. Add products from the Admin page.";
   products=data.map(p=>({...p,order:p.sort_order}));
   renderAll();
  })
  .catch(error=>{
   console.error("Could not load products from Supabase:",error);
   const empty=document.getElementById("emptyState");
   empty.textContent="Products are temporarily unavailable. Please try again later.";
   empty.classList.remove("hidden");
  });

 window.KPLSupabase.channel("public-products")
  .on("postgres_changes",{event:"*",schema:"public",table:"products"},()=>{
   window.KPLSupabase.from("products")
    .select("*")
    .order("sort_order")
    .then(({data,error})=>{
     if(error)throw error;
     document.getElementById("emptyState").textContent="No products found. Add products from the Admin page.";
     products=data.map(p=>({...p,order:p.sort_order}));
     renderAll();
    })
    .catch(error=>console.error("Could not refresh products:",error));
  })
  .subscribe();

 const nameInp=document.getElementById("custName");
 const phoneInp=document.getElementById("custPhone");
 function clearErr(){
  const errBox=document.getElementById("custFormError");
  if(errBox) errBox.classList.add("hidden");
 }
 if(nameInp) nameInp.addEventListener("input", clearErr);
 if(phoneInp) phoneInp.addEventListener("input", clearErr);

 document.getElementById("searchInput").addEventListener("input",e=>{
  searchTerm=e.target.value;
  renderProducts();
 });

 document.getElementById("searchBtn").onclick=()=>{
  document.getElementById("products").scrollIntoView({behavior:"smooth"});
 };

 document.getElementById("mobileMenuBtn").onclick=()=>{
  document.getElementById("navlinks").classList.toggle("open");
 };

 document.querySelectorAll('a[href="#cart"]').forEach(a=>{
  a.onclick=e=>{
   e.preventDefault();
   openCart();
  };
 });

 const stickyBtn=document.getElementById("stickyViewCart");
 if(stickyBtn) stickyBtn.onclick=openCart;

 const addMoreBtn=document.getElementById("addMoreProductsBtn");
 if(addMoreBtn) addMoreBtn.onclick=addMoreProducts;

 document.getElementById("drawerBackdrop").onclick=closeCart;
 document.getElementById("closeCart").onclick=closeCart;
 document.getElementById("checkoutBtn").onclick=makeInvoice;
 document.getElementById("clearCartBtn").onclick=()=>{
  cart={};
  save(STORE_CART,cart);
  updateCartUI();
  renderCart();
 };

 document.getElementById("closeInvoice").onclick=()=>document.getElementById("invoiceModal").classList.add("hidden");
 const sendWaBtn=document.getElementById("sendWhatsapp");
 if(sendWaBtn) sendWaBtn.addEventListener("click", whatsappOrder);
 const pdfBtn=document.getElementById("downloadPdfBtn");
 if(pdfBtn) pdfBtn.onclick=downloadPDFBill;
 document.getElementById("printInvoice").onclick=()=>window.print();
});