(() => {
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
  }, true);

  function trackInitiateCheckout() {
    // Prevent duplicate checkout events caused by multiple near-simultaneous
    // modal/DOM callbacks. A new checkout after this short window is still tracked.
    const now = Date.now();
    if (now - Number(window.__tbLastInitiateCheckoutAt || 0) < 1500) return;
    window.__tbLastInitiateCheckoutAt = now;

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
            sessionStorage.setItem(`tb_pending_purchase_${result.order_number}`, JSON.stringify({
              content_ids: Array.isArray(orderPayload.items) ? orderPayload.items.map(i => i.id).filter(Boolean) : [],
              content_type: 'product',
              value: Number(orderPayload.total || 0),
              currency,
              num_items: Array.isArray(orderPayload.items) ? orderPayload.items.reduce((sum, i) => sum + Number(i.quantity || 0), 0) : 0
            }));
          }
        } catch {}
      }
      return response;
    };
  }

  async function fetchPurchaseFallback(orderId) {
    try {
      const url = `/functions/v1/purchase-data?order=${encodeURIComponent(orderId)}`;
      const response = await fetch(url, { method: 'GET', cache: 'no-store' });
      if (!response.ok) return null;
      const result = await response.json();
      if (!result?.success) return null;
      const total = Number(result.order?.total);
      if (!Number.isFinite(total) || total <= 0) return null;
      const items = Array.isArray(result.order?.items) ? result.order.items : [];
      return {
        content_ids: items.map(i => i?.id).filter(Boolean),
        content_type: 'product',
        value: total,
        currency,
        num_items: items.reduce((sum, i) => sum + Number(i?.quantity || 0), 0)
      };
    } catch {
      return null;
    }
  }

  async function trackThankYouPurchase() {
    const orderId = new URLSearchParams(location.search).get('order');
    if (!orderId) return;

    const pageKey = `tbPurchaseSent_${orderId}`;
    if (window[pageKey]) return;
    window[pageKey] = true;

    const key = `purchase_tracked_${orderId}`;
    const alreadyTracked =
      localStorage.getItem(key) === '1' ||
      sessionStorage.getItem(key) === '1';
    if (alreadyTracked) return;

    let data = {};
    try {
      const pendingKey = `tb_pending_purchase_${orderId}`;
      const raw = sessionStorage.getItem(pendingKey) || localStorage.getItem(pendingKey) || '';
      data = JSON.parse(raw || '{}');
    } catch {}

    let purchaseValue = Number(data.value);

    // Robust fallback: if the checkout-page handoff was lost, retrieve only
    // the minimum purchase data needed for Meta from the dedicated read-only
    // Edge Function. This avoids exposing the orders table through RLS.
    if (!Number.isFinite(purchaseValue) || purchaseValue <= 0) {
      const fallback = await fetchPurchaseFallback(orderId);
      if (fallback) {
        data = fallback;
        purchaseValue = fallback.value;
      }
    }

    if (!Number.isFinite(purchaseValue) || purchaseValue <= 0) {
      console.warn('Meta Purchase skipped: valid order value was not available.');
      return;
    }

    localStorage.setItem(key, '1');
    sessionStorage.setItem(key, '1');

    track('Purchase', {
      ...data,
      content_type: data.content_type || 'product',
      value: purchaseValue,
      currency: data.currency || currency
    });
    sessionStorage.removeItem(`tb_pending_purchase_${orderId}`);
    localStorage.removeItem(`tb_pending_purchase_${orderId}`);
  }

  function init() {
    if (window.__tbMetaEventsInitialized) return;
    window.__tbMetaEventsInitialized = true;
    installPurchaseTracking();
    trackThankYouPurchase();
    trackViewContent();
    watchCheckout();

    const addId = new URLSearchParams(location.search).get('add');
    if (addId) {
      trackAddToCart(addId, 1);
      history.replaceState({}, '', location.pathname);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();