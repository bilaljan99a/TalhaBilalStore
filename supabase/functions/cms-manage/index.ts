import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
  "Content-Type": "application/json"
};
const reply = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: cors });

const TABLES: Record<string, { fields: string[]; order: string }> = {
  cms_products: { fields: ["name","slug","sku","short_description","description","category_id","price","sale_price","cost","stock","status","featured","best_seller","is_new","attributes","images","seo"], order: "updated_at" },
  cms_categories: { fields: ["name","slug","description","image_url","parent_id","sort_order","is_active","seo"], order: "sort_order" },
  cms_pages: { fields: ["title","slug","status","sections","seo"], order: "updated_at" },
  cms_banners: { fields: ["title","subtitle","image_url","mobile_image_url","button_text","button_url","placement","sort_order","starts_at","ends_at","is_active"], order: "sort_order" },
  cms_blog_posts: { fields: ["title","slug","excerpt","content","featured_image_url","status","published_at","author_name","tags","related_product_ids","seo"], order: "updated_at" },
  cms_reviews: { fields: ["customer_name","rating","review_text","product_id","image_url","status","featured"], order: "created_at" },
  cms_faqs: { fields: ["question","answer","category","sort_order","is_active"], order: "sort_order" },
  cms_media: { fields: ["name","url","type","alt_text","folder"], order: "created_at" },
  cms_promotions: { fields: ["name","type","value","min_order_value","code","starts_at","ends_at","rules","is_active"], order: "updated_at" },
  cms_seo: { fields: ["entity_type","entity_id","title","description","canonical","robots","og_image","schema_json"], order: "updated_at" },
  cms_redirects: { fields: ["source_path","destination_path","status_code","is_active"], order: "source_path" },
  cms_settings: { fields: ["key","value"], order: "key" }
};
function clean(input: unknown, allowed: string[]) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("A JSON object is required.");
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (!allowed.includes(key)) throw new Error("Field is not allowed: " + key);
    result[key] = value;
  }
  if (!Object.keys(result).length) throw new Error("No editable fields were supplied.");
  return result;
}
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "").trim();
    if (!token) return reply({ error: "Unauthorized" }, 401);
    const url = Deno.env.get("SUPABASE_URL"), serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !serviceKey) return reply({ error: "Server configuration is incomplete." }, 500);
    const db = createClient(url, serviceKey);
    const { data: authData, error: authError } = await db.auth.getUser(token);
    if (authError || !authData.user) return reply({ error: "Unauthorized" }, 401);
    const { data: admin, error: roleError } = await db.from("cms_admins").select("user_id,role").eq("user_id", authData.user.id).maybeSingle();
    if (roleError || !admin) return reply({ error: "CMS access denied" }, 403);
    const u = new URL(req.url), table = u.searchParams.get("table") || "";
    if (!Object.hasOwn(TABLES, table)) return reply({ error: "Unsupported CMS table." }, 400);
    const spec = TABLES[table];
    if (req.method === "GET") {
      const { data, error } = await db.from(table).select("*").order(spec.order, { ascending: true }).limit(1000);
      if (error) return reply({ error: error.message }, 500);
      return reply({ ok: true, data: data || [] });
    }
    if (admin.role === "editor") return reply({ error: "Your CMS role is read-only for changes." }, 403);
    if (!["POST","PATCH","DELETE"].includes(req.method)) return reply({ error: "Method not allowed." }, 405);
    const body = req.method === "DELETE" ? {} : await req.json().catch(() => ({}));
    const id = u.searchParams.get("id") || String(body.id || "");
    let before: unknown = null, after: unknown = null, action = "";
    if (req.method === "POST") {
      const values = clean(body.data, spec.fields);
      const { data, error } = await db.from(table).insert(values).select("*").single();
      if (error) return reply({ error: error.message }, 400);
      after = data; action = "create";
    } else {
      if (!id) return reply({ error: "Record id is required." }, 400);
      const { data: oldRow, error: readError } = await db.from(table).select("*").eq("id", id).maybeSingle();
      if (readError || !oldRow) return reply({ error: readError?.message || "Record not found." }, 404);
      before = oldRow;
      if (req.method === "PATCH") {
        const values = clean(body.data, spec.fields);
        const { data, error } = await db.from(table).update(values).eq("id", id).select("*").single();
        if (error) return reply({ error: error.message }, 400);
        after = data; action = "update";
      } else {
        const { error } = await db.from(table).delete().eq("id", id);
        if (error) return reply({ error: error.message }, 400);
        action = "delete";
      }
    }
    const { error: auditError } = await db.from("cms_audit_log").insert({
      user_id: authData.user.id, entity_type: table, entity_id: String((after as any)?.id ?? id ?? ""),
      action, before_data: before, after_data: after
    });
    if (auditError) return reply({ error: "Change saved but audit logging failed: " + auditError.message }, 500);
    return reply({ ok: true, data: after });
  } catch (e) {
    return reply({ error: e instanceof Error ? e.message : String(e) }, 400);
  }
});