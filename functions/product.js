const PRODUCT_IDS=new Set(['mango-1kg','mango-2kg','mango-3kg','mango-4kg','mango-5kg','mango-10kg']);

export function onRequestGet({request}){
  const url=new URL(request.url);
  const id=url.searchParams.get('id');
  const target=PRODUCT_IDS.has(id)?`/product/${encodeURIComponent(id)}`:'/products';
  return Response.redirect(new URL(target,url.origin).toString(),301);
}
