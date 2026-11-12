// Catch-all for unknown paths (E2 soft 404): serve the static asset when it
// exists, otherwise return a real 404 page instead of the homepage shell.
// More-specific functions (/, /product/*, /blog/*, /page/*, /products,
// /sitemap.xml, /api/*) take precedence, so this only runs for paths no other
// route handles.
export async function onRequestGet(context){
  const requestUrl=new URL(context.request.url);
  const asset=await context.env.ASSETS.fetch(requestUrl);
  if(asset.ok)return asset;
  const body='<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Page Not Found | Talha Bilal Store</title><meta name="robots" content="noindex"><style>body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#fff;color:#222;text-align:center}main{max-width:480px;padding:24px}h1{font-size:28px;margin:0 0 12px}p{color:#555;line-height:1.6}a{display:inline-block;margin-top:16px;padding:12px 24px;background:#f59e0b;color:#fff;border-radius:8px;text-decoration:none;font-weight:600}</style></head><body><main><h1>Page Not Found</h1><p>Sorry, the page you are looking for does not exist or has been moved.</p><a href="/">Go to Homepage</a></main></body></html>';
  return new Response(body,{status:404,headers:{'Content-Type':'text/html; charset=UTF-8','Cache-Control':'no-store'}});
}
