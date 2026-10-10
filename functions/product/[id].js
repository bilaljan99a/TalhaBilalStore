const PRODUCTS={
  'mango-1kg':{name:'Mango Pulp Drink Premix 1kg',description:'Refreshing mango drink premix for easy homemade mango juice — makes approximately 9.8–10 liters.',price:450,image:'assets/products/1kg-mango-pulp.webp',weight:1},
  'mango-2kg':{name:'Mango Pulp Drink Premix 2kg',description:'Refreshing mango drink premix for easy homemade mango juice — makes approximately 19.6–20 liters.',price:795,image:'assets/products/2kg-mango-pulp.jpg',weight:2},
  'mango-3kg':{name:'Mango Pulp Drink Premix 3kg',description:'Liquid mango pulp mix for larger family use — makes approximately 29.4–30 liters.',price:1214,image:'assets/products/3kg-mango-pulp.webp',weight:3},
  'mango-4kg':{name:'Mango Pulp Drink Premix 4kg',description:'Family-size mango drink premix — makes approximately 39.2–40 liters.',price:1650,image:'assets/products/4kg-mango-pulp.webp',weight:4},
  'mango-5kg':{name:'Mango Pulp Drink Premix 5kg',description:'1kg × 5 pack for larger gatherings — makes approximately 49–50 liters.',price:2130,image:'assets/products/5kg-mango-pulp.jpg',weight:5},
  'mango-10kg':{name:'Mango Pulp Drink Premix 10kg',description:'Large 10kg pack for events, families and bulk use — makes approximately 98–100 liters.',price:4130,image:'assets/products/10kg-mango-pulp.webp',weight:10}
};
const CMS_PUBLIC_URL='https://dxdjqeqlmyawqrzphzdb.supabase.co/functions/v1/cms-public';
function attr(value){return String(value??'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}
function seoForProduct(p,id){
  const site='https://www.talhabilalstore.com',cleanUrl=(p.seo?.canonical)||site+'/product/'+encodeURIComponent(id);
  const image=new URL(p.image||'/assets/products/mango-pulp-product-image.webp',site).href;
  const isMango=!!p.isMangoPremix||/^mango-/.test(id);
  const yieldInfo=isMango?((String(p.description||'').match(/makes\s+(?:approximately\s+)?([^\.]+?)(?:\.|$)/i)||[])[1]||String(Number(p.weight||1)*9.8)+' liters'):'';
  const defaultTitle=isMango?p.name+' – Rs. '+Number(p.price).toLocaleString('en-PK')+' | Makes '+yieldInfo+' | Talha Bilal Store':p.name+' – Rs. '+Number(p.price).toLocaleString('en-PK')+' | Talha Bilal Store';
  const title=(p.seo?.meta_title||p.seo?.title)||p.siteSeo?.title||defaultTitle;
  const defaultDesc=isMango?p.name+' for Rs. '+Number(p.price).toLocaleString('en-PK')+'. This '+p.weight+'kg Mango Pulp Drink Premix makes '+yieldInfo+'. Cash on Delivery across Pakistan.':p.name+'. '+(p.description||'')+' Cash on Delivery available across Pakistan.';
  const description=(p.seo?.meta_description||p.seo?.description)||p.siteSeo?.description||defaultDesc;
  let schema=p.seo?.schema_json;
  if(typeof schema==='string'){try{schema=JSON.parse(schema)}catch{schema=null}}
  if(!schema||typeof schema!=='object'||!Object.keys(schema).length)schema={'@context':'https://schema.org','@type':'Product','name':p.name,'description':p.description||'','image':[image],'sku':p.sku||id,'brand':{'@type':'Brand','name':'Talha Bilal Store'},'offers':{'@type':'Offer','url':cleanUrl,'priceCurrency':'PKR','price':Number(p.price),'availability':'https://schema.org/InStock','itemCondition':'https://schema.org/NewCondition'}};

  return {title,description,image,cleanUrl,schema};
}
async function getPublishedCmsProduct(id){
  try{
    const response=await fetch(CMS_PUBLIC_URL,{headers:{Accept:'application/json'},cf:{cacheTtl:0}});
    if(!response.ok)return null;
    const data=await response.json();
    if(!data?.ok||!Array.isArray(data.products))return null;
    if((data.hidden_static_product_ids||[]).includes(id))return {disabled:true};
    const row=data.products.find(x=>String(x.slug)===id&&x.status==='active');
    if(!row)return null;
    const categories=Array.isArray(data.categories)?data.categories:[],cat=categories.find(x=>Number(x.id)===Number(row.category_id));
    const images=Array.isArray(row.images)?row.images:[];let image=images[0];
    if(image&&typeof image==='object')image=image.url||image.src||'';
    if(!image)image='/assets/products/mango-pulp-product-image.webp';
    const isMango=cat?.slug==='mango-pulp-premix'||/^mango-/.test(String(row.slug));
    const price=row.sale_price!=null?Number(row.sale_price):Number(row.price||0);
    const seoRow=(data.seo||[]).find(x=>x.entity_type==='product'&&Number(x.entity_id)===Number(row.id))||{};
    const siteSeo=(data.seo||[]).find(x=>x.entity_type==='site'&&(x.entity_id==null||x.entity_id===''))||{};
    return {name:row.name,description:row.description||row.short_description||'',price,oldPrice:row.sale_price!=null?Number(row.price||0):Number(row.old_price||0),image,images,weight:Number(row.weight_kg)||1,sku:row.sku,seo:Object.assign({},row.seo||{},seoRow),siteSeo,isCmsProduct:true,isMangoPremix:isMango};
  }catch{return null}
}
export async function onRequestGet(context){
  const id=String(context.params.id||'').toLowerCase();
  const legacy=PRODUCTS[id];
  const cms=await getPublishedCmsProduct(id);
  if(cms?.disabled)return new Response('Not Found',{status:404,headers:{'Content-Type':'text/plain; charset=UTF-8'}});
  let p=legacy&&cms?{...legacy,...cms}:legacy||cms;
  if(!p)return new Response('Not Found',{status:404,headers:{'Content-Type':'text/plain; charset=UTF-8'}});
  const robots=p.seo?.robots||p.siteSeo?.robots||'index,follow';
  const schemaJson=JSON.stringify(seoForProduct(p,id).schema).replace(/</g,'\\u003c');
  const response=await context.env.ASSETS.fetch(new URL('/product.html',context.request.url));
  const seo=seoForProduct(p,id);
  const headMeta='<meta property="og:title" content="'+attr(seo.title)+'"><meta property="og:description" content="'+attr(seo.description)+'"><meta name="robots" content="'+attr(robots)+'"><meta property="og:type" content="product"><meta property="og:image" content="'+attr(seo.image)+'"><meta property="og:url" content="'+attr(seo.cleanUrl)+'"><link rel="canonical" href="'+attr(seo.cleanUrl)+'"><script type="application/ld+json" data-product-schema>'+schemaJson+'</script>';
  return new HTMLRewriter()
    .on('title',{element(el){el.setInnerContent(seo.title)}})
    .on('meta[name="description"]',{element(el){el.setAttribute('content',seo.description)}})
    .on('head',{element(el){el.append(headMeta,{html:true})}})
    .on('script[data-product-schema]',{element(el){el.setInnerContent(schemaJson)}})
    .transform(response);
}