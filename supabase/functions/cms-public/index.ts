import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Max-Age": "86400",
  "Vary": "Origin",
  "Content-Type": "application/json",
  "Cache-Control": "no-store"
};
const reply = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: cors });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { status: 200, headers: cors });
  if (req.method !== "GET") return reply({ error: "Method not allowed" }, 405);

  try {
    const url = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !serviceKey) return reply({ error: "Public catalogue is unavailable." }, 500);
    const db = createClient(url, serviceKey);

    const [productsQ, categoriesQ, pagesQ, bannersQ, blogsQ, seoQ, hiddenQ] = await Promise.all([
      db.from("cms_products")
        .select("id,name,slug,short_description,description,category_id,price,sale_price,old_price,weight_kg,tag,featured,best_seller,is_new,images,attributes,seo,status")
        .eq("status", "active")
        .order("created_at", { ascending: true }),
      db.from("cms_categories")
        .select("id,name,slug,description,image_url,parent_id,sort_order,is_active,seo")
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),
      db.from("cms_pages")
        .select("id,title,slug,sections,seo,status")
        .eq("status", "published"),
      db.from("cms_banners")
        .select("id,title,subtitle,image_url,mobile_image_url,button_text,button_url,placement,sort_order,starts_at,ends_at,is_active")
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),
      db.from("cms_blog_posts")
        .select("id,title,slug,excerpt,content,featured_image_url,status,published_at,author_name,tags,related_product_ids,seo")
        .eq("status", "published")
        .order("published_at", { ascending: false, nullsFirst: false }),
      db.from("cms_seo")
        .select("id,entity_type,entity_id,title,description,canonical,robots,og_image,schema_json"),
      db.from("cms_products")
        .select("slug")
        .in("slug", ["mango-1kg","mango-2kg","mango-3kg","mango-4kg","mango-5kg","mango-10kg"])
        .neq("status", "active")
    ]);

    const err = [productsQ,categoriesQ,pagesQ,bannersQ,blogsQ,seoQ,hiddenQ].find(x => x.error);
    if (err?.error) return reply({ error: "Could not load published website content." }, 500);

    const now = Date.now();
    const banners = (bannersQ.data || []).filter((b: any) => {
      const starts = b.starts_at ? Date.parse(b.starts_at) : NaN;
      const ends = b.ends_at ? Date.parse(b.ends_at) : NaN;
      return (!Number.isFinite(starts) || starts <= now) && (!Number.isFinite(ends) || ends >= now);
    });

    const blogs = (blogsQ.data || []).filter((p: any) => {
      const publishAt = p.published_at ? Date.parse(p.published_at) : NaN;
      return !Number.isFinite(publishAt) || publishAt <= now;
    }).map((p: any) => ({
      id: p.id, title: p.title, slug: p.slug, excerpt: p.excerpt,
      content: p.content, featured_image_url: p.featured_image_url,
      published_at: p.published_at, author_name: p.author_name, tags: p.tags,
      related_product_ids: p.related_product_ids, seo: p.seo,
      url: p.seo?.live_url || ("/blog/" + p.slug + ".html")
    }));

    return reply({
      ok: true,
      fetched_at: new Date().toISOString(),
      products: productsQ.data || [],
      categories: categoriesQ.data || [],
      pages: pagesQ.data || [],
      banners,
      blog_posts: blogs,
      seo: seoQ.data || [],
      hidden_static_product_ids: (hiddenQ.data || []).map((p: any) => p.slug)
    });
  } catch (_error) {
    return reply({ error: "Could not load published website content." }, 500);
  }
});