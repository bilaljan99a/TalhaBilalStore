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
    const images = Array.isArray(row.images) ? row.images : [];
    const image = firstImage(images);
    const price = row.sale_price != null ? Number(row.sale_price) : Number(row.price || 0);
    const was = row.sale_price != null ? Number(row.price || 0) : Number(row.old_price || 0);
    return {
      id:String(row.slug), cmsRecordId:Number(row.id), isCmsProduct:true,
      isMangoPremix:cat?.slug === "mango-pulp-premix" || /^mango-/.test(String(row.slug)),
      name:String(row.name || "Product"), description:String(row.description || row.short_description || ""),
      shortDescription:String(row.short_description || row.description || ""),
      price, oldPrice:was > price ? was : undefined,
      weight:Number(row.weight_kg) > 0 ? Number(row.weight_kg) : 1,
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
      ".cms-home-banner{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(220px,.8fr);gap:22px;align-items:center;overflow:hidden;border:1px solid #e8e8e8;border-radius:18px;background:#fff;color:#151515;text-decoration:none;padding:18px 22px}",
      ".cms-home-banner-copy h2{margin:0 0 8px;font-size:clamp(20px,3vw,32px);line-height:1.2}",
      ".cms-home-banner-copy p{margin:0 0 12px;line-height:1.55;color:#555}",
      ".cms-home-banner-copy .cms-banner-cta{display:inline-block;background:#ff6a00;color:#fff;padding:10px 15px;border-radius:8px;font-weight:750}",
      ".cms-home-banner img{display:block;width:100%;max-height:220px;object-fit:contain;border-radius:10px}",
      ".cms-blog-card-image{width:100%;height:100%;min-height:270px;object-fit:cover}",
      "@media(max-width:700px){.cms-home-banner{grid-template-columns:1fr;padding:15px;gap:12px}.cms-home-banner img{max-height:210px;grid-row:1}.cms-blog-card-image{height:240px;min-height:0}}"
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
  function renderBanners(data) {
    const slot = document.getElementById("cmsHomepageBanners"); if (!slot) return;
    const banners = (data.banners || []).filter(b => ["homepage","sitewide"].includes(String(b.placement || "").toLowerCase()));
    if (!banners.length) { slot.hidden = true; slot.innerHTML = ""; return; }
    injectStyles(); slot.hidden = false;
    slot.innerHTML = banners.map(b => {
      const dest = /^javascript:/i.test(b.button_url || "") ? "/products" : (b.button_url || "/products");
      const image = b.mobile_image_url || b.image_url;
      const external = /^https?:\/\//i.test(dest) ? ' target="_blank" rel="noopener"' : "";
      return '<a class="cms-home-banner" href="'+esc(dest)+'"'+external+'>'+
        '<span class="cms-home-banner-copy"><h2>'+esc(b.title || "")+'</h2><p>'+esc(b.subtitle || "")+'</p>'+
        (b.button_text?'<span class="cms-banner-cta">'+esc(b.button_text)+'</span>':"")+'</span>'+
        (image?'<img src="'+esc(image)+'" alt="'+esc(b.title || "Store promotion")+'" loading="lazy">':"")+'</a>';
    }).join("");
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
  async function load() {
    try {
      const res = await fetch(ENDPOINT, {headers:{Accept:"application/json"},cache:"no-store"});
      if (!res.ok) throw new Error("CMS public request failed");
      const data = await res.json(); if (!data || !data.ok) throw new Error("Invalid CMS response");
      for (const key of ["products","categories","pages","banners","blog_posts","seo"]) if (!Array.isArray(data[key])) data[key]=[];
      window.CMS_SITE_DATA = data;
      if (Array.isArray(window.PRODUCTS)) {
        const list=window.PRODUCTS, hidden=new Set(data.hidden_static_product_ids||[]);
        for(let i=list.length-1;i>=0;i--)if(hidden.has(list[i].id))list.splice(i,1);
        for(const row of data.products){const p=mapProduct(row,data.categories),idx=list.findIndex(x=>x.id===p.id);if(idx>=0)list[idx]=p;else list.push(p);}
        data.siteProducts=list;
      }
      renderFilters(data); renderBanners(data); renderBlogListing(data); applySeo(data);
      document.dispatchEvent(new CustomEvent("cms-site-data-ready",{detail:data}));
      return data;
    } catch (error) {
      window.CMS_SITE_DATA = window.CMS_SITE_DATA || null;
      return {ok:false,error:String(error)};
    }
  }
  window.CMS_SITE_READY = load();
})();