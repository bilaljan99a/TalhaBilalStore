import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"GET, PATCH, POST, OPTIONS","Content-Type":"application/json"};
const out=(x:any,s=200)=>new Response(JSON.stringify(x),{status:s,headers:cors});
Deno.serve(async(req)=>{
  if(req.method==="OPTIONS") return new Response("ok",{headers:cors});
  try{
    const auth=req.headers.get("Authorization")||"";
    const token=auth.replace(/^Bearer\s+/i,"").trim();
    let userId="";
    try{
      const parts=token.split(".");
      if(parts.length===3) userId=String(JSON.parse(atob(parts[1].replace(/-/g,"+").replace(/_/g,"/"))).sub||"");
    }catch{}
    if(userId!=="954b6c13-d735-4b87-9a91-bb8020f0eed4") return out({error:"Unauthorized"},401);
    const db=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    if(req.method==="GET"){
      const [ordersResult,dailyResult]=await Promise.all([
        db.from("orders").select("*").order("created_at",{ascending:false}),
        db.from("daily_finance").select("*").order("finance_date",{ascending:false})
      ]);
      if(ordersResult.error) return out({error:ordersResult.error.message},500);
      if(dailyResult.error) return out({error:dailyResult.error.message},500);
      return out({orders:ordersResult.data||[],daily_finance:dailyResult.data||[]});
    }
    if(req.method==="POST"){
      const b=await req.json();
      if(b.action==="import_delivered"){
        const updates=Array.isArray(b.updates)?b.updates:[];
        if(!updates.length) return out({error:"No delivered orders found in the import file."},400);
        const externalIds=[...new Set(updates.map((x:any)=>String(x?.externalOrderId||"").trim()).filter(Boolean))];
        if(!externalIds.length) return out({error:"The file does not contain valid externalOrderId values."},400);
        if(externalIds.length>5000) return out({error:"Import file is too large. Please import up to 5,000 delivered orders at a time."},400);

        const {data:matchedOrders,error:lookupError}=await db.from("orders").select("id,order_number,status").in("order_number",externalIds);
        if(lookupError) return out({error:lookupError.message},500);

        const matchedByNumber=new Map((matchedOrders||[]).map((o:any)=>[String(o.order_number).trim(),o]));
        const missing=externalIds.filter((id)=>!matchedByNumber.has(id));
        const eligible=(matchedOrders||[]).filter((o:any)=>o.status!=="Cancelled"&&o.status!=="Returned"&&o.status!=="Delivered");
        const alreadyDelivered=(matchedOrders||[]).filter((o:any)=>o.status==="Delivered");
        const protectedOrders=(matchedOrders||[]).filter((o:any)=>o.status==="Cancelled"||o.status==="Returned");

        if(eligible.length){
          const {error:updateError}=await db.from("orders").update({status:"Delivered"}).in("id",eligible.map((o:any)=>o.id));
          if(updateError) return out({error:updateError.message},500);
        }

        return out({
          success:true,
          imported:externalIds.length,
          matched:matchedOrders?.length||0,
          updated:eligible.length,
          alreadyDelivered:alreadyDelivered.length,
          skippedProtected:protectedOrders.length,
          missing,
          updatedOrderIds:eligible.map((o:any)=>o.order_number)
        });
      }
      return out({error:"Unknown import action"},400);
    }
    if(req.method==="PATCH"){
      const b=await req.json();
      if(b.finance_date!==undefined && b.daily_ads_cost!==undefined){
        const financeDate=String(b.finance_date).slice(0,10);
        const ads=Number(b.daily_ads_cost);
        if(!/^\d{4}-\d{2}-\d{2}$/.test(financeDate)||!Number.isFinite(ads)||ads<0) return out({error:"Invalid daily ads cost"},400);
        const {error}=await db.from("daily_finance").upsert({finance_date:financeDate,ads_cost:ads,updated_at:new Date().toISOString()},{onConflict:"finance_date"});
        if(error) return out({error:error.message},500);
        return out({success:true});
      }
      if(!b.id) return out({error:"Missing order id"},400);
      const patch:any={};
      if(b.status!==undefined) patch.status=String(b.status);
      if(b.tracking_number!==undefined) patch.tracking_number=String(b.tracking_number||"").trim();
      for(const k of ["product_cost","shipping_cost","return_shipping_cost","ads_cost","packaging_cost","other_cost"]){
        if(b[k]!==undefined){const n=Number(b[k]);if(!Number.isFinite(n)||n<0)return out({error:"Invalid value for "+k},400);patch[k]=n;}
      }
      if(b.finance_note!==undefined) patch.finance_note=String(b.finance_note||"").trim();
      if(!Object.keys(patch).length) return out({error:"Nothing to update"},400);
      const {error}=await db.from("orders").update(patch).eq("id",b.id);
      if(error) return out({error:error.message},500);
      return out({success:true});
    }
    return out({error:"Method not allowed"},405);
  }catch(e){return out({error:e instanceof Error?e.message:String(e)},500)}
});