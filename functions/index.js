const CMS_PUBLIC_URL='https://dxdjqeqlmyawqrzphzdb.supabase.co/functions/v1/cms-public';
function esc(v){return String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;')}
function structuredData(rows){
 for(const row of (Array.isArray(rows)?rows:[])){
  let value=row?.schema_json;
  if(typeof value==='string'){try{value=JSON.parse(value)}catch{value=null}}
  if(value&&typeof value==='object'&&Object.keys(value).length)return JSON.stringify(value).replace(/</g,'\\u003c');
 }
 return '';
}
export async function onRequestGet(context){
 const requestUrl=new URL(context.request.url);
 const asset=await context.env.ASSETS.fetch(new URL('/',requestUrl));
 let data;
 try{
  const res=await fetch(CMS_PUBLIC_URL,{headers:{Accept:'application/json'},cf:{cacheTtl:30,cacheEverything:true}});
  if(!res.ok)return asset;
  data=await res.json();
  if(!data?.ok)return asset;
 }catch{return asset}
 const pages=Array.isArray(data.pages)?data.pages:[];
 const home=pages.find(p=>['home','homepage'].includes(p.slug))||null;
 const pageSeo=home?(data.seo||[]).find(x=>x.entity_type==='page'&&Number(x.entity_id)===Number(home.id)):null;
 const siteSeo=(data.seo||[]).find(x=>x.entity_type==='site'&&(x.entity_id==null||x.entity_id===''))||null;
 const nested=home?.seo&&typeof home.seo==='object'?home.seo:{};
 const title=pageSeo?.title||siteSeo?.title||nested.meta_title||nested.title||'';
 const description=pageSeo?.description||siteSeo?.description||nested.meta_description||nested.description||'';
 const canonical=pageSeo?.canonical||nested.canonical||siteSeo?.canonical||'https://www.talhabilalstore.com/';
 const robots=pageSeo?.robots||siteSeo?.robots||nested.robots||'';
 const og=pageSeo?.og_image||siteSeo?.og_image||nested.og_image||'';
 const schema=structuredData([pageSeo,siteSeo]);
 const headAppend=(canonical?'<link rel="canonical" href="'+esc(canonical)+'">':'')+
  (robots?'<meta name="robots" content="'+esc(robots)+'">':'')+
  (schema?'<script type="application/ld+json">'+schema+'</script>':'');
 return new HTMLRewriter()
  .on('title',{element(el){if(title)el.setInnerContent(title)}})
  .on('meta[name="description"]',{element(el){if(description)el.setAttribute('content',description)}})
  .on('meta[property="og:title"]',{element(el){if(title)el.setAttribute('content',title)}})
  .on('meta[property="og:description"]',{element(el){if(description)el.setAttribute('content',description)}})
  .on('meta[property="og:image"]',{element(el){if(og)el.setAttribute('content',og)}})
  .on('head',{element(el){if(headAppend)el.append(headAppend,{html:true})}})
  .transform(asset);
}