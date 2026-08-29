const SUPABASE_URL='https://dxdjqeqlmyawqrzphzdb.supabase.co';
const SUPABASE_KEY='sb_publishable__VZebPfljfwPNTxcWbDD7Q_pzIJvn_K';
const ORDER_FUNCTION=`${SUPABASE_URL}/functions/v1/create-order`;
const DELIVERY_CHARGE=200;
const currency=value=>`Rs. ${Number(value).toLocaleString('en-PK')}`;

const productGrid=document.getElementById('productGrid');
const homeProductGrid=document.getElementById('homeProductGrid');
const grid=productGrid||homeProductGrid;
const orderModal=document.getElementById('orderModal');
const selectedProduct=document.getElementById('selectedProduct');
const orderForm=document.getElementById('orderForm');
const cartDrawer=document.getElementById('cartDrawer');
const drawerOverlay=document.getElementById('drawerOverlay');
const cartItems=document.getElementById('cartItems');
const cartCount=document.getElementById('cartCount');
const cartTotal=document.getElementById('cartTotal');
const cartSubtotal=document.getElementById('cartSubtotal');
const cartDelivery=document.getElementById('cartDelivery');
const checkoutProductTotal=document.getElementById('checkoutProductTotal');
const checkoutGrandTotal=document.getElementById('checkoutGrandTotal');
const cart=[];
let activeCheckout=null;

function findProduct(id){return PRODUCTS.find(p=>p.id===id)}

function renderProducts(){
  if(!grid)return;
  const list=productGrid?PRODUCTS:PRODUCTS.slice(0,6);
  grid.innerHTML=list.map(p=>`<article class="product-card"><div class="product-visual"><span class="tag">${p.tag||'MANGO PULP'}</span><img class="product-image" src="${p.image}" alt="${p.name}" loading="lazy"></div><div class="product-info"><h3>${p.name}</h3><p>${p.description||'Mango drink premix in a convenient pack size.'}</p><div class="price-row"><div><span class="price">${currency(p.price)}</span>${p.oldPrice?` <span class="old-price">${currency(p.oldPrice)}</span>`:''}</div></div><div class="product-actions"><button class="buy-btn" data-buy="${p.id}" type="button">Buy Now — COD</button><button class="add-btn" data-add="${p.id}" type="button">Add to Cart</button></div></div></article>`).join('');
}

function getCheckoutTotal(p,q){return Number(p.price)*Number(q)+DELIVERY_CHARGE}

function openOrder(p,q=1){
  if(!orderModal||!orderForm)return;
  activeCheckout={product:p,quantity:q};
  const productInput=document.getElementById('orderProduct');
  const priceInput=document.getElementById('orderPrice');
  const quantityInput=document.getElementById('orderQuantity');
  if(productInput)productInput.value=p.name;
  if(priceInput)priceInput.value=p.price;
  if(quantityInput)quantityInput.value=q;
  const subtotal=Number(p.price)*Number(q);
  const total=subtotal+DELIVERY_CHARGE;
  if(selectedProduct)selectedProduct.innerHTML=`<div><strong>${p.name}</strong><div>Quantity: ${q} · Delivery Fee: ${currency(DELIVERY_CHARGE)}</div></div><strong>${currency(total)}</strong>`;
  if(checkoutProductTotal)checkoutProductTotal.textContent=currency(subtotal);
  if(checkoutGrandTotal)checkoutGrandTotal.textContent=currency(total);
  orderModal.hidden=false;
  document.body.style.overflow='hidden';
  setTimeout(()=>document.getElementById('fullName')?.focus(),50);
}

function closeOrder(){
  if(!orderModal)return;
  orderModal.hidden=true;
  document.body.style.overflow='';
  orderForm?.reset();
  activeCheckout=null;
}

function addToCart(id){const e=cart.find(i=>i.id===id);e?e.quantity++:cart.push({id,quantity:1});renderCart();openCart()}

function renderCart(){
  if(!cartItems)return;
  const count=cart.reduce((s,i)=>s+i.quantity,0);
  const subtotal=cart.reduce((s,i)=>s+findProduct(i.id).price*i.quantity,0);
  const delivery=cart.length?DELIVERY_CHARGE:0;
  const total=subtotal+delivery;
  if(cartCount)cartCount.textContent=count;
  if(cartSubtotal)cartSubtotal.textContent=currency(subtotal);
  if(cartDelivery)cartDelivery.textContent=currency(delivery);
  if(cartTotal)cartTotal.textContent=currency(total);
  if(!cart.length){cartItems.innerHTML='<div class="empty-cart">Your cart is empty.<br>Choose a product to get started.</div>';return}
  cartItems.innerHTML=cart.map(i=>{const p=findProduct(i.id);return `<div class="cart-item"><img class="cart-thumb-image" src="${p.image}" alt="${p.name}"><div><h4>${p.name}</h4><p>${currency(p.price)} each</p><div class="cart-qty"><button data-dec="${p.id}" type="button">−</button><strong>${i.quantity}</strong><button data-inc="${p.id}" type="button">+</button><button class="cart-remove" data-remove="${p.id}" type="button">Remove</button></div></div><strong>${currency(p.price*i.quantity)}</strong></div>`}).join('');
}

function openCart(){if(!cartDrawer||!drawerOverlay)return;cartDrawer.classList.add('open');cartDrawer.setAttribute('aria-hidden','false');drawerOverlay.hidden=false;document.body.style.overflow='hidden'}
function closeCart(){if(!cartDrawer||!drawerOverlay)return;cartDrawer.classList.remove('open');cartDrawer.setAttribute('aria-hidden','true');drawerOverlay.hidden=true;document.body.style.overflow=''}
function checkoutCart(){if(!cart.length)return;if(cart.length===1){const i=cart[0];openOrder(findProduct(i.id),i.quantity);closeCart();return}const p={name:cart.map(i=>`${findProduct(i.id).name} × ${i.quantity}`).join(', '),price:cart.reduce((s,i)=>s+findProduct(i.id).price*i.quantity,0),image:cart[0]?findProduct(cart[0].id).image:'',description:'Multiple products'};openOrder(p,1);closeCart()}

async function saveOrder(){
  const d=new FormData(orderForm),p=activeCheckout?.product,q=activeCheckout?.quantity||1;
  if(!p)throw new Error('No product selected.');
  const fullName=String(d.get('fullName')||'').trim(),phone=String(d.get('phone')||'').trim(),address=String(d.get('address')||'').trim(),city=String(d.get('city')||'').trim();
  if(!fullName||!phone||!address||!city)throw new Error('Please complete all required fields.');
  const subtotal=Number(p.price)*Number(q),total=subtotal+DELIVERY_CHARGE;
  const payload={full_name:fullName,phone,address,city,items:[{name:p.name,quantity:q,price:Number(p.price)}],product_total:subtotal,delivery_fee:DELIVERY_CHARGE,total};
  const res=await fetch(ORDER_FUNCTION,{method:'POST',headers:{'Content-Type':'application/json',apikey:SUPABASE_KEY},body:JSON.stringify(payload)});
  const result=await res.json().catch(()=>({}));
  if(!res.ok||!result.success)throw new Error(result.error||'Order could not be placed.');
  return result.order_number;
}

if(grid)grid.addEventListener('click',e=>{const b=e.target.closest('[data-buy]'),a=e.target.closest('[data-add]');if(b){const p=findProduct(b.dataset.buy);if(p)openOrder(p)}if(a)addToCart(a.dataset.add)});
document.getElementById('closeModal')?.addEventListener('click',closeOrder);
orderModal?.addEventListener('click',e=>{if(e.target===orderModal)closeOrder()});
document.getElementById('cartButton')?.addEventListener('click',openCart);
document.getElementById('closeCart')?.addEventListener('click',closeCart);
drawerOverlay?.addEventListener('click',closeCart);
document.getElementById('cartCheckout')?.addEventListener('click',checkoutCart);
cartItems?.addEventListener('click',e=>{const inc=e.target.closest('[data-inc]'),dec=e.target.closest('[data-dec]'),remove=e.target.closest('[data-remove]');if(inc)cart.find(x=>x.id===inc.dataset.inc).quantity++;if(dec){const i=cart.find(x=>x.id===dec.dataset.dec);i.quantity--;if(i.quantity<=0)cart.splice(cart.indexOf(i),1)}if(remove){const i=cart.findIndex(x=>x.id===remove.dataset.remove);if(i>=0)cart.splice(i,1)}renderCart()});
orderForm?.addEventListener('submit',async e=>{e.preventDefault();const button=orderForm.querySelector('.place-order');if(button){button.disabled=true;button.textContent='Placing Order…'}try{const orderNumber=await saveOrder();closeOrder();alert(`Order placed successfully!\n\nOrder Number: ${orderNumber}\n\nThank you for shopping with Talha Bilal Store.`)}catch(err){console.error(err);alert(err.message||'Sorry, your order could not be placed. Please try again.')}finally{if(button){button.disabled=false;button.innerHTML='Place Order <span>→</span>'}}});

document.getElementById('year')&&(document.getElementById('year').textContent=new Date().getFullYear());
renderProducts();
renderCart();