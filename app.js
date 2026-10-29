const SUPABASE_URL='https://dxdjqeqlmyawqrzphzdb.supabase.co';
const SUPABASE_KEY='sb_publishable__VZebPfljfwPNTxcWbDD7Q_pzIJvn_K';
const ORDER_FUNCTION=`${SUPABASE_URL}/functions/v1/create-order`;
const DELIVERY_FEES={1:200,2:290,3:380,4:470,5:570,6:655,7:750,8:841,9:950,10:1030};
const currency=value=>`Rs. ${Number(value).toLocaleString('en-PK')}`;
const productGrid=document.getElementById('productGrid');
const homeProductGrid=document.getElementById('homeProductGrid');
const grid=productGrid||homeProductGrid;
const CATEGORY_LABELS={'grocery-beverages':'Grocery & Beverages','beauty-personal-care':'Beauty & Personal Care','baby-kids-care':'Baby & Kids Care','home-gadget':'Home Gadget'};
function catalogCategorySlug(product){if(product?.categorySlug)return product.categorySlug==='home-gadgets'?'home-gadget':product.categorySlug;if(/^mango-/i.test(String(product?.id||'')))return 'grocery-beverages';return '';}
function catalogCategoryName(product){return product?.categoryName||CATEGORY_LABELS[catalogCategorySlug(product)]||'';}
let catalogSearchQuery=productGrid?(new URLSearchParams(location.search).get('q')||'').trim():'';
const CATALOG_SORT_OPTIONS=['featured','best-selling','newest','oldest','price-asc','price-desc','name-asc','name-desc'];
const requestedSort=productGrid?new URLSearchParams(location.search).get('sort')||'featured':'featured';
let catalogSort=CATALOG_SORT_OPTIONS.includes(requestedSort)?requestedSort:'featured';
function catalogSearchMatches(product,query){if(!query)return true;const hay=[product?.name,product?.description,product?.shortDescription,product?.short_description,product?.tag,catalogCategoryName(product),product?.id].filter(Boolean).join(' ').toLowerCase();return query.toLowerCase().split(/\s+/).filter(Boolean).every(word=>hay.includes(word));}
function renderCatalogToolbar(filteredList){
 const filtersBox=document.getElementById('catalogFilters');const countEl=document.getElementById('catalogResultCount');const searchInput=document.getElementById('catalogSearchInput');
 if(searchInput&&document.activeElement!==searchInput)searchInput.value=catalogSearchQuery||'';
 if(!window.__catalogSearchWired&&searchInput){window.__catalogSearchWired=true;searchInput.addEventListener('input',()=>{catalogSearchQuery=searchInput.value.trim();const url=new URL(location.href);if(catalogSearchQuery)url.searchParams.set('q',catalogSearchQuery);else url.searchParams.delete('q');history.replaceState(null,'',url);renderProducts();});}
 const sortSelect=document.getElementById('catalogSortSelect');
 if(sortSelect){sortSelect.value=catalogSort;
  if(!window.__catalogSortWired){window.__catalogSortWired=true;sortSelect.addEventListener('change',()=>{catalogSort=CATALOG_SORT_OPTIONS.includes(sortSelect.value)?sortSelect.value:'featured';const url=new URL(location.href);if(catalogSort==='featured')url.searchParams.delete('sort');else url.searchParams.set('sort',catalogSort);history.replaceState(null,'',url);renderProducts();});}}
 if(filtersBox){
  const params=new URLSearchParams(location.search);const current=params.get('category');const currentNorm=current==='home-gadgets'?'home-gadget':current;const q=catalogSearchQuery||'';
  const seen=new Map();for(const item of [...PRODUCTS]){const slug=catalogCategorySlug(item);if(!slug)continue;if(!seen.has(slug))seen.set(slug,catalogCategoryName(item)||slug);}
  const linkFor=(slug)=>{const u=new URL('/products',location.origin);if(slug)u.searchParams.set('category',slug);if(q)u.searchParams.set('q',q);if(catalogSort&&catalogSort!=='featured')u.searchParams.set('sort',catalogSort);return u.pathname+u.search;};
  filtersBox.innerHTML='<a class="catalog-filter'+(!currentNorm?' active':'')+'" href="'+linkFor('')+'" aria-current="'+(!currentNorm)+'">All products</a>'+[...seen.entries()].map(([slug,label])=>'<a class="catalog-filter'+(currentNorm===slug?' active':'')+'" href="'+linkFor(slug)+'" aria-current="'+(currentNorm===slug)+'">'+appEsc(label)+'</a>').join('');
  const sheetList=document.getElementById('catalogFilterSheetList');
  if(sheetList){
   sheetList.innerHTML='<a class="catalog-sheet-link'+(!currentNorm?' active':'')+'" href="'+linkFor('')+'" aria-current="'+(!currentNorm)+'">All products<span>'+(!currentNorm?'✓':'')+'</span></a>'+[...seen.entries()].map(([slug,label])=>'<a class="catalog-sheet-link'+(currentNorm===slug?' active':'')+'" href="'+linkFor(slug)+'" aria-current="'+(currentNorm===slug)+'">'+appEsc(label)+'<span>'+(currentNorm===slug?'✓':'')+'</span></a>').join('');
  }
  const filterBtn=document.getElementById('catalogFilterBtn');
  if(filterBtn)filterBtn.classList.toggle('active',!!currentNorm);
 }
 if(!window.__catalogToolbarButtonsWired){
  window.__catalogToolbarButtonsWired=true;
  const fBtn=document.getElementById('catalogFilterBtn');
  const sheet=document.getElementById('catalogFilterSheet');
  const sBtn=document.getElementById('catalogSearchBtn');
  const sWrap=document.getElementById('catalogSearchWrap');
  const openSheet=()=>{if(!sheet)return;sheet.hidden=false;if(fBtn)fBtn.setAttribute('aria-expanded','true');document.body.style.overflow='hidden';};
  const closeSheet=()=>{if(!sheet)return;sheet.hidden=true;if(fBtn)fBtn.setAttribute('aria-expanded','false');document.body.style.overflow='';};
  if(fBtn)fBtn.addEventListener('click',openSheet);
  const sheetClose=document.getElementById('catalogFilterSheetClose');
  if(sheetClose)sheetClose.addEventListener('click',closeSheet);
  if(sheet)sheet.addEventListener('click',(e)=>{if(e.target===sheet)closeSheet();});
  document.addEventListener('keydown',(e)=>{if(e.key==='Escape')closeSheet();});
  const toggleSearch=()=>{if(!sWrap)return;const opening=sWrap.hidden;sWrap.hidden=!opening;if(sBtn)sBtn.setAttribute('aria-expanded',String(opening));if(opening&&searchInput)searchInput.focus();};
  if(sBtn)sBtn.addEventListener('click',toggleSearch);
  const sClose=document.getElementById('catalogSearchClose');
  if(sClose)sClose.addEventListener('click',()=>{if(sWrap)sWrap.hidden=true;if(sBtn)sBtn.setAttribute('aria-expanded','false');});
  if(sWrap&&catalogSearchQuery)sWrap.hidden=false;
 }
 if(countEl){
  const params=new URLSearchParams(location.search);const hasFilter=!!params.get('category')||!!catalogSearchQuery;
  countEl.textContent=hasFilter?((filteredList||[]).length+' product'+((filteredList||[]).length===1?'':'s')+' found'+(catalogSearchQuery?' for \u201c'+catalogSearchQuery+'\u201d':'')):((filteredList||[]).length+' products');
 }
}

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
const checkoutDelivery=document.getElementById('checkoutDelivery');
const checkoutGrandTotal=document.getElementById('checkoutGrandTotal');
const CART_KEY='tb_cart_v2';
function loadCart(){try{const parsed=JSON.parse(localStorage.getItem(CART_KEY)||'[]');return Array.isArray(parsed)?parsed.filter(i=>i&&typeof i.id==='string'&&i.id.length>0&&Number(i.quantity)>0).map(i=>({id:i.id,quantity:Math.max(1,Math.floor(Number(i.quantity))),variant:i.variant&&typeof i.variant==='object'&&!Array.isArray(i.variant)?i.variant:{},price:i.price!==null&&i.price!==undefined&&Number.isFinite(Number(i.price))?Math.max(0,Number(i.price)):null})):[]}catch{return[]}}
const cart=loadCart();
function persistCart(){localStorage.setItem(CART_KEY,JSON.stringify(cart))}
function findProduct(id){
 const list=Array.isArray(window.PRODUCTS)?window.PRODUCTS:PRODUCTS;
 const key=String(id??"");
 return list.find(p=>String(p.id)===key||String(p.slug||"")===key)||null;
}
async function waitForProduct(id){
 let product=findProduct(id);
 if(product)return product;
 const pending=window.CMS_SITE_READY;
 if(pending&&typeof pending.then==="function"){
  try{const result=await pending;if(result&&result.ok)product=findProduct(id)}catch(error){console.warn("CMS catalogue is not ready",error)}
 }
 return product||null;
}
async function ensureCartProductsReady(){
 const missing=cart.some(item=>!findProduct(item.id));
 const pending=window.CMS_SITE_READY;
 if(missing&&pending&&typeof pending.then==="function"){
  try{const result=await pending;if(result&&result.ok&&typeof window.refreshFromCms==="function")window.refreshFromCms()}catch(error){console.warn("Could not refresh products before checkout",error)}
 }
 return cart.every(item=>!!findProduct(item.id));
}
function normalizedVariant(variant){if(!variant||typeof variant!=="object"||Array.isArray(variant))return{};return Object.keys(variant).sort().reduce((out,key)=>{const value=String(variant[key]??"").trim();if(value)out[key]=value;return out},{})}
function variantKey(variant){return JSON.stringify(normalizedVariant(variant))}
function cleanVariantValue(value){
 if(value==null||typeof value==="object")return "";
 const raw=String(value).trim();
 if(!raw)return "";
 return raw.split(/\s*,\s*(?=(?:sku|stock|price|old[\s_-]?price|weight(?:[\s_-]?kg)?|delivery[\s_-]?fee|delivery[\s_-]?mode|image(?:\s*url|[\s_-]?url)?|color[\s_-]?hex|barcode|inventory|variant[\s_-]?id|id)\s*:|https?:\/\/)/i)[0].replace(/[ ,;|]+$/,"").trim();
}
function variantLabel(variant){
 const hidden=new Set(["price","oldprice","weight","weightkg","weightg","image","imageurl","deliveryfee","deliverymode","sku","stock","id","variantid","optionid","productid","categoryid","colorhex","barcode","inventory","stockquantity","manualdeliveryfee","createdat","updatedat"]);
 const entries=Object.entries(normalizedVariant(variant)).filter(([key])=>!hidden.has(String(key).toLowerCase().replace(/[\s_-]/g,"")));
 const seen=new Set();
 return entries.map(([key,value])=>({key,value:cleanVariantValue(value)})).filter(({value})=>{const v=value.toLowerCase();if(!v||seen.has(v))return false;seen.add(v);return true}).map(({key,value})=>key+": "+value).join(", ");
}
function cartVariantRecord(product,variant={}){
 const sku=cleanVariantValue(variant?.SKU??variant?.sku??"").toLowerCase();
 const selectedNames=["Option","Color","Size","Style","Pattern","Material","Model","Pack","Variant"].map(key=>cleanVariantValue(variant?.[key])).filter(Boolean).map(value=>value.toLowerCase());
 const candidates=[];
 for(const item of (Array.isArray(product?.variations)?product.variations:[])){
  if(!item||typeof item!=="object")continue;
  if(Array.isArray(item.options)){
   for(const option of item.options){
    if(option&&typeof option==="object")candidates.push({...option,name:option.name||option.label||option.title||option.value||"",groupName:item.name||item.label||""});
    else candidates.push({name:String(option??""),groupName:item.name||item.label||""});
   }
  }else candidates.push(item);
 }
 if(sku){
  const bySku=candidates.find(item=>cleanVariantValue(item.sku??item.SKU??"").toLowerCase()===sku);
  if(bySku)return bySku;
 }
 return candidates.find(item=>{
  const name=cleanVariantValue(item.name??item.label??item.title??item.value??item.option??"").toLowerCase();
  return name&&selectedNames.includes(name);
 })||null;
}
function cleanCartImageUrl(value){
 if(value==null||typeof value==="object")return "";
 let raw=String(value).trim();
 if(!raw)return "";
 raw=raw.split(/\s*,\s*(?=(?:price|old[\s_-]?price|weight|sku|stock|delivery[\s_-]?fee)\s*:)/i)[0].trim();
 const found=raw.match(/https?:\/\/[^\s"'<>]+/i);
 if(found)return found[0].replace(/[),;]+$/,"");
 if(/^(?:\/|assets\/)/i.test(raw))return raw.replace(/[),;]+$/,"");
 return "";
}
function cartVariantImage(product,variant={},record=null){
 const images=Array.isArray(product?.images)?product.images:[];
 const sources=[
  record?.image,record?.image_url,record?.imageUrl,record?.["Image URL"],
  variant?.image,variant?.image_url,variant?.imageUrl,variant?.["Image URL"],
  product?.image,...images.map(item=>typeof item==="string"?item:(item?.url||item?.src||""))
 ];
 for(const source of sources){const url=cleanCartImageUrl(source);if(url)return url}
 return "/assets/products/mango-pulp-product-image.webp";
}
function orderItemName(product,variant){const label=variantLabel(variant);return label?product.name+" — "+label:product.name}
function productVariantWeight(product,variant={}){
 if(variant&&variant.weight!=null&&Number.isFinite(Number(variant.weight)))return Math.max(0,Number(variant.weight));
 if(variant?.Option&&Array.isArray(product?.variations)){
  const match=product.variations.find(v=>String(v?.name||v?.label||"").trim().toLowerCase()===String(variant.Option).trim().toLowerCase());
  if(match&&match.weight_kg!=null&&Number.isFinite(Number(match.weight_kg)))return Math.max(0,Number(match.weight_kg));
 }
 let weight=Math.max(0,Number(product?.weight)||0);
 for(const [name,value] of Object.entries(normalizedVariant(variant))){
  if(!/^(weight|pack\s*weight|product\s*weight)$/i.test(String(name).trim()))continue;
  const match=String(value||"").trim().replace(/,/g,"").match(/([0-9]+(?:\.[0-9]+)?)\s*(kg|kgs|kilograms?|g|grams?)?/i);
  if(!match)continue;
  let selected=Number(match[1]);
  if(/^(g|gram)/i.test(match[2]||""))selected/=1000;
  if(Number.isFinite(selected)&&selected>0&&selected<=1000)weight=selected;
 }
 return weight;
}
function productVariantPrice(product,variant){let price=Number(product?.price)||0;for(const [name,value] of Object.entries(normalizedVariant(variant))){const rule=(Array.isArray(product?.variations)?product.variations:[]).find(v=>String(v?.name||v?.label||"").trim().toLowerCase()===String(name).trim().toLowerCase());const option=(Array.isArray(rule?.options)?rule.options:[]).find(o=>String(typeof o==="object"?(o.value??o.label??o.name??""):o)===String(value));if(option&&typeof option==="object"&&option.price!==null&&option.price!==undefined&&Number.isFinite(Number(option.price)))price=Number(option.price)}return Math.max(0,price)}
function productDeliveryFee(product,quantity=1){
 if(product?.deliveryMode==="manual")return Math.max(0,Number(product.manualDeliveryFee)||0);
 return deliveryForWeight(Number(product?.weight||0)*Math.max(1,Number(quantity)||1));
}
function readSelectedVariations(element){
 const root=element?.closest(".detail-info")||document,values={};
 root.querySelectorAll("[data-cms-variation]").forEach(select=>{if(select.value)values[select.dataset.cmsVariation||"Option"]=select.value});
 return normalizedVariant(values);
}
function deliveryForWeight(weight){const w=Math.max(0,Math.ceil(Number(weight)||0));if(!w)return 0;if(w<=10)return DELIVERY_FEES[w];const fullTens=Math.floor(w/10),remainder=w%10;return fullTens*DELIVERY_FEES[10]+(remainder?DELIVERY_FEES[remainder]:0)}
function bundlePriceForWeight(weight){const target=Math.max(0,Math.round(Number(weight)||0));if(!target)return 0;const packsSource=PRODUCTS.filter(p=>p.isMangoPremix||/^mango-/.test(String(p.id||"")));const exact=packsSource.find(p=>Number(p.weight)===target);if(exact)return Number(exact.price);const packs=packsSource.map(p=>({weight:Number(p.weight),price:Number(p.price)})).filter(p=>p.weight>0&&p.weight<=target);const dp=Array(target+1).fill(Infinity);dp[0]=0;for(let w=1;w<=target;w++){for(const pack of packs){if(w>=pack.weight&&dp[w-pack.weight]+pack.price<dp[w])dp[w]=dp[w-pack.weight]+pack.price}}return Number.isFinite(dp[target])?dp[target]:0}
function appEsc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function assignedCmsProductIds(slug){
 const page=(window.CMS_SITE_DATA?.pages||[]).find(x=>x.slug===slug&&x.status==="published");
 const section=(Array.isArray(page?.sections)?page.sections:[]).find(x=>x&&x.key==="cms-product-assignments");
 return Array.isArray(section?.product_ids)?section.product_ids.map(Number):[];
}
function productList(){
 let list=[...PRODUCTS];
 const params=new URLSearchParams(location.search),view=params.get("view");
 if(productGrid){
  const categoryRaw=params.get("category");
  const category=categoryRaw==='home-gadgets'?'home-gadget':categoryRaw;
  if(category)list=list.filter(p=>catalogCategorySlug(p)===category);
  const searchQuery=catalogSearchQuery||params.get("q")||'';
  if(searchQuery)list=list.filter(p=>catalogSearchMatches(p,searchQuery));
  const assigned=assignedCmsProductIds("products");
  if(view==="best-sellers")list.sort((a,b)=>(a.bestSellerRank||99)-(b.bestSellerRank||99));
  else if(view==="new-products")list.sort((a,b)=>(b.newProductRank||0)-(a.newProductRank||0));
  else if(assigned.length){
   const rankById=new Map(assigned.map((id,index)=>[Number(id),index]));
   list=list.map((product,index)=>({product,index,rank:rankById.get(Number(product.cmsRecordId))}))
    .sort((a,b)=>{
     const ar=a.rank===undefined?Infinity:a.rank,br=b.rank===undefined?Infinity:b.rank;
     if(ar!==br)return ar<br?-1:1;
     return a.index-b.index;
    }).map(entry=>entry.product);
  }
  // Featured: items flagged Featured in admin come first on catalogue pages.
  // Best Sellers / New Products views keep their own ranking instead, and an
  // explicit sort overrides the view/assigned order everywhere else.
  if(catalogSort==='featured'&&!view)list.sort((a,b)=>(a.featured?0:1)-(b.featured?0:1));
  else if(catalogSort==='best-selling'){
   const useCounts=list.some(p=>typeof p.ordersCount==='number');
   if(useCounts)list.sort((a,b)=>((b.ordersCount||0)-(a.ordersCount||0))||((a.bestSellerRank||99)-(b.bestSellerRank||99)));
   else list.sort((a,b)=>(a.bestSellerRank||99)-(b.bestSellerRank||99));
  }
  else if(catalogSort==='newest')list.sort((a,b)=>{const ta=Date.parse(a.createdAt||''),tb=Date.parse(b.createdAt||'');const va=Number.isFinite(ta),vb=Number.isFinite(tb);if(va&&vb)return tb-ta;if(va)return -1;if(vb)return 1;return (b.newProductRank||0)-(a.newProductRank||0);});
  else if(catalogSort==='oldest')list.sort((a,b)=>{const ta=Date.parse(a.createdAt||''),tb=Date.parse(b.createdAt||'');const va=Number.isFinite(ta),vb=Number.isFinite(tb);if(va&&vb)return ta-tb;if(va)return -1;if(vb)return 1;return 0;});
  else if(catalogSort==='price-asc')list.sort((a,b)=>(Number(a.price)||0)-(Number(b.price)||0));
  else if(catalogSort==='price-desc')list.sort((a,b)=>(Number(b.price)||0)-(Number(a.price)||0));
  else if(catalogSort==='name-asc')list.sort((a,b)=>String(a.name||'').localeCompare(String(b.name||'')));
  else if(catalogSort==='name-desc')list.sort((a,b)=>String(b.name||'').localeCompare(String(a.name||'')));
  return list;
 }
 const customPage=location.pathname.match(/^\/page\/([^/]+)\/?$/i);
 const assigned=assignedCmsProductIds(customPage?decodeURIComponent(customPage[1]):"home");
 if(assigned.length){
  const ordered=assigned.map(id=>list.find(p=>Number(p.cmsRecordId)===id)).filter(Boolean);
  return ordered.slice(0,12);
 }
 if(customPage)return [];
 const featured=list.filter(p=>p.featured);
 return (featured.length?featured:list).slice(0,6);
}
function productCardSummary(product){
 // Never fall back to the long description for CMS cards.
 const source=product?.isCmsProduct
   ? String(product?.shortDescription||product?.short_description||"")
   : String(product?.description||"");
 let summary=source.replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim();
 const limit=110;
 if(summary.length>limit)summary=summary.slice(0,limit-1).replace(/\s+\S*$/,"").trim()+"…";
 return summary;
}
function renderProducts(){
 if(!grid)return;
 const list=productList(),homeOnly=!!homeProductGrid&&!productGrid;
 if(productGrid)renderCatalogToolbar(list);
 if(!list.length){
  const cmsStatus=window.CMS_SITE_STATUS||(window.CMS_SITE_DATA?"ready":"loading");
  if(cmsStatus==="loading"){
   grid.innerHTML='<div class="catalog-loading" role="status" aria-live="polite"><span class="catalog-spinner" aria-hidden="true"></span><span>Loading products…</span></div>';
   return;
  }
  if(cmsStatus==="error"){
   grid.innerHTML='<div class="catalog-empty-state" role="status">Products could not be loaded just now. Please refresh the page in a moment.</div>';
   return;
  }
  if(productGrid&&(catalogSearchQuery||new URLSearchParams(location.search).get('category'))){grid.innerHTML='<div class="catalog-empty-state">No products found'+(catalogSearchQuery?' for \u201c'+appEsc(catalogSearchQuery)+'\u201d':' in this category')+'. Try another word or <a href="/products">clear the search</a>.</div>';return;}
  grid.innerHTML='<div class="catalog-empty-state">There are no products in this category yet.</div>';
  return;
 }
 grid.innerHTML=list.map(p=>{
  const url="/product/"+encodeURIComponent(p.id);
  const sellingPrice=Number(p.price)||0;
  const previousPrice=Number(p.oldPrice)||0;
  const old=previousPrice>sellingPrice?'<span class="old-price">'+currency(previousPrice)+'</span>':"";
  const summary=productCardSummary(p);
  return '<article class="product-card"><div class="product-visual"><span class="tag">'+appEsc(p.tag||"PRODUCT")+'</span><a class="product-link" href="'+url+'" aria-label="View '+appEsc(p.name)+'"><img class="product-image" src="'+appEsc(p.image||"/assets/products/mango-pulp-product-image.webp")+'" alt="'+appEsc(p.name)+'" loading="lazy"></a></div><div class="product-info"><a class="product-title-link" href="'+url+'"><h3>'+appEsc(p.name)+'</h3></a><div class="price-row"><div><span class="price">'+currency(sellingPrice)+'</span>'+old+'</div></div><div class="product-actions"><button class="add-btn" data-add="'+appEsc(p.id)+'" type="button">Add to Cart</button><button class="buy-btn" data-buy="'+appEsc(p.id)+'" type="button">Buy Now</button></div></div></article>';
 }).join("");
}
function checkoutSummary(items,totalWeight,productTotal,delivery,total){
 const safeItems=Array.isArray(items)?items:[];
 const unitCount=safeItems.reduce((sum,item)=>sum+Math.max(1,Number(item.quantity)||1),0);
 const lineItems=safeItems.map(item=>{
  const product=findProduct(item.id)||{};
  const quantity=Math.max(1,Number(item.quantity)||1);
  const unitPrice=Math.max(0,Number(item.price??product.price)||0);
  const lineTotal=unitPrice*quantity;
  const image=item.variant?.image||item.variant?.image_url||product.image||(Array.isArray(product.images)?product.images[0]:"")||"/assets/products/mango-pulp-product-image.webp";
  const name=String(item.name||product.name||"Product");
  const meta=currency(unitPrice)+" each · Qty "+quantity;
  return {name,image,meta,quantity,unitPrice,lineTotal};
 });
 const lineSum=lineItems.reduce((sum,item)=>sum+item.lineTotal,0);
 const delta=Number(productTotal||0)-lineSum;
 const hasAdjustment=Math.abs(delta)>0.5;
 const isDiscount=delta< -0.5;
 const adjustment=hasAdjustment?'<div class="checkout-summary-row checkout-summary-adjustment"><span>'+(isDiscount?'Buy More, Save More discount':'Price adjustment')+'</span><strong>'+(isDiscount?'−':'+')+currency(Math.abs(delta))+'</strong></div>':"";
 const subtotalRows=hasAdjustment?'<div class="checkout-summary-row"><span>'+(isDiscount?'Items total before savings':'Items total before adjustment')+'</span><strong>'+currency(lineSum)+'</strong></div>'+adjustment+'<div class="checkout-summary-row checkout-summary-subtotal"><span>'+(isDiscount?'Subtotal after savings':'Subtotal after adjustment')+'</span><strong>'+currency(productTotal)+'</strong></div>':'<div class="checkout-summary-row"><span>Products subtotal</span><strong>'+currency(productTotal)+'</strong></div>';
 const showWeight=safeItems.length>0&&safeItems.every(item=>{
  const product=findProduct(item.id);
  return !!product&&(product.showWeight||product.isMangoPremix||/^mango-/.test(String(product.id||"")));
 });
 const weightRow=showWeight?'<div class="checkout-summary-row"><span>Total weight</span><strong>'+Number(totalWeight||0)+' kg</strong></div>':"";
 const rows=lineItems.map(item=>'<div class="checkout-item-row"><img class="checkout-item-thumb" src="'+appEsc(item.image)+'" alt="" loading="lazy"><div class="checkout-item-main"><div class="checkout-item-name" title="'+appEsc(item.name)+'">'+appEsc(item.name)+'</div><div class="checkout-item-meta">'+appEsc(item.meta)+'</div></div><strong class="checkout-item-line-total">'+currency(item.lineTotal)+'</strong></div>').join("");
 return '<section class="checkout-summary-card" aria-label="Order summary"><div class="checkout-summary-title"><span>Order items</span><span class="checkout-summary-count">'+safeItems.length+' product'+(safeItems.length===1?"":"s")+' · '+unitCount+' unit'+(unitCount===1?"":"s")+'</span></div><div class="checkout-summary-items">'+rows+'</div><div class="checkout-summary-totals">'+subtotalRows+weightRow+'<div class="checkout-summary-row"><span>Delivery fee</span><strong>'+currency(delivery)+'</strong></div><div class="checkout-summary-total"><span>Payable total</span><strong>'+currency(total)+'</strong></div></div></section>';
}
function openOrder(p,q=1,variant={}){if(!orderModal||!orderForm)return;const quantity=Math.max(1,Number(q)||1),chosen=normalizedVariant(variant),unitPrice=productVariantPrice(p,chosen),unitWeight=productVariantWeight(p,chosen),weight=unitWeight*quantity,isMango=!!p.isMangoPremix||/^mango-/.test(String(p.id||"")),productTotal=isMango?(bundlePriceForWeight(weight)||unitPrice*quantity):unitPrice*quantity,delivery=productDeliveryFee(Object.assign({},p,{weight:unitWeight}),quantity),total=productTotal+delivery;activeCheckout={items:[{id:p.id||null,name:orderItemName(p,chosen),quantity,price:unitPrice,weight:unitWeight,variant:chosen}],weight,productTotal,delivery};document.getElementById('orderProduct').value=orderItemName(p,chosen);document.getElementById('orderPrice').value=productTotal;document.getElementById('orderQuantity').value=quantity;if(selectedProduct)selectedProduct.innerHTML=checkoutSummary(activeCheckout.items,weight,productTotal,delivery,total);if(checkoutProductTotal)checkoutProductTotal.textContent=currency(productTotal);if(checkoutDelivery)checkoutDelivery.textContent=currency(delivery);if(checkoutGrandTotal)checkoutGrandTotal.textContent=currency(total);orderModal.hidden=false;document.body.style.overflow='hidden';setTimeout(()=>document.getElementById('fullName')?.focus(),50)}
function openCartOrder(){if(!cart.length||!orderModal||!orderForm)return;if(cart.some(i=>!findProduct(i.id))){alert("One or more cart items are still loading. Please wait for the catalogue to finish loading and try again.");return}const totals=cartTotals();activeCheckout={items:cart.map(i=>{const p=findProduct(i.id);return{id:p.id,name:orderItemName(p,i.variant),quantity:i.quantity,price:Number(i.price??p.price),weight:productVariantWeight(p,i.variant),variant:normalizedVariant(i.variant)}}).filter(i=>i.id),weight:totals.weight,productTotal:totals.subtotal,delivery:totals.delivery};document.getElementById('orderProduct').value=activeCheckout.items.map(i=>`${i.name} × ${i.quantity}`).join(', ');document.getElementById('orderPrice').value=totals.subtotal;document.getElementById('orderQuantity').value=cart.reduce((s,i)=>s+i.quantity,0);if(selectedProduct)selectedProduct.innerHTML=checkoutSummary(activeCheckout.items,totals.weight,totals.subtotal,totals.delivery,totals.total);if(checkoutProductTotal)checkoutProductTotal.textContent=currency(totals.subtotal);if(checkoutDelivery)checkoutDelivery.textContent=currency(totals.delivery);if(checkoutGrandTotal)checkoutGrandTotal.textContent=currency(totals.total);orderModal.hidden=false;document.body.style.overflow='hidden';closeCart();setTimeout(()=>document.getElementById('fullName')?.focus(),50)}
function cartTotals(){
 const weight=cart.reduce((sum,item)=>{const p=findProduct(item.id);return sum+productVariantWeight(p,item.variant)*item.quantity},0);
 const weightedShippingWeight=cart.reduce((sum,item)=>{const p=findProduct(item.id);return sum+(p&&p.deliveryMode!=="manual"?productVariantWeight(p,item.variant)*item.quantity:0)},0);
 const seenManual=new Set();let fixedDelivery=0;
 for(const item of cart){const p=findProduct(item.id);if(!p||p.deliveryMode!=="manual")continue;const key=String(p.id)+"|"+variantKey(item.variant);if(seenManual.has(key))continue;seenManual.add(key);fixedDelivery+=Math.max(0,Number(p.manualDeliveryFee)||0)}
 const rawSubtotal=cart.reduce((sum,item)=>{const p=findProduct(item.id);return sum+Number(item.price??p?.price??0)*item.quantity},0);
 const onlyMango=cart.length>0&&cart.every(item=>{const p=findProduct(item.id);return !!p&&(p.isMangoPremix||/^mango-/.test(String(p.id||"")))});
 const subtotal=onlyMango&&weight?bundlePriceForWeight(weight):rawSubtotal;
 const delivery=deliveryForWeight(weightedShippingWeight)+fixedDelivery;
 return{weight,rawSubtotal,subtotal,delivery,total:subtotal+delivery}
}
function closeOrder(){if(!orderModal)return;orderModal.hidden=true;document.body.style.overflow='';orderForm?.reset();activeCheckout=null}
function readCurrentQuantity(element){const root=element?.closest(".detail-info")||document;const input=root.querySelector("#productQtyInput")||document.getElementById("productQtyInput");const val=parseInt(input?.value,10);return Number.isFinite(val)&&val>=1?Math.min(val,99):1}
function addToCart(id,variant={},qty=1){const p=findProduct(id);if(!p)return false;const quantity=Math.max(1,parseInt(qty,10)||1);const chosen=normalizedVariant(variant),unitPrice=productVariantPrice(p,chosen),e=cart.find(i=>String(i.id)===String(id)&&variantKey(i.variant)===variantKey(chosen));if(e){e.quantity+=quantity;e.price=unitPrice}else cart.push({id:String(id),quantity,variant:chosen,price:unitPrice});persistCart();renderCart();try{if(typeof window.fbq==='function'){window.fbq('track','AddToCart',{content_ids:[p.id],content_type:'product',content_name:p.name,value:unitPrice*quantity,currency:'PKR'})}}catch(err){}if(cartDrawer)openCart();else alert(`${p.name} added to cart.`);return true}
function renderCart(){
 const totals=cartTotals();
 const displayedCount=cart.reduce((s,i)=>s+i.quantity,0);
 const liveCartCount=document.getElementById("cartCount");
 if(liveCartCount)liveCartCount.textContent=displayedCount;
 if(cartCount&&cartCount!==liveCartCount)cartCount.textContent=displayedCount;
 if(cartSubtotal)cartSubtotal.textContent=currency(totals.subtotal);
 if(cartDelivery)cartDelivery.textContent=currency(totals.delivery);
 if(cartTotal)cartTotal.textContent=currency(totals.total);
 if(!cartItems)return;
 if(!cart.length){cartItems.innerHTML='<div class="empty-cart">Your cart is empty.<br>Choose a product to get started.</div>';return}
 const html=cart.map(i=>{
  const p=findProduct(i.id);if(!p)return "";
  const variantRecord=cartVariantRecord(p,i.variant);
  const choice=variantLabel(i.variant);
  const showWeight=!!p.showWeight||!!p.isMangoPremix||/^mango-/.test(String(p.id||""));
  const fallbackPrice=variantRecord?.sale_price??variantRecord?.price??p.price;
  const rawPrice=i.price??fallbackPrice;
  const unitPrice=Number.isFinite(Number(rawPrice))?Math.max(0,Number(rawPrice)):0;
  const unitWeight=productVariantWeight(p,{...variantRecord,...i.variant});
  const image=cartVariantImage(p,i.variant,variantRecord);
  const details=[currency(unitPrice)+" each",choice,showWeight?unitWeight+"kg":""].filter(Boolean).join(" · ");
  const key=appEsc(variantKey(i.variant));
  return '<div class="cart-item"><img class="cart-thumb-image" src="'+appEsc(image)+'" alt="'+appEsc(p.name)+'"><div><h4>'+appEsc(p.name)+'</h4><p>'+appEsc(details)+'</p><div class="cart-qty"><button data-dec="'+appEsc(p.id)+'" data-variant="'+key+'" type="button">−</button><strong>'+i.quantity+'</strong><button data-inc="'+appEsc(p.id)+'" data-variant="'+key+'" type="button">+</button><button class="cart-remove" data-remove="'+appEsc(p.id)+'" data-variant="'+key+'" type="button">Remove</button></div></div><strong>'+currency(unitPrice*i.quantity)+'</strong></div>';
 }).join("");
 cartItems.innerHTML=html||'<div class="empty-cart">Loading products in your cart…</div>';
}
function openCart(){if(!cartDrawer||!drawerOverlay)return;cartDrawer.classList.add('open');cartDrawer.setAttribute('aria-hidden','false');cartDrawer.inert=false;drawerOverlay.hidden=false;document.body.style.overflow='hidden'}
function closeCart(){if(!cartDrawer||!drawerOverlay)return;cartDrawer.classList.remove('open');cartDrawer.setAttribute('aria-hidden','true');cartDrawer.inert=true;drawerOverlay.hidden=true;document.body.style.overflow=''}
async function checkoutCart(){
 if(!cart.length){alert("Your cart is empty. Add a product before checkout.");return}
 const ready=await ensureCartProductsReady();
 if(!ready){alert("Your cart is still syncing with the catalogue. Please refresh the page and try again; your cart has been kept.");return}
 openCartOrder();
}
function setMetaAdvancedMatching({fullName='',phone='',email='',city=''}){try{if(typeof window.fbq!=='function')return;let cleanPhone=String(phone||'').replace(/[^0-9+]/g,'');if(cleanPhone.startsWith('03')&&cleanPhone.length===11){cleanPhone='92'+cleanPhone.slice(1)}else if(cleanPhone.startsWith('+92')){cleanPhone=cleanPhone.replace('+','')}const cleanEmail=String(email||'').trim().toLowerCase();const parts=String(fullName||'').trim().split(/\s+/).filter(Boolean);const data={};if(cleanEmail)data.em=cleanEmail;if(cleanPhone)data.ph=cleanPhone;if(parts[0])data.fn=parts[0].toLowerCase();if(parts.length>1)data.ln=parts.slice(1).join(' ').toLowerCase();if(city)data.ct=String(city).trim().toLowerCase();data.country='pk';if(Object.keys(data).length)window.fbq('set','userData',data)}catch{}}
async function saveOrder(){const d=new FormData(orderForm);if(!activeCheckout)throw new Error('No product selected.');const fullName=String(d.get('fullName')||'').trim(),phone=String(d.get('phone')||'').trim(),address=String(d.get('address')||'').trim(),city=String(d.get('city')||'').trim(),nearestLandmark=String(d.get('nearest_landmark')||'').trim(),email=String(d.get('email')||'').trim();if(!fullName||!phone||!address||!city)throw new Error('Please complete all required fields.');setMetaAdvancedMatching({fullName,phone,email,city});const payload={full_name:fullName,phone,address,city,nearest_landmark:nearestLandmark,email:email||null,items:activeCheckout.items,product_total:activeCheckout.productTotal,delivery_fee:activeCheckout.delivery,total:activeCheckout.productTotal+activeCheckout.delivery,total_weight:activeCheckout.weight};const res=await fetch(ORDER_FUNCTION,{method:'POST',headers:{'Content-Type':'application/json',apikey:SUPABASE_KEY},body:JSON.stringify(payload)});const result=await res.json().catch(()=>({}));if(!res.ok||!result.success)throw new Error(result.error||'Order could not be placed.');const purchaseHandoff={content_ids:Array.isArray(payload.items)?payload.items.map(i=>i.id).filter(Boolean):[],content_type:'product',value:Number(payload.total||0),currency:'PKR',num_items:Array.isArray(payload.items)?payload.items.reduce((sum,i)=>sum+Number(i.quantity||0),0):0,order_id:result.order_number};try{const raw=JSON.stringify(purchaseHandoff);sessionStorage.setItem(`tb_pending_purchase_${result.order_number}`,raw);localStorage.setItem(`tb_pending_purchase_${result.order_number}`,raw);localStorage.setItem('tb_last_order',raw);}catch{}try{if(typeof window.fbq==='function'){window.fbq('track','Purchase',{content_ids:purchaseHandoff.content_ids.length?purchaseHandoff.content_ids:['mango-2kg'],content_type:'product',value:purchaseHandoff.value,currency:'PKR',num_items:purchaseHandoff.num_items||1},{eventID:result.order_number});sessionStorage.setItem(`purchase_tracked_${result.order_number}`,'1');localStorage.setItem(`purchase_tracked_${result.order_number}`,'1');}}catch(e){console.warn('Purchase tracking dispatch:',e)}return result.order_number}
document.addEventListener('click',async e=>{
 const target=e.target instanceof Element?e.target:null;
 if(!target)return;
 const cartButton=target.closest('#cartButton');
 if(cartButton){
  e.preventDefault();e.stopPropagation();
  openCart();
  return;
 }
 const add=target.closest('[data-add]'),buy=target.closest('[data-buy]');
 if(!add&&!buy)return;
 e.preventDefault();e.stopPropagation();
 const control=add||buy;
 const id=String(add?add.dataset.add:buy.dataset.buy||"");
 const product=await waitForProduct(id);
 if(!product){alert("This product is still loading. Please refresh the page and try again. Your cart and existing orders have not been changed.");return}
 // Read quantity from the active product detail first; this avoids falling back to 1
 // when a product template has its own quantity control.
 const detailRoot=control.closest(".detail-info");
 const quantityInput=detailRoot?.querySelector("#productQtyInput")||document.getElementById("productQtyInput");
 const rawQuantity=Number.parseInt(quantityInput?.value,10);
 const qty=Number.isFinite(rawQuantity)&&rawQuantity>=1?Math.min(rawQuantity,99):readCurrentQuantity(control);
 const variant=readSelectedVariations(control);
 if(add){
  const added=addToCart(id,variant,qty);
  if(!added)alert("Could not add this item. Please refresh and try again.");
  return;
 }
 openOrder(product,qty,variant);
},true);
document.getElementById('closeModal')?.addEventListener('click',closeOrder);orderModal?.addEventListener('click',e=>{if(e.target===orderModal)closeOrder()});document.getElementById('closeCart')?.addEventListener('click',e=>{e.preventDefault();closeCart()});drawerOverlay?.addEventListener('click',e=>{e.preventDefault();closeCart()});document.getElementById('cartCheckout')?.addEventListener('click',checkoutCart);
cartItems?.addEventListener('click',e=>{const inc=e.target.closest('[data-inc]'),dec=e.target.closest('[data-dec]'),remove=e.target.closest('[data-remove]'),button=inc||dec||remove;if(!button)return;const id=button.dataset.inc||button.dataset.dec||button.dataset.remove,key=button.dataset.variant||"{}";const matches=x=>String(x.id)===String(id)&&variantKey(x.variant)===key;if(inc){const i=cart.find(matches);if(i)i.quantity++}if(dec){const i=cart.find(matches);if(i){i.quantity--;if(i.quantity<=0)cart.splice(cart.indexOf(i),1)}}if(remove){const i=cart.findIndex(matches);if(i>=0)cart.splice(i,1)}persistCart();renderCart()});
orderForm?.addEventListener('submit',async e=>{e.preventDefault();e.stopPropagation();const button=document.getElementById('submitOrderBtn')||orderForm.querySelector('.place-order');if(button){button.disabled=true;button.textContent='Placing Order…'}try{const orderNumber=await saveOrder();cart.length=0;persistCart();renderCart();closeOrder();window.location.href=`thank-you.html?order=${encodeURIComponent(orderNumber)}`;}catch(err){console.error(err);alert(err.message||'Sorry, your order could not be placed. Please try again.')}finally{if(button){button.disabled=false;button.innerHTML='Confirm Cash on Delivery Order <span>→</span>'}}});document.getElementById('submitOrderBtn')?.addEventListener('click',e=>{e.stopPropagation()});
function processCatalogQuery(){
 if(window.__cmsCatalogActionHandled)return false;
 const params=new URLSearchParams(location.search),buyId=params.get("buy"),addId=params.get("add"),openCartParam=params.get("cart");
 if(buyId){const p=findProduct(buyId);if(!p||!orderModal)return false;window.__cmsCatalogActionHandled=true;openOrder(p);return true}
 if(addId){const p=findProduct(addId);if(!p)return false;window.__cmsCatalogActionHandled=true;addToCart(addId);history.replaceState({},'',location.pathname);return true}
 if(openCartParam==="1"&&cartDrawer){window.__cmsCatalogActionHandled=true;openCart();return true}
 return false;
}
renderProducts();renderCart();closeCart();processCatalogQuery();
function refreshFromCms(){
 if(!window.CMS_SITE_DATA)return;
 renderProducts();
 // Only validate cart item IDs after the published catalogue has completed loading.
 for(let i=cart.length-1;i>=0;i--)if(!findProduct(cart[i].id))cart.splice(i,1);
 persistCart();renderCart();processCatalogQuery();
}
window.refreshFromCms=refreshFromCms;
document.addEventListener("cms-site-data-ready",refreshFromCms);
document.addEventListener("cms-site-data-error",()=>{renderProducts();});
// Handle both script-load orders, including a CMS response that finished before app.js executed.
if(window.CMS_SITE_DATA)refreshFromCms();
if(window.CMS_SITE_READY&&typeof window.CMS_SITE_READY.then==="function"){
 window.CMS_SITE_READY.then(data=>{if(data&&data.ok)refreshFromCms()}).catch(()=>{});
}