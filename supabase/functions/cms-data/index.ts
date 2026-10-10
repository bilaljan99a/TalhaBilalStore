import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
  "Vary": "Origin",
  "Content-Type": "application/json"
};

const reply = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: corsHeaders });

Deno.serve(async (req: Request) => {
  // Browser preflight must be handled before any authentication check.
  if (req.method === "OPTIONS") return new Response("ok", { status: 200, headers: corsHeaders });
  if (req.method !== "GET" && req.method !== "POST") {
    return reply({ error: "Method not allowed" }, 405);
  }

  try {
    const authorization = req.headers.get("Authorization") || "";
    const token = authorization.replace(/^Bearer\s+/i, "").trim();
    if (!token) return reply({ error: "Unauthorized. Please sign in." }, 401);

    const url = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !serviceKey) return reply({ error: "Server configuration is incomplete." }, 500);

    // The gateway JWT check is disabled so OPTIONS can reach the handler.
    // Every data request is still authenticated and authorized here.
    const adminClient = createClient(url, serviceKey);
    const { data: userData, error: userError } = await adminClient.auth.getUser(token);
    if (userError || !userData.user) return reply({ error: "Session expired. Please sign in again." }, 401);

    const { data: admin, error: adminError } = await adminClient
      .from("cms_admins")
      .select("user_id,role")
      .eq("user_id", userData.user.id)
      .maybeSingle();

    if (adminError || !admin) return reply({ error: "CMS access denied for this account." }, 403);

    const results = await Promise.all([
      adminClient.from("orders").select("*").order("created_at", { ascending: false }),
      adminClient.from("daily_finance").select("*").order("finance_date", { ascending: false }),
      adminClient.from("finance_settings").select("*").limit(1),
      adminClient.from("reviews").select("*").order("created_at", { ascending: false }),
      adminClient.from("customer_profiles").select("*").order("created_at", { ascending: false })
    ]);

    const failed = results.find((result) => result.error);
    if (failed?.error) return reply({ error: failed.error.message }, 500);

    return reply({
      ok: true,
      role: admin.role,
      fetched_at: new Date().toISOString(),
      orders: results[0].data || [],
      daily_finance: results[1].data || [],
      finance_settings: results[2].data || [],
      reviews: results[3].data || [],
      customer_profiles: results[4].data || []
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected CMS data error.";
    return reply({ error: message }, 500);
  }
});