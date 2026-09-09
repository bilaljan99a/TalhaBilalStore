const SITE = 'https://www.talhabilalstore.com';
const REPO = 'bilaljan99a/TalhaBilalStore';
const BRANCH = 'feature/free-cod-store';
const EXCLUDED = new Set(['admin.html','login.html','account.html','thank-you.html']);

function xmlEscape(value) {
  return String(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
}

export async function onRequestGet(context) {
  try {
    const treeUrl = `https://api.github.com/repos/${REPO}/git/trees/${encodeURIComponent(BRANCH)}?recursive=1`;
    const response = await fetch(treeUrl, {headers:{'Accept':'application/vnd.github+json','User-Agent':'TalhaBilalStore-sitemap'}});
    if (!response.ok) throw new Error(`GitHub tree request failed: ${response.status}`);
    const tree = await response.json();
    const urls = new Set([`${SITE}/`]);
    for (const item of tree.tree || []) {
      if (item.type !== 'blob' || !item.path.endsWith('.html') || item.path.includes('/') || EXCLUDED.has(item.path)) continue;
      if (item.path === 'index.html') urls.add(`${SITE}/`);
      else urls.add(`${SITE}/${item.path}`);
    }

    const productsResponse = await fetch(`https://raw.githubusercontent.com/${REPO}/${BRANCH}/products.js`, {headers:{'User-Agent':'TalhaBilalStore-sitemap'}});
    if (productsResponse.ok) {
      const productsJs = await productsResponse.text();
      const ids = [...productsJs.matchAll(/id:\s*['"]([^'"]+)['"]/g)].map(m => m[1]);
      ids.forEach(id => urls.add(`${SITE}/product.html?id=${encodeURIComponent(id)}`));
    }

    const lastmod = new Date().toISOString().slice(0,10);
    const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...urls].sort().map(url => `  <url><loc>${xmlEscape(url)}</loc><lastmod>${lastmod}</lastmod></url>`).join('\n')}\n</urlset>`;
    return new Response(body, {headers:{'Content-Type':'application/xml; charset=UTF-8','Cache-Control':'public, max-age=3600'}});
  } catch (error) {
    const fallback = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${SITE}/</loc></url><url><loc>${SITE}/products.html</loc></url><url><loc>${SITE}/reviews.html</loc></url></urlset>`;
    return new Response(fallback, {status:200, headers:{'Content-Type':'application/xml; charset=UTF-8','Cache-Control':'public, max-age=300'}});
  }
}
