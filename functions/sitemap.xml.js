const SITE='https://www.talhabilalstore.com';
const PAGES=[
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
  '/how-to-order'
];
function xmlEscape(value){return String(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;')}
export async function onRequestGet(){
  const body=`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${PAGES.map(path=>`  <url><loc>${xmlEscape(SITE+path)}</loc></url>`).join('\n')}\n</urlset>`;
  return new Response(body,{headers:{'Content-Type':'application/xml; charset=UTF-8','Cache-Control':'public, max-age=3600'}});
}
