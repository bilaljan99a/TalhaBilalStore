const PRODUCTS={
  'mango-1kg':{name:'Mango Pulp Drink Premix 1kg',description:'Refreshing mango drink premix for easy homemade mango juice — makes approximately 9.8–10 liters.',price:450,image:'assets/products/1kg-mango-pulp.webp',weight:1},
  'mango-2kg':{name:'Mango Pulp Drink Premix 2kg',description:'Refreshing mango drink premix for easy homemade mango juice — makes approximately 19.6–20 liters.',price:795,image:'assets/products/2kg-mango-pulp.jpg',weight:2},
  'mango-3kg':{name:'Mango Pulp Drink Premix 3kg',description:'Liquid mango pulp mix for larger family use — makes approximately 29.4–30 liters.',price:1214,image:'assets/products/3kg-mango-pulp.webp',weight:3},
  'mango-4kg':{name:'Mango Pulp Drink Premix 4kg',description:'Family-size mango drink premix — makes approximately 39.2–40 liters.',price:1650,image:'assets/products/4kg-mango-pulp.webp',weight:4},
  'mango-5kg':{name:'Mango Pulp Drink Premix 5kg',description:'1kg × 5 pack for larger gatherings — makes approximately 49–50 liters.',price:2130,image:'assets/products/5kg-mango-pulp.jpg',weight:5},
  'mango-10kg':{name:'Mango Pulp Drink Premix 10kg',description:'Large 10kg pack for events, families and bulk use — makes approximately 98–100 liters.',price:4130,image:'assets/products/10kg-mango-pulp.webp',weight:10}
};

function escapeHtml(value){return String(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;')}
function productSeo(p,id){const site='https://www.talhabilalstore.com';const cleanUrl=`${site}/product/${encodeURIComponent(id)}`;const image=new URL(p.image,site).href;const yieldText=(p.description.match(/makes\s+(?:approximately\s+)?([^\.]+?)(?:\.|$)/i)||[])[1]||`${Number(p.weight)*9.8} liters`;const title=`${p.name} – Rs. ${Number(p.price).toLocaleString('en-PK')} | Makes ${yieldText} | Talha Bilal Store`;const description=`${p.name} for Rs. ${Number(p.price).toLocaleString('en-PK')}. This ${p.weight}kg Mango Pulp Drink Premix makes ${yieldText}. Cash on Delivery available across Pakistan with product details and customer reviews.`;const schema={'@context':'https://schema.org','@type':'Product','name':p.name,'description':p.description,'image':[image,new URL('assets/products/mango-pulp-product-image.webp',site).href],'sku':id,'brand':{'@type':'Brand','name':'Talha Bilal Store'},'offers':{'@type':'Offer','url':cleanUrl,'priceCurrency':'PKR','price':Number(p.price),'availability':'https://schema.org/InStock','itemCondition':'https://schema.org/NewCondition'}};return{title,description,image,cleanUrl,schema}}

export async function onRequestGet(context){
  const id=String(context.params.id||'').toLowerCase();
  const p=PRODUCTS[id];
  if(!p)return new Response('Not Found',{status:404,headers:{'Content-Type':'text/plain; charset=UTF-8'}});
  const response=await context.env.ASSETS.fetch(new URL('/product.html',context.request.url));
  const seo=productSeo(p,id);
  return new HTMLRewriter()
    .on('title',{element(el){el.setInnerContent(seo.title)}})
    .on('meta[name="description"]',{element(el){el.setAttribute('content',seo.description)}})
    .on('meta[property="og:title"]',{element(el){el.setAttribute('content',seo.title)}})
    .on('meta[property="og:description"]',{element(el){el.setAttribute('content',seo.description)}})
    .on('meta[property="og:type"]',{element(el){el.setAttribute('content','product')}})
    .on('meta[property="og:image"]',{element(el){el.setAttribute('content',seo.image)}})
    .on('meta[property="og:url"]',{element(el){el.setAttribute('content',seo.cleanUrl)}})
    .on('link[rel="canonical"]',{element(el){el.setAttribute('href',seo.cleanUrl)}})
    .on('head',{element(el){el.append(`<script type="application/ld+json" data-product-schema>${escapeHtml(JSON.stringify(seo.schema))}</script>`,{html:true})}})
    .transform(response);
}
