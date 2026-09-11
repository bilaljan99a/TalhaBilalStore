(() => {
  const PIXEL_ID = '2937138116646692';
  const currency = 'PKR';

  function track(event, data) {
    if (typeof window.fbq === 'function') window.fbq('track', event, data || {});
  }

  function productById(id) {
    return Array.isArray(window.PRODUCTS) ? window.PRODUCTS.find(p => p.id === id) : null;
  }

  function trackViewContent() {
    const match = location.pathname.match(/^\/product\/([^/]+)\/?$/i);
    const id = match ? decodeURIComponent(match[1]) : new URLSearchParams(location.search).get('id');
    if (!id) return;
    const p = productById(id);
    if (!p) return;
    const key = `tb_meta_view_${p.id}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
    track('ViewContent', {
      content_ids: [p.id],
      content_type: 'product',
      content_name: p.name,
      value: Number(p.price),
      currency
    });
  }

  function trackAddToCart(id, quantity = 1) {
    const p = productById(id);
    if (!p) return;
    track('AddToCart', {
      content_ids: [p.id],
      content_type: 'product',
      content_name: p.name,
      value: Number(p.price) * Number(quantity || 1),
      currency
    });
  }

  document.addEventListener('click', event => {
    const addButton = event.target.closest?.('[data-add]');
    if (addButton) trackAddToCart(addButton.dataset.add, 1);

    const addLink = event.target.closest?.('a[href*="?add="]');
    if (addLink) {
      const href = new URL(addLink.href, location.origin);
      const id = href.searchParams.get('add');
      if (id) trackAddToCart(id, 1);
    }
  }, true);

  function trackInitiateCheckout() {
    const totalEl = document.getElementById('checkoutGrandTotal');
    const total = totalEl ? Number(String(totalEl.textContent).replace(/[^0-9.]/g, '')) : 0;
    const quantityEl = document.getElementById('orderQuantity');
    const quantity = quantityEl ? Number(quantityEl.value || 1) : 1;
    track('InitiateCheckout', {
      value: total || undefined,
      currency,
      num_items: quantity
    });
  }

  function watchCheckout() {
    const modal = document.getElementById('orderModal');
    if (!modal) return;
    let wasHidden = modal.hidden;
    const observer = new MutationObserver(() => {
      if (wasHidden && !modal.hidden) trackInitiateCheckout();
      wasHidden = modal.hidden;
    });
    observer.observe(modal, { attributes: true, attributeFilter: ['hidden'] });
  }

  function installPurchaseTracking() {
    if (window.__tbMetaFetchWrapped) return;
    window.__tbMetaFetchWrapped = true;
    const originalFetch = window.fetch;
    window.fetch = async function(input, init) {
      const url = typeof input === 'string' ? input : input?.url || '';
      const isOrderRequest = url.includes('/functions/v1/create-order');
      let orderPayload = null;
      if (isOrderRequest && init?.body) {
        try { orderPayload = JSON.parse(init.body); } catch {}
      }
      const response = await originalFetch.apply(this, arguments);
      if (isOrderRequest && orderPayload) {
        try {
          const result = await response.clone().json();
          if (result?.success && result?.order_number) {
            const key = `tb_meta_purchase_${result.order_number}`;
            if (!sessionStorage.getItem(key)) {
              sessionStorage.setItem(key, '1');
              track('Purchase', {
                content_ids: Array.isArray(orderPayload.items) ? orderPayload.items.map(i => i.id).filter(Boolean) : [],
                content_type: 'product',
                value: Number(orderPayload.total || 0),
                currency,
                num_items: Array.isArray(orderPayload.items) ? orderPayload.items.reduce((sum, i) => sum + Number(i.quantity || 0), 0) : 0
              });
            }
          }
        } catch {}
      }
      return response;
    };
  }

  function init() {
    if (window.__tbMetaEventsInitialized) return;
    window.__tbMetaEventsInitialized = true;
    installPurchaseTracking();
    trackViewContent();
    watchCheckout();

    const addId = new URLSearchParams(location.search).get('add');
    if (addId) trackAddToCart(addId, 1);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
