// Category SEO for /products (W4): a ?category= view gets a unique server-rendered
// title, meta description, H1 and canonical instead of the generic /products ones.
// Without a valid category the asset is served unchanged.
const SITE='https://www.talhabilalstore.com';
const CATEGORIES={
  'home-gadget':{
    name:'Home Gadget',
    title:'Home Gadget | Talha Bilal Store',
    description:'Shop home gadgets at Talha Bilal Store — kitchen tools, LED lights, organizers and everyday essentials. Cash on Delivery across Pakistan.'
  },
  'grocery-beverages':{
    name:'Grocery & Beverages',
    title:'Grocery & Beverages | Talha Bilal Store',
    description:'Shop grocery and beverages at Talha Bilal Store — mango pulp drink premix and everyday essentials. Cash on Delivery across Pakistan.'
  },
  'beauty-personal-care':{
    name:'Beauty & Personal Care',
    title:'Beauty & Personal Care | Talha Bilal Store',
    description:'Shop beauty and personal care at Talha Bilal Store — skincare, hair tools and grooming essentials. Cash on Delivery across Pakistan.'
  },
  'baby-kids-care':{
    name:'Baby & Kids Care',
    title:'Baby & Kids Care | Talha Bilal Store',
    description:'Shop baby and kids care at Talha Bilal Store — feeding, safety, toys and learning essentials. Cash on Delivery across Pakistan.'
  }
};
// plural alias used by older links
CATEGORIES['home-gadgets']=CATEGORIES['home-gadget'];

function esc(v){return String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;')}

export async function onRequestGet(context){
  const requestUrl=new URL(context.request.url);
  const asset=await context.env.ASSETS.fetch(new URL('/products.html',requestUrl));
  if(!asset.ok)return asset;
  const params=requestUrl.searchParams;
  const raw=(params.get('category')||params.get('cat')||'').trim().toLowerCase().replace(/%20/g,' ').replace(/[&_ ]+/g,'-').replace(/-+/g,'-');
  const cat=CATEGORIES[raw];
  if(!cat)return asset;
  const slug=raw==='home-gadgets'?'home-gadget':raw;
  const canonical=SITE+'/products?category='+slug;
  return new HTMLRewriter()
    .on('title',{element(el){el.setInnerContent(cat.title)}})
    .on('meta[name="description"]',{element(el){el.setAttribute('content',cat.description)}})
    .on('link[rel="canonical"]',{element(el){el.setAttribute('href',canonical)}})
    .on('h1#catalogTitle',{element(el){el.setInnerContent(cat.name)}})
    .on('head',{element(el){el.append('<meta property="og:title" content="'+esc(cat.title)+'"><meta property="og:description" content="'+esc(cat.description)+'"><meta property="og:url" content="'+esc(canonical)+'">',{html:true})}})
    .transform(asset);
}
