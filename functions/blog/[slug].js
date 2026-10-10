const CMS_PUBLIC_URL='https://dxdjqeqlmyawqrzphzdb.supabase.co/functions/v1/cms-public';
const TEMPLATE_PATH='/blog/how-to-make-mango-drink-from-mango-pulp-premix.html';

function htmlEscape(value){
  return String(value??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
function safeArticleHtml(value,title,excerpt,heroImage){
  const raw=String(value||'').trim();
  if(!raw){
    return '<a class="back-link" href="/blog.html">← Back to Blog</a><header class="article-header"><h1>'+htmlEscape(title)+'</h1><p>'+htmlEscape(excerpt||'')+'</p></header><div class="article-body"></div>';
  }
  let content=raw;
  const looksLikeHtml=/<(?:h[1-6]|p|div|img|ul|ol|li|section|header|figure|table|blockquote|a|hr|br|strong|em)\b/i.test(raw);
  if(!looksLikeHtml){
    let blocks=raw.split(/\n\s*\n+/).map(x=>x.trim()).filter(Boolean);
    if(blocks.length){const first=blocks[0].replace(/\s+/g,' ').trim().toLowerCase(),heading=String(title||'').replace(/\s+/g,' ').trim().toLowerCase();if(first===heading||first.startsWith(heading+':'))blocks.shift();}
    const body=blocks.map(x=>'<p>'+htmlEscape(x).replace(/\n/g,'<br>')+'</p>').join('');
    content='<a class="back-link" href="/blog.html">← Back to Blog</a><header class="article-header"><div class="article-meta">Talha Bilal Store • Article</div><h1>'+htmlEscape(title)+'</h1><p>'+htmlEscape(excerpt||'')+'</p></header>'+(heroImage?'<img class="article-hero" src="'+htmlEscape(heroImage)+'" alt="'+htmlEscape(title)+'" loading="eager">':'')+'<div class="article-body">'+body+'</div>';
  }
  return content
    .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi,'')
    .replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe\s*>/gi,'')
    .replace(/<(?:object|embed|form)\b[^>]*>[\s\S]*?<\/(?:object|embed|form)\s*>/gi,'')
    .replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi,'')
    .replace(/(href|src)\s*=\s*(['"])\s*javascript:[\s\S]*?\2/gi,'$1="#"');
}
function blogSchema(post,url,image){
  return {
    '@context':'https://schema.org',
    '@type':'BlogPosting',
    headline:post.title,
    description:post.excerpt||'',
    image:image?[image]:undefined,
    datePublished:post.published_at||undefined,
    author:{'@type':'Organization','name':post.author_name||'Talha Bilal Store'},
    mainEntityOfPage:{'@type':'WebPage','@id':url},
    url
  };
}
async function fetchCmsPost(slug){
  const response=await fetch(CMS_PUBLIC_URL,{headers:{Accept:'application/json'},cf:{cacheTtl:0}});
  if(!response.ok)return null;
  const data=await response.json();
  if(!data?.ok||!Array.isArray(data.blog_posts))return null;
  const post=data.blog_posts.find(item=>item.slug===slug)||null;
  if(!post)return null;
  const seoRow=(data.seo||[]).find(item=>item.entity_type==='blog'&&Number(item.entity_id)===Number(post.id))||{};
  const siteSeo=(data.seo||[]).find(item=>item.entity_type==='site'&&(item.entity_id==null||item.entity_id===''))||{};
  return {...post,seo:{...(post.seo||{}),...seoRow},siteSeo};
}
export async function onRequestGet(context){
  const requestUrl=new URL(context.request.url);
  const slug=String(context.params.slug||'').replace(/\.html$/i,'').toLowerCase();
  if(!slug||slug.includes('/')||slug.includes('..'))return new Response('Not Found',{status:404});

  let post=null;
  try{post=await fetchCmsPost(slug)}catch{}

  if(!post){
    const fallback=await context.env.ASSETS.fetch(new URL('/blog/'+encodeURIComponent(slug)+'.html',requestUrl));
    if(fallback.ok)return fallback;
    return new Response('Article not found or not published.',{status:404,headers:{'Content-Type':'text/plain; charset=UTF-8','Cache-Control':'no-store'}});
  }

  const template=await context.env.ASSETS.fetch(new URL(TEMPLATE_PATH,requestUrl));
  if(!template.ok)return new Response('Blog template unavailable.',{status:500});
  const canonical=(post.seo&&post.seo.canonical)||post.url||('https://www.talhabilalstore.com/blog/'+post.slug+'.html');
  const metaTitle=(post.seo&&(post.seo.meta_title||post.seo.title))||post.title;
  const metaDescription=(post.seo&&(post.seo.meta_description||post.seo.description))||post.excerpt||post.siteSeo?.description||'Helpful guides and tips from Talha Bilal Store.';
  const image=post.featured_image_url||'https://www.talhabilalstore.com/assets/here-banner.webp';
  const content=safeArticleHtml(post.content,post.title,post.excerpt,image);
  let schemaValue=post.seo?.schema_json;
  if(typeof schemaValue==='string'){try{schemaValue=JSON.parse(schemaValue)}catch{schemaValue=null}}
  if(!schemaValue||typeof schemaValue!=='object'||!Object.keys(schemaValue).length)schemaValue=blogSchema(post,canonical,image);
  const schema=JSON.stringify(schemaValue).replace(/</g,'\\u003c');
  const robots=post.seo?.robots||post.siteSeo?.robots||'index,follow';

  return new HTMLRewriter()
    .on('title',{element(el){el.setInnerContent(metaTitle)}})
    .on('meta[name="description"]',{element(el){el.setAttribute('content',metaDescription)}})
    .on('meta[property="og:title"]',{element(el){el.setAttribute('content',metaTitle)}})
    .on('meta[property="og:description"]',{element(el){el.setAttribute('content',metaDescription)}})
    .on('meta[property="og:image"]',{element(el){el.setAttribute('content',image)}})
    .on('meta[property="og:url"]',{element(el){el.setAttribute('content',canonical)}})
    .on('link[rel="canonical"]',{element(el){el.setAttribute('href',canonical)}})
    .on('script[type="application/ld+json"]',{element(el){el.setInnerContent(schema)}})
    .on('article.article',{element(el){el.setInnerContent(content,{html:true})}})
    .transform(template);
}