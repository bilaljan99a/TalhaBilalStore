(() => {
  // Meta Pixel — Talha Bilal Store
  // Pixel ID: 2937138116646692
  if (!window.fbq) {
    window.fbq = function(){ window.fbq.callMethod ? window.fbq.callMethod.apply(window.fbq, arguments) : window.fbq.queue.push(arguments); };
    window._fbq = window.fbq;
    window.fbq.push = window.fbq;
    window.fbq.loaded = true;
    window.fbq.version = '2.0';
    window.fbq.queue = [];
    const pixelScript = document.createElement('script');
    pixelScript.async = true;
    pixelScript.src = 'https://connect.facebook.net/en_US/fbevents.js';
    const firstScript = document.getElementsByTagName('script')[0];
    if (firstScript) firstScript.parentNode.insertBefore(pixelScript, firstScript);
    else document.head.appendChild(pixelScript);
  }
  window.fbq('init', '2937138116646692');
  window.fbq('track', 'PageView');

  const BASE='https://www.talhabilalstore.com/';
  const LOGO='/assets/TalhaBilalStore%20Logo.png';
  const links=[['Home','index.html'],['All Products','/products']];
  const socials=[
    {label:'Facebook',url:'https://www.facebook.com/Talhabilalstore/',icon:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 8h3V4h-3c-3.3 0-5 1.9-5 5v3H6v4h3v4h4v-4h3.2l.8-4H13V9c0-.7.3-1 1-1Z" fill="currentColor"/></svg>'},
    {label:'Instagram',url:'https://www.instagram.com/talhabilalstore',icon:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="17.4" cy="6.7" r="1.2" fill="currentColor"/></svg>'}
  ];
  function ensureRootBase(){
    if(document.querySelector('base[href]'))return;
    const base=document.createElement('base');
    base.href='/';
    document.head.prepend(base);
  }
  function loadShellStyles(){
    const existing=document.querySelector('link[data-store-shell]');
    if(existing)return;
    const link=document.createElement('link');link.id='storeShellStyles';link.dataset.storeShell='true';link.rel='stylesheet';link.href='/store-shell.css?v=20260909-1';document.head.appendChild(link);
  }
  function productIdFromPath(){const m=location.pathname.match(/^\/product\/([^/]+)\/?$/i);return m?decodeURIComponent(m[1]):null}
  function addCanonical(){const existing=document.querySelector('link[rel="canonical"]');if(existing){if(productIdFromPath())existing.href=`${BASE}product/${encodeURIComponent(productIdFromPath())}`;return}const path=location.pathname;const productId=productIdFromPath();let canonical=path.replace(/\.html$/i,'');if(productId)canonical=`/product/${encodeURIComponent(productId)}`;canonical=canonical==='/'?BASE:BASE+canonical.replace(/^\//,'');const link=document.createElement('link');link.rel='canonical';link.href=canonical;document.head.appendChild(link)}
  function setOpenGraph(){let image=`${BASE}assets/here-banner.webp`;const id=productIdFromPath();const p=id&&Array.isArray(window.PRODUCTS)?window.PRODUCTS.find(x=>x.id===id):null;if(p?.image)image=new URL(p.image,BASE).href;let meta=document.querySelector('meta[property="og:image"]');if(!meta){meta=document.createElement('meta');meta.setAttribute('property','og:image');document.head.appendChild(meta)}meta.content=image}
  function setRobots(){if(!/(^|\/)(admin|login|account|thank-you)\.html$/i.test(location.pathname))return;let meta=document.querySelector('meta[name="robots"]');if(!meta){meta=document.createElement('meta');meta.name='robots';document.head.appendChild(meta)}meta.content='noindex,nofollow'}
  function standardizeHeader(){const wrap=document.querySelector('.site-header .nav-wrap');if(!wrap)return;wrap.innerHTML=`<a class="brand" href="index.html"><img class="brand-logo" src="${LOGO}" alt="Talha Bilal Store"></a><nav class="desktop-nav"></nav><a class="cart-button" href="/products">🛒 Shop Products</a>`}
  function standardizeNav(){const nav=document.querySelector('.desktop-nav');if(nav)nav.innerHTML=links.map(([label,href])=>`<a href="${href}">${label}</a>`).join('')}
  function standardizeFooter(){const footer=document.querySelector('.footer');if(!footer)return;const grid=footer.querySelector('.footer-grid');if(grid)grid.innerHTML=`<div class="footer-brand"><img class="footer-logo" src="${LOGO}" alt="Talha Bilal Store"><p>Quality Mango Pulp Drink Premix delivered across Pakistan with Cash on Delivery.</p><div class="footer-socials" aria-label="Social media"><span>Follow us</span>${socials.map(s=>`<a href="${s.url}" target="_blank" rel="noopener noreferrer" aria-label="${s.label}">${s.icon}</a>`).join('')}</div></div><div><h4>Shop</h4><a href="/products">All Products</a><a href="/products?view=best-sellers">Best Sellers</a><a href="/products?view=new-products">New Products</a><a href="index.html">Home</a></div><div><h4>Customer Support</h4><a href="how-to-order.html">How to Order</a><a href="track-order.html">Track Order</a><a href="reviews.html">Customer Reviews</a><a href="policies.html#contact">Contact Us</a></div><div><h4>Information</h4><a href="why-us.html">Why Choose Us</a><a href="policies.html#privacy">Privacy Policy</a><a href="policies.html#returns">Return &amp; Exchange</a><a href="account.html">My Account</a></div>`;const bottom=footer.querySelector('.footer-bottom');if(bottom)bottom.innerHTML='<span>© 2026 Talha Bilal Store. All rights reserved.</span><span>Cash on Delivery • Quality Products • Customer Support</span>'}
  function standardizeAnnouncement(){const bar=document.querySelector('.announcement');if(!bar)return;bar.innerHTML='<span class="announcement-sr">🚚 Buy With Cash on Delivery • 📦 Quality Products</span><div class="announcement-viewport"><div class="announcement-track"><span>🚚 Buy With Cash on Delivery&nbsp;&nbsp; • &nbsp;&nbsp;📦 Quality Products</span><span aria-hidden="true">🚚 Buy With Cash on Delivery&nbsp;&nbsp; • &nbsp;&nbsp;📦 Quality Products</span><span aria-hidden="true">🚚 Buy With Cash on Delivery&nbsp;&nbsp; • &nbsp;&nbsp;📦 Quality Products</span><span aria-hidden="true">🚚 Buy With Cash on Delivery&nbsp;&nbsp; • &nbsp;&nbsp;📦 Quality Products</span></div></div>'}
  function normalizeProductLinks(){const rewrite=()=>document.querySelectorAll('a.product-link,a.product-title-link').forEach(a=>{const m=a.getAttribute('href')?.match(/^product\.html\?id=([^&]+)/i);if(m)a.href=`/product/${encodeURIComponent(decodeURIComponent(m[1]))}`});setTimeout(rewrite,0)}
  function useLogo(){document.querySelectorAll('.brand img,.footer-logo').forEach(img=>{img.src=LOGO;img.alt='Talha Bilal Store';img.style.background='transparent'})}
  function removeProductDescription(){if(/\/product(?:\.html)?$/i.test(location.pathname)||productIdFromPath())document.querySelectorAll('.detail-description').forEach(el=>el.remove())}
  function fixStandaloneCart(){const cart=document.getElementById('cartButton');if(cart&&!document.getElementById('cartDrawer')&&cart.tagName==='BUTTON'){const link=document.createElement('a');link.className='cart-button';link.href='/products';link.innerHTML='🛒 Shop Products';cart.replaceWith(link)}}
  function prefillTrackOrder(){if(!/\/track-order(?:\.html)?$/i.test(location.pathname))return;const order=new URLSearchParams(location.search).get('order');const input=document.getElementById('order');if(order&&input)input.value=order}
  function closeProductAccordions(){if(/\/product(?:\.html)?$/i.test(location.pathname)||productIdFromPath())document.querySelectorAll('.detail-accordions details').forEach(d=>{d.open=false})}
  function buildMenu(){const header=document.querySelector('.site-header .nav-wrap');if(!header||document.getElementById('siteMenuToggle'))return;const toggle=document.createElement('button');toggle.id='siteMenuToggle';toggle.className='mobile-menu-toggle';toggle.type='button';toggle.setAttribute('aria-label','Open menu');toggle.setAttribute('aria-expanded','false');toggle.innerHTML='<span></span><span></span><span></span>';header.insertBefore(toggle,header.firstElementChild);const overlay=document.createElement('div');overlay.id='siteMenuOverlay';overlay.className='site-menu-overlay';overlay.hidden=true;const drawer=document.createElement('aside');drawer.id='siteMenuDrawer';drawer.className='site-menu-drawer';drawer.setAttribute('aria-hidden','true');drawer.innerHTML=`<div class="site-menu-head"><strong>Talha Bilal Store</strong><button type="button" id="siteMenuClose" aria-label="Close menu">×</button></div><nav>${links.map(([label,href])=>`<a href="${href}">${label}<span>→</span></a>`).join('')}</nav>`;document.body.append(drawer,overlay);const close=()=>{drawer.classList.remove('open');overlay.hidden=true;toggle.setAttribute('aria-expanded','false');drawer.setAttribute('aria-hidden','true');document.body.classList.remove('menu-open')};const open=()=>{drawer.classList.add('open');overlay.hidden=false;toggle.setAttribute('aria-expanded','true');drawer.setAttribute('aria-hidden','false');document.body.classList.add('menu-open')};toggle.addEventListener('click',open);overlay.addEventListener('click',close);drawer.querySelector('#siteMenuClose').addEventListener('click',close);drawer.querySelectorAll('a').forEach(a=>a.addEventListener('click',close));document.addEventListener('keydown',e=>{if(e.key==='Escape')close()})}
  init();
  function init(){ensureRootBase();loadShellStyles();addCanonical();setOpenGraph();setRobots();standardizeHeader();standardizeAnnouncement();standardizeNav();standardizeFooter();normalizeProductLinks();useLogo();removeProductDescription();fixStandaloneCart();prefillTrackOrder();buildMenu();closeProductAccordions()}
})();
