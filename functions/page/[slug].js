const CMS_PUBLIC_URL='https://dxdjqeqlmyawqrzphzdb.supabase.co/functions/v1/cms-public';
const TEMPLATE_PATH='/index.html';
function esc(v){return String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;')}
function slugOk(v){return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(String(v||''))}
function cleanCmsHtml(input){
 const raw=String(input||'').trim();if(!raw)return '';
 const looksHtml=/<(?:h[1-6]|p|div|img|ul|ol|li|section|header|figure|table|blockquote|a|hr|br|strong|em)\b/i.test(raw);
 let html=raw;
 if(!looksHtml)html=raw.split(/\n\s*\n+/).map(x=>x.trim()).filter(Boolean).map(x=>'<p>'+esc(x).replace(/\n/g,'<br>')+'</p>').join('');
 return html.replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi,'')
  .replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe\s*>/gi,'')
  .replace(/<(?:object|embed|form)\b[^>]*>[\s\S]*?<\/(?:object|embed|form)\s*>/gi,'')
  .replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi,'')
  .replace(/(href|src)\s*=\s*(['"])\s*javascript:[\s\S]*?\2/gi,'$1="#"');
}
export async function onRequestGet(context){
 const slug=String(context.params.slug||'').toLowerCase();
 if(!slugOk(slug))return new Response('Not Found',{status:404});
 let data;
 try{
  const res=await fetch(CMS_PUBLIC_URL,{headers:{Accept:'application/json'},cf:{cacheTtl:0}});
  if(!res.ok)throw new Error('CMS unavailable');
  data=await res.json();
 }catch{return new Response('Website content is temporarily unavailable.',{status:503,headers:{'Content-Type':'text/plain; charset=UTF-8','Cache-Control':'no-store'}})}
 const page=(Array.isArray(data.pages)?data.pages:[]).find(p=>p.slug===slug&&p.status==='published'&&!['home','homepage','products'].includes(p.slug));
 if(!page)return new Response('Page not found or not published.',{status:404,headers:{'Content-Type':'text/plain; charset=UTF-8'}});
 const template=await context.env.ASSETS.fetch(new URL(TEMPLATE_PATH,context.request.url));
 if(!template.ok)return new Response('Website template unavailable.',{status:500});
 const sections=Array.isArray(page.sections)?page.sections:[];
 const contentSection=sections.find(s=>s&&s.key==='cms-page-content');
 const content=cleanCmsHtml(contentSection?.content||'');
 const title=String(page.seo?.meta_title||page.seo?.title||page.title||'Talha Bilal Store');
 const description=String(page.seo?.meta_description||page.seo?.description||page.title||'');
 const canonical=String(page.seo?.canonical||('https://www.talhabilalstore.com/page/'+encodeURIComponent(slug)));
 const robots=String(page.seo?.robots||'index,follow');
 const mainHtml='<main class="cms-managed-page"><section class="catalog-hero"><div class="container"><span class="eyebrow">TALHA BILAL STORE</span><h1>'+esc(page.title)+'</h1></div></section>'+
  (content?'<section class="container cms-page-content"><article class="article-body">'+content+'</article></section>':'')+
  '<section class="home-products products-section"><div class="container"><div class="section-heading"><div><span class="eyebrow">SHOP COLLECTION</span><h2>Products on this page</h2></div><p>Cash on Delivery across Pakistan</p></div><div class="product-grid" id="homeProductGrid"></div></div></section></main>';
 const schema=JSON.stringify({'@context':'https://schema.org','@type':'WebPage','name':title,'description':description,'url':canonical,'isPartOf':{'@type':'WebSite','name':'Talha Bilal Store','url':'https://www.talhabilalstore.com/'}}).replace(/</g,'\\u003c');
 return new HTMLRewriter()
  .on('title',{element(el){el.setInnerContent(title)}})
  .on('meta[name="description"]',{element(el){el.setAttribute('content',description)}})
  .on('meta[property="og:title"]',{element(el){el.setAttribute('content',title)}})
  .on('meta[property="og:description"]',{element(el){el.setAttribute('content',description)}})
  .on('meta[property="og:url"]',{element(el){el.setAttribute('content',canonical)}})
  .on('meta[property="og:image"]',{element(el){if(page.seo?.og_image)el.setAttribute('content',page.seo.og_image)}})
  .on('meta[name="robots"]',{element(el){el.setAttribute('content',robots)}})
  .on('link[rel="canonical"]',{element(el){el.setAttribute('href',canonical)}})
  .on('head',{element(el){el.append('<script type="application/ld+json">'+schema+'</script>',{html:true})}})
  .on('#cmsHomepageBanners',{element(el){el.remove()}})
  .on('main',{element(el){el.replace(mainHtml,{html:true})}})
  .transform(template);
}