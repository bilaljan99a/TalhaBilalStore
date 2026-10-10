const SITE='https://www.talhabilalstore.com';
const STATIC_PAGES=[
  '/',
  '/product/mango-1kg',
  '/product/mango-2kg',
  '/product/mango-3kg',
  '/product/mango-4kg',
  '/product/mango-5kg',
  '/product/mango-10kg',
  '/products',
  '/reviews',
  '/policies',
  '/track-order',
  '/why-us',
  '/how-to-order',
  '/contact.html',
  '/privacy.html',
  '/blog.html',
  '/blog/how-to-make-mango-drink-from-mango-pulp-premix.html',
  '/blog/where-to-buy-mango-pulp-in-pakistan.html',
  '/blog/pakistani-mango-varieties-guide.html'
];

function xmlEscape(value){
  return String(value)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&apos;');
}

function normalizeBlogPath(href){
  if(!href) return null;
  let value=href.trim();

  if(value.startsWith(SITE)){
    value=value.slice(SITE.length);
  }

  value=value.split('#')[0].split('?')[0];

  if(!value.startsWith('/blog/') || !value.endsWith('.html')) return null;

  return value;
}

async function getDynamicCmsPaths(){
  const paths=new Set();

  // Preserve blog links currently listed in the public blog landing page.
  try{
    const response=await fetch(SITE+'/blog.html',{
      headers:{'Accept':'text/html'},
      cf:{cacheTtl:60,cacheEverything:true}
    });
    if(response.ok){
      const html=await response.text();
      const hrefPattern=/href\s*=\s*["']([^"']+)["']/gi;
      let match;
      while((match=hrefPattern.exec(html))!==null){
        const path=normalizeBlogPath(match[1]);
        if(path)paths.add(path);
      }
    }
  }catch{}

  // Published CMS posts and custom pages are included automatically.
  try{
    const response=await fetch('https://dxdjqeqlmyawqrzphzdb.supabase.co/functions/v1/cms-public',{
      headers:{'Accept':'application/json'},
      cf:{cacheTtl:0}
    });
    if(response.ok){
      const data=await response.json();
      for(const post of (Array.isArray(data.blog_posts)?data.blog_posts:[])){
        const slug=String(post.slug||'');
        if(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))paths.add('/blog/'+slug+'.html');
      }
      for(const page of (Array.isArray(data.pages)?data.pages:[])){
        const slug=String(page.slug||'');
        if(!slugOkForSitemap(slug)||['home','homepage','products'].includes(slug))continue;
        paths.add('/page/'+slug);
      }
    }
  }catch{}
  return [...paths];
}
function slugOkForSitemap(slug){return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(String(slug||''))}
export async function onRequestGet(){
  const dynamicPages=await getDynamicCmsPaths();
  const pages=[...new Set([...STATIC_PAGES,...dynamicPages])];

  const body=`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(path=>`  <url><loc>${xmlEscape(SITE+path)}</loc></url>`).join('\n')}
</urlset>`;

  return new Response(body,{
    headers:{
      'Content-Type':'application/xml; charset=UTF-8',
      'Cache-Control':'public, max-age=300'
    }
  });
}
