(() => {
  const BASE = 'https://www.talhabilalstore.com/';
  const links = [
    ['Home', 'index.html'],
    ['All Products', 'products.html'],
    ['Why Us', 'why-us.html'],
    ['How to Order', 'how-to-order.html'],
    ['Reviews', 'reviews.html'],
    ['Policies', 'policies.html'],
    ['Track Order', 'track-order.html'],
    ['My Account', 'account.html']
  ];

  function addCanonical() {
    if (document.querySelector('link[rel="canonical"]')) return;
    const path = location.pathname.endsWith('/') ? '/index.html' : location.pathname;
    let canonical = BASE + path.replace(/^\//, '');
    const productId = new URLSearchParams(location.search).get('id');
    if (path.endsWith('/product.html') && productId) canonical += `?id=${encodeURIComponent(productId)}`;
    const link = document.createElement('link');
    link.rel = 'canonical';
    link.href = canonical;
    document.head.appendChild(link);
  }

  function setRobots() {
    const privatePages = /(^|\/)(admin|login|account|thank-you)\.html$/i.test(location.pathname);
    if (!privatePages) return;
    let meta = document.querySelector('meta[name="robots"]');
    if (!meta) { meta = document.createElement('meta'); meta.name = 'robots'; document.head.appendChild(meta); }
    meta.content = 'noindex,nofollow';
  }

  function standardizeNav() {
    const nav = document.querySelector('.desktop-nav');
    if (nav) nav.innerHTML = links.map(([label, href]) => `<a href="${href}">${label}</a>`).join('');
  }

  function useTransparentLogo() {
    document.querySelectorAll('.brand img,.footer-logo').forEach(img => {
      img.src = 'assets/logo.svg';
      img.alt = 'Talha Bilal Store';
    });
  }

  function buildMenu() {
    const header = document.querySelector('.site-header .nav-wrap');
    if (!header || document.getElementById('siteMenuToggle')) return;
    const toggle = document.createElement('button');
    toggle.id = 'siteMenuToggle';
    toggle.className = 'mobile-menu-toggle';
    toggle.type = 'button';
    toggle.setAttribute('aria-label', 'Open menu');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.innerHTML = '<span></span><span></span><span></span>';
    header.insertBefore(toggle, header.firstElementChild);

    const overlay = document.createElement('div');
    overlay.id = 'siteMenuOverlay';
    overlay.className = 'site-menu-overlay';
    overlay.hidden = true;

    const drawer = document.createElement('aside');
    drawer.id = 'siteMenuDrawer';
    drawer.className = 'site-menu-drawer';
    drawer.setAttribute('aria-hidden', 'true');
    drawer.innerHTML = `<div class="site-menu-head"><strong>Talha Bilal Store</strong><button type="button" id="siteMenuClose" aria-label="Close menu">×</button></div><nav>${links.map(([label, href]) => `<a href="${href}">${label}<span>→</span></a>`).join('')}</nav>`;
    document.body.append(drawer, overlay);

    const close = () => {
      drawer.classList.remove('open');
      overlay.hidden = true;
      toggle.setAttribute('aria-expanded', 'false');
      drawer.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('menu-open');
    };
    const open = () => {
      drawer.classList.add('open');
      overlay.hidden = false;
      toggle.setAttribute('aria-expanded', 'true');
      drawer.setAttribute('aria-hidden', 'false');
      document.body.classList.add('menu-open');
    };
    toggle.addEventListener('click', open);
    overlay.addEventListener('click', close);
    drawer.querySelector('#siteMenuClose').addEventListener('click', close);
    drawer.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  }

  function init() {
    addCanonical();
    setRobots();
    standardizeNav();
    useTransparentLogo();
    buildMenu();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
