(() => {
  "use strict";
  const ENDPOINT = "https://dxdjqeqlmyawqrzphzdb.supabase.co/functions/v1/cms-public";
  const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  function firstImage(images) {
    if (!Array.isArray(images)) {
      if (typeof images === "string" && images.trim()) { try { images = JSON.parse(images); } catch { images = [images]; } }
      else return "";
    }
    const x = images[0];
    return typeof x === "string" ? x : (x && typeof x === "object" ? (x.url || x.src || x.path || "") : "");
  }
  function mapProduct(row, categories) {
    const cat = categories.find(x => Number(x.id) === Number(row.category_id));
    let images = Array.isArray(row.images) ? row.images : [];
    if (!images.length && typeof row.images === "string" && row.images.trim()) {
      try { images = JSON.parse(row.images); } catch { images = [row.images]; }
    }
    if (!images.length && row.image_url) images = [row.image_url];
    if (!images.length && row.image) images = [row.image];
    const image = firstImage(images);
    let variations = Array.isArray(row.variations) ? row.variations : [];
    if (!variations.length && typeof row.variations === "string" && row.variations.trim()) {
      try { variations = JSON.parse(row.variations); } catch { variations = []; }
    }
    const price = row.sale_price != null ? Number(row.sale_price) : Number(row.price || 0);
    const was = row.old_price != null ? Number(row.old_price) : (row.sale_price != null ? Number(row.price || 0) : 0);
    const summarySource = String(row.short_description || "").replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim();
    const shortDescription = summarySource.length > 135 ? summarySource.slice(0,134).replace(/\s+\S*$/,"").trim()+"…" : summarySource;
    return {
      id:String(row.slug), cmsRecordId:Number(row.id), isCmsProduct:true,
      isMangoPremix:cat?.slug === "mango-pulp-premix" || /mango\s+pulp/i.test(String(row.name || "")),
      name:String(row.name || "Product"), description:String(row.description || row.short_description || ""),
      shortDescription,
      price, oldPrice:was > price ? was : undefined,
      weight:Number(row.weight_kg) > 0 ? Number(row.weight_kg) : 1,
      deliveryMode:row.delivery_mode==="manual"?"manual":"weight",
      manualDeliveryFee:Math.max(0,Number(row.manual_delivery_fee)||0),
      showWeight:!!row.show_weight,
      variations,
      videoUrl:String(row.video_url || "").trim(),
      image:image || "/assets/products/mango-pulp-product-image.webp",
      images:images.map(x => typeof x === "string" ? x : (x?.url || x?.src || "")).filter(Boolean),
      tag:String(row.tag || cat?.name || "NEW PRODUCT"), categoryId:Number(row.category_id || 0) || null,
      categorySlug:cat?.slug || "", categoryName:cat?.name || "", featured:!!row.featured,
      bestSellerRank:row.best_seller ? 1 : undefined, newProductRank:row.is_new ? 1 : undefined,
      seo:row.seo && typeof row.seo === "object" ? row.seo : {}
    };
  }
  function injectStyles() {
    if (document.getElementById("cms-public-style")) return;
    const st = document.createElement("style"); st.id = "cms-public-style";
    st.textContent = [
      ".cms-category-filters{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 24px}",
      ".cms-category-filter{display:inline-flex;padding:9px 14px;border:1px solid #e5e7eb;border-radius:999px;text-decoration:none;color:inherit;background:#fff;font-size:14px;font-weight:650}",
      ".cms-category-filter[aria-current=true],.cms-category-filter:hover{background:#17191d;color:#fff;border-color:#17191d}",
      ".cms-homepage-banners{display:grid;gap:14px;margin:18px auto 24px}",
      ".cms-home-no-grid-banners #cmsHomepageHeroSlider.cms-homepage-banners{margin:4px auto 0;gap:0}",
      ".cms-home-no-grid-banners #cmsHomepageHeroSlider .cms-banner-slider{padding-bottom:8px}",
      ".cms-home-no-grid-banners #cmsHomepageHeroSlider .cms-slider-dots{padding:1px 0}",
      ".cms-home-no-grid-banners .home-products.products-section{padding-top:28px!important}",
      "@media(max-width:700px){.cms-home-no-grid-banners #cmsHomepageHeroSlider.cms-homepage-banners{margin:2px auto 0}.cms-home-no-grid-banners #cmsHomepageHeroSlider .cms-banner-slider{padding-bottom:6px}.cms-home-no-grid-banners .home-products.products-section{padding-top:16px!important}.cms-home-no-grid-banners .home-products .section-heading{margin-bottom:18px}}",
      ".cms-banner-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;width:100%}",
      ".cms-banner-grid .cms-home-banner{margin:0;width:100%;min-width:0;aspect-ratio:1/1;overflow:hidden;border-radius:12px;background:#f3f4f6}",
      ".cms-banner-grid .cms-home-banner picture,.cms-banner-grid .cms-home-banner img{display:block;width:100%;height:100%;object-fit:contain}",
      ".cms-banner-grid .cms-home-banner-copy{padding:10px}",
      ".cms-banner-grid .cms-banner-cta{font-size:12px;padding:7px 10px}",
      ".cms-banner-grid .cms-home-banner--grid{position:relative;display:flex;flex-direction:column;align-items:stretch;aspect-ratio:auto;height:auto;min-width:0;overflow:hidden;box-sizing:border-box;border:1px solid #e5e7eb;border-radius:12px;background:#fff;color:#17191d;text-decoration:none;transition:border-color .15s ease,transform .15s ease}",
      ".cms-banner-grid .cms-home-banner--grid:hover{border-color:#ff6a00;transform:translateY(-1px)}",
      ".cms-banner-grid .cms-home-banner-grid-link{display:block;min-width:0;color:inherit;text-decoration:none}",
      ".cms-banner-grid .cms-home-banner--grid:focus-visible{outline:2px solid #ff6a00;outline-offset:2px}",
      ".cms-banner-grid .cms-home-banner--grid picture{display:block;width:100%;height:auto;aspect-ratio:1/1;overflow:hidden;flex:0 0 auto;background:#fff}",
      ".cms-banner-grid .cms-home-banner--grid picture img{display:block;width:100%;height:100%;object-fit:contain;background:#fff}",
      ".cms-banner-grid .cms-home-banner-grid-copy{display:block;box-sizing:border-box;min-height:54px;padding:8px 34px 9px 9px;background:#fff;color:#17191d}",
      ".cms-banner-grid .cms-home-banner-grid-copy h2{margin:0;font-size:12px;line-height:1.3;font-weight:750;color:inherit;text-shadow:none;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;overflow-wrap:anywhere}",
      ".cms-banner-grid .cms-home-banner-grid-copy p{margin:4px 0 0;font-size:11px;line-height:1.35;color:#5f6368;text-shadow:none;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}",
      ".cms-banner-grid .cms-grid-add{position:absolute;right:8px;bottom:8px;z-index:3;display:flex;align-items:center;justify-content:center;width:27px;height:27px;padding:0;border:0;border-radius:50%;background:#ff6a00;color:#fff;font-size:21px;line-height:1;font-weight:700;box-shadow:0 2px 7px #0002}",
      ".cms-banner-grid .cms-grid-add:hover{background:#e85f00}",
      ".cms-banner-grid .cms-grid-add-icon{display:block;width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}",
      ".cms-banner-grid .cms-grid-add:focus-visible{outline:2px solid #17191d;outline-offset:2px}",
      ".cms-banner-slide>.cms-legacy-hero-slide{margin:0!important;padding:0!important}",
      ".cms-banner-slide>.cms-legacy-hero-slide .container{width:100%;max-width:none;margin:0;padding:0}",
      ".cms-banner-slide>.cms-legacy-hero-slide img{display:block;width:100%;height:auto;object-fit:contain}",
      "@media(max-width:900px){.cms-banner-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}}",
      "@media(max-width:480px){.cms-banner-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.cms-banner-grid .cms-home-banner--grid{border-radius:10px}.cms-banner-grid .cms-home-banner--grid picture{aspect-ratio:1/1}.cms-banner-grid .cms-home-banner-grid-copy{min-height:48px;padding:7px 30px 8px 8px}.cms-banner-grid .cms-home-banner-grid-copy h2{font-size:11px;line-height:1.25}.cms-banner-grid .cms-home-banner-grid-copy p{font-size:10px;line-height:1.3}.cms-banner-grid .cms-grid-add{right:6px;bottom:6px;width:24px;height:24px;font-size:19px}.cms-banner-grid .cms-home-banner--overlay{border-radius:8px}}",
      "#cmsHomepageBanners[hidden],#cmsHomepageHeroSlider[hidden],#cmsHomepageSlider[hidden]{display:none!important}",
      ".cms-banner-slider{position:relative;width:100%;padding:0 0 26px}",
      ".cms-banner-slider-track{position:relative;min-width:0}",
      ".cms-banner-slide[hidden]{display:none!important}",
      ".cms-banner-slider .cms-home-banner{margin:0;width:100%}",
      ".cms-banner-slider .cms-home-banner--split{grid-template-columns:minmax(0,1fr) minmax(0,1.15fr);min-height:220px}",
      ".cms-banner-slider .cms-home-banner--split img{max-height:270px;width:100%;object-fit:contain}",
      ".cms-slider-control{position:absolute;top:calc(50% - 13px);transform:translateY(-50%);z-index:4;width:38px;height:38px;border:1px solid rgba(255,255,255,.75);border-radius:50%;background:rgba(255,255,255,.92);color:#171717;font-size:25px;line-height:1;box-shadow:0 2px 10px rgba(0,0,0,.16);cursor:pointer}",
      ".cms-slider-prev{left:12px}",
      ".cms-slider-next{right:12px}",
      ".cms-slider-dots{position:absolute;left:0;right:0;bottom:0;display:flex;justify-content:center;gap:8px;padding:6px 0}",
      ".cms-slider-dot{width:9px;height:9px;padding:0;border:0;border-radius:50%;background:#cbd5e1;cursor:pointer}",
      ".cms-slider-dot[aria-current=true]{background:#ff6a00;transform:scale(1.15)}",
      ".store-banner.cms-banner-replaced{display:none!important}",
      ".cms-home-banner{position:relative;display:block;width:100%;box-sizing:border-box;overflow:hidden;border:1px solid #e8e8e8;border-radius:16px;background:#fff;text-decoration:none;color:#151515;padding:0;line-height:1.4;isolation:isolate}",
      ".cms-home-banner--overlay{--cms-banner-text-color:#fff}",
      ".cms-home-banner--overlay picture{display:block;width:100%;min-width:0;line-height:0}",
      ".cms-home-banner--overlay img{display:block;width:100%;height:auto;max-height:none;object-fit:contain;border-radius:0}",
      ".cms-home-banner--overlay .cms-home-banner-copy{position:absolute;inset:0;z-index:2;display:flex;flex-direction:column;justify-content:flex-end;align-items:flex-start;box-sizing:border-box;padding:clamp(12px,3vw,36px);color:var(--cms-banner-text-color,#fff);pointer-events:none;text-shadow:0 1px 3px rgba(0,0,0,.65)}",
      ".cms-home-banner--overlay .cms-home-banner-copy h2{margin:0 0 8px;font-size:clamp(20px,3vw,36px);line-height:1.16;color:inherit;max-width:min(78%,720px)}",
      ".cms-home-banner--overlay .cms-home-banner-copy p{margin:0;line-height:1.45;color:inherit;max-width:min(78%,720px);font-size:clamp(13px,1.35vw,18px)}",
      ".cms-home-banner--text-top-left .cms-home-banner-copy{justify-content:flex-start;align-items:flex-start;text-align:left}",
      ".cms-home-banner--text-top-center .cms-home-banner-copy{justify-content:flex-start;align-items:center;text-align:center}",
      ".cms-home-banner--text-top-right .cms-home-banner-copy{justify-content:flex-start;align-items:flex-end;text-align:right}",
      ".cms-home-banner--text-middle-left .cms-home-banner-copy{justify-content:center;align-items:flex-start;text-align:left}",
      ".cms-home-banner--text-center .cms-home-banner-copy{justify-content:center;align-items:center;text-align:center}",
      ".cms-home-banner--text-middle-right .cms-home-banner-copy{justify-content:center;align-items:flex-end;text-align:right}",
      ".cms-home-banner--text-bottom-left .cms-home-banner-copy{justify-content:flex-end;align-items:flex-start;text-align:left}",
      ".cms-home-banner--text-bottom-center .cms-home-banner-copy{justify-content:flex-end;align-items:center;text-align:center}",
      ".cms-home-banner--text-bottom-right .cms-home-banner-copy{justify-content:flex-end;align-items:flex-end;text-align:right}",
      ".cms-home-banner--overlay .cms-banner-cta{position:absolute;z-index:3;display:inline-flex;align-items:center;justify-content:center;box-sizing:border-box;max-width:calc(100% - 24px);line-height:1.2;background:#ff6a00;color:#fff;padding:10px 15px;border-radius:8px;font-weight:750;font-size:clamp(12px,1.2vw,15px);box-shadow:0 3px 12px rgba(0,0,0,.22);text-shadow:none;pointer-events:none;white-space:normal}",
      ".cms-home-banner--button-top-left .cms-banner-cta{top:clamp(10px,2.5vw,28px);left:clamp(10px,2.5vw,28px)}",
      ".cms-home-banner--button-top-right .cms-banner-cta{top:clamp(10px,2.5vw,28px);right:clamp(10px,2.5vw,28px)}",
      ".cms-home-banner--button-bottom-left .cms-banner-cta{bottom:clamp(10px,2.5vw,28px);left:clamp(10px,2.5vw,28px)}",
      ".cms-home-banner--button-bottom-right .cms-banner-cta{bottom:clamp(10px,2.5vw,28px);right:clamp(10px,2.5vw,28px)}",
      ".cms-home-banner--split{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(220px,.8fr);gap:22px;align-items:center;overflow:hidden;padding:18px 22px}",
      ".cms-home-banner--split .cms-home-banner-copy{position:static;display:block;padding:0;color:#151515;text-shadow:none;pointer-events:auto}",
      ".cms-home-banner--split .cms-home-banner-copy h2{margin:0 0 8px;font-size:clamp(20px,3vw,32px);line-height:1.2;color:inherit}",
      ".cms-home-banner--split .cms-home-banner-copy p{margin:0 0 12px;line-height:1.55;color:#555}",
      ".cms-home-banner--split .cms-banner-cta{position:static;display:inline-block;background:#ff6a00;color:#fff;padding:10px 15px;border-radius:8px;font-weight:750;box-shadow:none;text-shadow:none}",
      ".cms-home-banner--split img{display:block;width:100%;max-height:220px;object-fit:contain;border-radius:10px}",
      ".cms-home-banner--split picture{display:block;width:100%;min-width:0}",
      ".cms-blog-card-image{width:100%;height:100%;min-height:270px;object-fit:cover}",
      "@media(max-width:700px){.cms-home-banner--split{grid-template-columns:1fr;padding:15px;gap:12px}.cms-home-banner--split img{max-height:210px;grid-row:1}.cms-home-banner--overlay .cms-home-banner-copy{padding:16px}.cms-home-banner--overlay .cms-home-banner-copy h2{font-size:clamp(17px,4.7vw,25px);max-width:85%}.cms-home-banner--overlay .cms-home-banner-copy p{font-size:13px;max-width:85%}.cms-home-banner--overlay .cms-banner-cta{padding:8px 11px;font-size:12px}.cms-slider-control{width:32px;height:32px;font-size:22px}.cms-slider-prev{left:7px}.cms-slider-next{right:7px}.cms-blog-card-image{height:240px;min-height:0}}",
    ].join("");
    document.head.appendChild(st);
  }
  function renderFilters(data) {
    const box = document.getElementById("cmsCategoryFilters"); if (!box) return;
    const selected = new URLSearchParams(location.search).get("category") || "";
    const cats = (data.categories || []).filter(c => (data.products || []).some(p => Number(p.category_id) === Number(c.id)));
    if (!cats.length) { box.hidden = true; box.innerHTML = ""; return; }
    box.hidden = false;
    box.innerHTML = ['<a class="cms-category-filter" href="/products" aria-current="'+(!selected)+'">All products</a>',
      ...cats.map(c => '<a class="cms-category-filter" href="/products?category='+encodeURIComponent(c.slug)+'" aria-current="'+(selected===c.slug)+'">'+esc(c.name)+'</a>')].join("");
  }
  function bannerMarkup(b, gridCard = false, data = null) {
    const rawDest = String(b.button_url || "").trim();
    const hasSafeDest = !!rawDest && !/^javascript:/i.test(rawDest) &&
      (/^https?:\/\//i.test(rawDest) || !/^[a-z][a-z0-9+.-]*:/i.test(rawDest));
    const dest = hasSafeDest ? rawDest : "/products";
    const desktop = b.image_url || b.mobile_image_url || "";
    const mobile = b.mobile_image_url || "";
    const title = String(b.title || "").trim();
    const subtitle = String(b.subtitle || "").trim();
    const buttonText = String(b.button_text || "").trim();
    const mode = b.display_mode === "split" ? "split" : "overlay";
    const textPositions = ["top-left","top-center","top-right","middle-left","center","middle-right","bottom-left","bottom-center","bottom-right"];
    const buttonPositions = ["top-left","top-right","bottom-left","bottom-right"];
    const textPosition = textPositions.includes(String(b.text_position || "")) ? String(b.text_position) : "bottom-left";
    const buttonPosition = buttonPositions.includes(String(b.button_position || "")) ? String(b.button_position) : "bottom-right";
    const rawColor = String(b.text_color || "").trim();
    const textColor = /^#[0-9a-f]{6}$/i.test(rawColor) ? rawColor : "#ffffff";
    const pic = desktop
      ? '<picture>' + (mobile && mobile !== desktop ? '<source media="(max-width: 700px)" srcset="' + esc(mobile) + '">' : "") +
        '<img src="' + esc(desktop) + '" alt="' + esc(title || "Store promotion") + '" loading="lazy" decoding="async"></picture>'
      : "";
    if (gridCard) {
      const copy = (title || subtitle)
        ? '<div class="cms-home-banner-grid-copy">' + (title ? '<h2>' + esc(title) + '</h2>' : "") +
          (subtitle ? '<p>' + esc(subtitle) + '</p>' : "") + '</div>'
        : "";
      const className = "cms-home-banner cms-home-banner--grid";
      let linkedProduct = null;
      if (hasSafeDest) {
        try {
          const path = new URL(dest, window.location.origin).pathname.replace(/\/$/, "");
          const match = path.match(/^\/product\/([^/]+)$/i);
          if (match) {
            const key = decodeURIComponent(match[1]);
            const products = (data && (data.siteProducts || data.products)) || window.PRODUCTS || [];
            linkedProduct = products.find(p => String(p.id) === key || String(p.slug || "") === key) || null;
          }
        } catch (_) {}
      }
      const cardLink = hasSafeDest
        ? '<a class="cms-home-banner-grid-link" href="' + esc(dest) + '" aria-label="View ' + esc(title || "product") + '">' + pic + copy + '</a>'
        : pic + copy;
      const addButton = linkedProduct
        ? '<button class="cms-grid-add" type="button" data-add="' + esc(linkedProduct.id) + '" aria-label="Add ' + esc(linkedProduct.name || title || "product") + ' to cart" title="Add to cart"><svg class="cms-grid-add-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M3 3h2l2.2 11.1a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 1.9-1.4L21 8H6"/><circle cx="10" cy="19" r="1.4"/><circle cx="17" cy="19" r="1.4"/><path d="M16 4v5M13.5 6.5h5"/></svg></button>'
        : "";
      return '<div class="' + className + '">' + cardLink + addButton + '</div>';
    }
    if (mode === "split") {
      return '<a class="cms-home-banner cms-home-banner--split" href="' + esc(dest) + '">' +
        '<div class="cms-home-banner-copy">' + (title ? '<h2>' + esc(title) + '</h2>' : "") +
        (subtitle ? '<p>' + esc(subtitle) + '</p>' : "") +
        (buttonText ? '<span class="cms-banner-cta">' + esc(buttonText) + '</span>' : "") +
        '</div>' + pic + '</a>';
    }
    return '<a class="cms-home-banner cms-home-banner--overlay cms-home-banner--text-' + textPosition +
      ' cms-home-banner--button-' + buttonPosition + '" style="--cms-banner-text-color:' + textColor +
      '" href="' + esc(dest) + '">' + pic +
      ((title || subtitle) ? '<div class="cms-home-banner-copy">' + (title ? '<h2>' + esc(title) + '</h2>' : "") +
        (subtitle ? '<p>' + esc(subtitle) + '</p>' : "") + '</div>' : "") +
      (buttonText ? '<span class="cms-banner-cta">' + esc(buttonText) + '</span>' : "") + '</a>';
  }
  function bannerSliderMarkup(banners) {
    const total = banners.length;
    const slides = banners.map((b, position) => {
      return '<div class="cms-banner-slide" data-cms-slide="' + position + '"' +
        (position ? " hidden" : "") + '>' + bannerMarkup(b) + '</div>';
    }).join("");
    const controls = total > 1
      ? '<button type="button" class="cms-slider-control cms-slider-prev" data-slider-prev aria-label="Previous hero slide">‹</button>' +
        '<button type="button" class="cms-slider-control cms-slider-next" data-slider-next aria-label="Next hero slide">›</button>' +
        '<div class="cms-slider-dots" aria-label="Choose hero slide">' + Array.from({length:total}, (_, i) => '<button type="button" class="cms-slider-dot" data-slider-dot="' + i + '" aria-label="Show hero slide ' + (i + 1) + '" aria-current="' + (i === 0 ? "true" : "false") + '"></button>').join("") + '</div>'
      : "";
    return '<div class="cms-banner-slider" data-cms-slider aria-label="Homepage hero slider"><div class="cms-banner-slider-track" aria-live="polite">' + slides + '</div>' + controls + '</div>';
  }
  function bannerGridMarkup(banners, data) {
    return '<div class="cms-banner-grid" aria-label="Homepage banner grid">' + banners.map(b => bannerMarkup(b, true, data)).join("") + '</div>';
  }
  function initBannerSlider(slot, intervalMs = 5500) {
    const slider = slot.querySelector("[data-cms-slider]");
    if (!slider) return;
    const slides = Array.from(slider.querySelectorAll("[data-cms-slide]"));
    const dots = Array.from(slider.querySelectorAll("[data-slider-dot]"));
    if (slides.length < 2) return;
    let current = 0, timer = null;
    const reducedMotion = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const show = next => {
      current = (next + slides.length) % slides.length;
      slides.forEach((slide, i) => { slide.hidden = i !== current; });
      dots.forEach((dot, i) => dot.setAttribute("aria-current", String(i === current)));
    };
    const stop = () => { if (timer !== null) { window.clearInterval(timer); timer = null; } };
    const delay = Number.isFinite(Number(intervalMs)) && Number(intervalMs) >= 1000 ? Number(intervalMs) : 5500;
    const start = () => { if (!reducedMotion && timer === null && !document.hidden) timer = window.setInterval(() => show(current + 1), delay); };
    slider.querySelector("[data-slider-prev]")?.addEventListener("click", () => show(current - 1));
    slider.querySelector("[data-slider-next]")?.addEventListener("click", () => show(current + 1));
    dots.forEach((dot, i) => dot.addEventListener("click", () => show(i)));
    slider.addEventListener("mouseenter", stop); slider.addEventListener("mouseleave", start);
    slider.addEventListener("focusin", stop); slider.addEventListener("focusout", start);
    document.addEventListener("visibilitychange", () => document.hidden ? stop() : start());
    start();
  }
  function renderBanners(data) {
    const active = data.banners || [];
    const hasHomepageGrid = active.some(b => String(b.placement || "").toLowerCase() === "homepage-slider");
    if (document.getElementById("cmsHomepageHeroSlider")) document.body.classList.toggle("cms-home-no-grid-banners", !hasHomepageGrid);
    injectStyles();
    const ordered = list => list.slice().sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0) || Number(a.id || 0) - Number(b.id || 0));
    const slots = [
      { id:"cmsHomepageBanners", placements:["sitewide"] },
      { id:"cmsHomepageHeroSlider", placements:["homepage","homepage-hero-slider"], slider:true, hero:true, intervalMs:2000 },
      { id:"cmsHomepageSlider", placements:["homepage-slider"], grid:true },
      { id:"cmsCatalogBanners", placements:["category","campaign","sitewide"] },
      { id:"cmsProductBanners", placements:["product","sitewide"] },
      { id:"cmsBlogBanners", placements:["blog","sitewide"] }
    ];
    for (const slotInfo of slots) {
      const slot = document.getElementById(slotInfo.id);
      if (!slot) continue;
      const banners = ordered(active.filter(b => slotInfo.placements.includes(String(b.placement || "").toLowerCase())));
      if (!banners.length) { slot.hidden = true; slot.innerHTML = ""; continue; }
      injectStyles();
      slot.hidden = false;
      if (slotInfo.slider) {
        slot.innerHTML = bannerSliderMarkup(banners);
        initBannerSlider(slot, slotInfo.intervalMs || 5500);
      } else if (slotInfo.grid) {
        slot.innerHTML = bannerGridMarkup(banners, data);
      } else {
        slot.innerHTML = banners.map(bannerMarkup).join("");
      }
    }
  }
  
function renderBlogListing(data) {
    const grid = document.querySelector(".blog-grid");
    if (!grid || !Array.isArray(data.blog_posts) || !data.blog_posts.length) return;
    injectStyles();
    grid.innerHTML = data.blog_posts.map(p => {
      const date = p.published_at ? new Date(p.published_at) : null;
      const label = date && Number.isFinite(date.getTime()) ? date.toLocaleDateString("en-GB",{month:"short",year:"numeric"}) : "Latest Article";
      const url = p.url || ("/blog/"+encodeURIComponent(p.slug)+".html");
      return '<article class="blog-card"><img class="cms-blog-card-image" src="'+esc(p.featured_image_url || "/assets/here-banner.webp")+'" alt="'+esc(p.title)+'" loading="lazy"><div class="blog-card-copy"><div class="blog-meta">'+esc(label)+'</div><h2>'+esc(p.title)+'</h2><p>'+esc(p.excerpt || "")+'</p><a class="blog-read" href="'+esc(url)+'">Read article →</a></div></article>';
    }).join("");
  }
  function setMeta(selector, key, value) {
    if (!value) return;
    let el = document.querySelector(selector);
    if (!el) {
      el = document.createElement("meta");
      const m = selector.match(/meta\[(name|property)="([^"]+)"\]/);
      if (m) el.setAttribute(m[1], m[2]);
      document.head.appendChild(el);
    }
    el.setAttribute(key, String(value));
  }
  function applySeo(data) {
    const path = location.pathname.replace(/\/+$/,"") || "/";
    const params = new URLSearchParams(location.search);
    let type = "site", row = null;
    const pm = path.match(/^\/product\/([^/]+)$/i);
    if (pm) { type="product"; row=(data.products||[]).find(x=>x.slug===decodeURIComponent(pm[1]))||null; }
    else if (/^\/blog\/[^/]+\.html$/i.test(path)) { type="blog"; const slug=path.split("/").pop().replace(/\.html$/i,""); row=(data.blog_posts||[]).find(x=>x.slug===slug)||null; }
    else if (path==="/products" && params.get("category")) { type="category"; row=(data.categories||[]).find(x=>x.slug===params.get("category"))||null; }
    else if (path==="/" || /\/index\.html$/i.test(path)) { type="page"; row=(data.pages||[]).find(x=>["home","homepage"].includes(x.slug))||null; }
    else if (/^\/page\/[^/]+$/i.test(path)) { type="page"; const slug=decodeURIComponent(path.split("/").pop()); row=(data.pages||[]).find(x=>x.slug===slug)||null; }
    else if (path==="/products") { type="page"; row=(data.pages||[]).find(x=>x.slug==="products")||null; }
    const nested=row?.seo&&typeof row.seo==="object"?row.seo:{};
    const target=row? (data.seo||[]).find(x=>x.entity_type===type&&Number(x.entity_id)===Number(row.id)):null;
    const site=(data.seo||[]).find(x=>x.entity_type==="site"&&!x.entity_id);
    const title=target?.title||nested.meta_title||nested.title||site?.title;
    const desc=target?.description||nested.meta_description||nested.description||site?.description;
    const canonical=target?.canonical||nested.canonical;
    const robots=target?.robots||nested.robots||site?.robots;
    const og=target?.og_image||nested.og_image||row?.featured_image_url||row?.image;
    if(title)document.title=title;
    if(desc)setMeta('meta[name="description"]',"content",desc);
    if(title)setMeta('meta[property="og:title"]',"content",title);
    if(desc)setMeta('meta[property="og:description"]',"content",desc);
    if(og)setMeta('meta[property="og:image"]',"content",og);
    if(robots)setMeta('meta[name="robots"]',"content",robots);
    if(canonical){let link=document.querySelector('link[rel="canonical"]');if(!link){link=document.createElement("link");link.rel="canonical";document.head.appendChild(link)}link.href=canonical;}
  }
  function catalogPlainText(value) {
    const template = document.createElement("template");
    template.innerHTML = String(value || "");
    return (template.content.textContent || "").replace(/\\s+/g, " ").trim();
  }
  function renderCatalogHero(data) {
    const title = document.getElementById("catalogTitle");
    const intro = document.getElementById("catalogIntro");
    if (!title || !intro) return;

    const categorySlug = new URLSearchParams(location.search).get("category");
    const bottom = document.getElementById("categoryDescriptionBottom");
    const bottomTitle = document.getElementById("categoryDescriptionTitle");
    const bottomText = document.getElementById("categoryDescriptionText");

    // The All Products record is editable in CMS. The template used to ignore
    // its title/content and always show the hard-coded catalogue introduction.
    if (!categorySlug) {
      if (bottom) bottom.hidden = true;
      const cataloguePage = (data.pages || []).find(page =>
        String(page.slug || "").toLowerCase() === "products" &&
        String(page.status || "published").toLowerCase() === "published"
      );
      if (cataloguePage) {
        const pageTitle = String(cataloguePage.title || "").trim();
        if (pageTitle) title.textContent = pageTitle;
        const sections = Array.isArray(cataloguePage.sections) ? cataloguePage.sections : [];
        const introSection = sections.find(section => section && section.key === "cms-page-content");
        const pageIntro = catalogPlainText(introSection && introSection.content);
        if (pageIntro) intro.textContent = pageIntro;
      }
      return;
    }

    // Category title and description are driven directly by the active CMS
    // category record, not a hard-coded list in products.html.
    const category = (data.categories || []).find(c => String(c.slug) === categorySlug);
    if (!category) {
      if (bottom) bottom.hidden = true;
      return;
    }

    const name = String(category.name || "Shop by Category").trim();
    const description = catalogPlainText(category.description);
    const fallbackDescription = "Explore " + name + " products at Talha Bilal Store. Cash on Delivery available across Pakistan.";
    const fullDescription = description || fallbackDescription;
    const firstSentence = (fullDescription.match(/^.{1,140}?[.!?](?:\\s|$)/) || [""])[0].trim();
    let shortDescription = firstSentence;
    if (!shortDescription) {
      shortDescription = fullDescription.length > 140
        ? fullDescription.slice(0, 137).replace(/\\s+\\S*$/, "") + "…"
        : fullDescription;
    }

    title.textContent = name;
    intro.textContent = shortDescription;

    if (bottom && bottomTitle && bottomText) {
      let remainingDescription = "";
      if (description && shortDescription) {
        const displayedLength = shortDescription.endsWith("…")
          ? shortDescription.length - 1
          : shortDescription.length;
        remainingDescription = description.slice(displayedLength)
          .replace(/^[\\s.!?;:—-]+/, "")
          .trim();
      }
      if (remainingDescription) {
        bottomTitle.textContent = "About " + name;
        bottomText.textContent = remainingDescription;
        bottom.hidden = false;
      } else {
        bottom.hidden = true;
        bottomTitle.textContent = "";
        bottomText.textContent = "";
      }
    }
  }
  async function load() {
    try {
      const res = await fetch(ENDPOINT, {headers:{Accept:"application/json"},cache:"default"});
      if (!res.ok) throw new Error("CMS public request failed");
      const data = await res.json(); if (!data || !data.ok) throw new Error("Invalid CMS response");
      for (const key of ["products","categories","pages","banners","blog_posts","seo"]) if (!Array.isArray(data[key])) data[key]=[];
      window.CMS_SITE_DATA = data;
      window.CMS_SITE_STATUS = "ready";
      if (Array.isArray(window.PRODUCTS)) {
        const list=window.PRODUCTS, hidden=new Set(data.hidden_static_product_ids||[]);
        for(let i=list.length-1;i>=0;i--)if(hidden.has(list[i].id))list.splice(i,1);
        for(const row of data.products){const p=mapProduct(row,data.categories),idx=list.findIndex(x=>x.id===p.id);if(idx>=0)list[idx]=p;else list.push(p);}
        data.siteProducts=list;
      }
      renderCatalogHero(data); renderFilters(data); renderBanners(data); renderBlogListing(data); applySeo(data);
      document.dispatchEvent(new CustomEvent("cms-site-data-ready",{detail:data}));
      return data;
    } catch (error) {
      window.CMS_SITE_STATUS = "error";
      window.CMS_SITE_DATA = window.CMS_SITE_DATA || null;
      document.dispatchEvent(new CustomEvent("cms-site-data-error", {detail:{error:String(error)}}));
      return {ok:false,error:String(error)};
    }
  }
  window.CMS_SITE_STATUS = "loading";
  window.CMS_SITE_READY = load();
  // app.js may finish loading before or after this catalogue request. Explicitly
  // refresh it once the CMS promise resolves so newly published items appear in
  // the All Products/category listing even if the initial DOM event was missed.
  window.CMS_SITE_READY.then(data => {
    if (data && data.ok && typeof window.refreshFromCms === "function") {
      window.refreshFromCms();
    } else if (data && !data.ok) {
      console.warn("Website CMS sync did not complete; using the existing static catalogue.", data.error || "");
    }
  }).catch(error => console.warn("Website CMS sync failed; using the existing static catalogue.", error));
})();