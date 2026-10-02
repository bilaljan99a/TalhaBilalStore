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
  '/blog.html'
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

  if(!value.startsWith('/blog/') || !value.endsWith('.html')) return null;

  value=value.split('#')[0].split('?')[0];
  return value;
}

async function getBlogPages(){
  try{
    const response=await fetch(SITE+'/blog.html',{
      headers:{'Accept':'text/html'},
      cf:{cacheTtl:300,cacheEverything:true}
    });

    if(!response.ok) return [];

    const html=await response.text();
    const pages=new Set();
    const hrefPattern=/href\\s*=\\s*["']([^"']+)["']/gi;
    let match;

    while((match=hrefPattern.exec(html))!==null){
      const path=normalizeBlogPath(match[1]);
      if(path) pages.add(path);
    }

    return [...pages];
  }catch{
    return [];
  }
}

export async function onRequestGet(){
  const blogPages=await getBlogPages();
  const pages=[...new Set([...STATIC_PAGES,...blogPages])];

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
