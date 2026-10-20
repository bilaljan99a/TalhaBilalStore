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
      if(b.action==="manual_create"){
        const full_name=String(b.full_name||"").trim(),phone=String(b.phone||"").trim(),address=String(b.address||"").trim(),city=String(b.city||"").trim();
        const itemName=String(b.item_name||"").trim(),quantity=Math.max(1,Math.floor(Number(b.quantity)||1)),unitPrice=Number(b.unit_price),unitWeight=Number(b.item_weight||0),productCost=Number(b.product_cost||0),packagingCost=Number(b.packaging_cost||0),deliveryFee=Number(b.delivery_fee||0);
        if(!full_name||!phone||!address||!city||!itemName||!Number.isFinite(unitPrice)||unitPrice<0||!Number.isFinite(productCost)||productCost<0||!Number.isFinite(packagingCost)||packagingCost<0||!Number.isFinite(deliveryFee)||deliveryFee<0||!Number.isFinite(unitWeight)||unitWeight<0) return out({error:"Please complete all required customer, product and cost fields."},400);
        const product_total=unitPrice*quantity,total=product_total+deliveryFee;
        const order_number="TB-"+String(Date.now()).slice(-8);
        const items=[{id:String(b.item_id||"manual-item"),name:itemName,price:unitPrice,quantity,weight:unitWeight}];
        const {data,error}=await db.from("orders").insert({order_number,full_name,phone,address,city,items,product_total,delivery_fee:deliveryFee,total,payment_method:"Cash on Delivery",status:String(b.status||"New"),product_cost:productCost,packaging_cost:packagingCost,shipping_cost:0,return_shipping_cost:0,ads_cost:0,other_cost:0,finance_note:"Manually entered by admin"}).select("id,order_number").single();
        if(error) return out({error:error.message},500);
        return out({success:true,order:data});
      }
      if(b.action==="import_courier_status"){
        const updates=Array.isArray(b.updates)?b.updates:[];
        if(!updates.length) return out({error:"No supported courier status rows found in the import file."},400);
        if(updates.length>10000) return out({error:"Import file is too large. Please import up to 10,000 courier rows at a time."},400);

        // IMPORTANT: Courier tracking IDs are the only matching keys.
        // A courier row can contain both Tracking No and Original Tracking No.
        // Match the order when either ID matches the order's saved tracking_number.
        // externalOrderId/order ID is deliberately ignored.
        const {data:orders,error:lookupError}=await db.from("orders").select("id,order_number,status,tracking_number");
        if(lookupError) return out({error:lookupError.message},500);

        const trackingAliases=(value:any):string[]=>{const t=String(value||"").trim().toUpperCase().replace(/[^A-Z0-9]/g,"");if(!t)return[];const out=[t];if(t.startsWith("PKDEX"))out.push(t.slice(2));else if(t.startsWith("DEX"))out.push("PK"+t);return [...new Set(out)];};
        const byTracking=new Map<string,any|null>();
        for(const o of (orders||[])){
          for(const t of trackingAliases(o.tracking_number)){
            if(!byTracking.has(t))byTracking.set(t,o);
            else if(byTracking.get(t)?.id!==o.id)byTracking.set(t,null);
          }
        }
        const statusPriority=(status:string)=>({"Cancelled":6,"Delivery Failed":5,"Delivered":4,"Out for Delivery":3,"Shipping":2,"Transit To Ship":2,"Processing":1,"Confirmed":1,"New":1} as Record<string,number>)[status]||0;
        const matched=new Map<string,any>();
        const missing:string[]=[];
        for(const x of updates){
          const trackingNo=String(x?.trackingNo||"").trim();
          const originalTrackingNo=String(x?.originalTrackingNo||"").trim();
          const supplied=[trackingNo,originalTrackingNo,...(Array.isArray(x?.trackingCandidates)?x.trackingCandidates:[])].filter(Boolean);
          const possible=new Map<string,any>();
          for(const candidate of supplied){
            for(const key of trackingAliases(candidate)){
              const order=byTracking.get(key);
              if(order)possible.set(String(order.id),order);
            }
          }
          if(possible.size===1){
            const o=[...possible.values()][0],id=String(o.id),status=String(x?.status||"").trim();
            const entry={order:o,status,rawStatus:String(x?.rawStatus||""),logisticsStatus:String(x?.logisticsStatus||"")};
            const prior=matched.get(id);
            if(!prior||statusPriority(status)>statusPriority(prior.status))matched.set(id,entry);
          }else{
            const fallback=[...new Set(supplied.map((v:any)=>String(v||"").trim()).filter(Boolean))].join(" / ");
            missing.push(fallback);
          }
        }

        const changed:any[]=[];
        let unchanged=0;
        let skippedProtected=0;
        const inProgress=["New","Confirmed","Processing","Transit To Ship","Shipping","Out for Delivery"];
        for(const {order,status,rawStatus,logisticsStatus} of matched.values()){
          if(!status)continue;
          if(order.status==="Cancelled"){unchanged++;skippedProtected++;continue;}
          const raw=String(rawStatus||"").toLowerCase().replace(/[_-]+/g," ").trim();
          const log=String(logisticsStatus||"").toLowerCase().replace(/[_-]+/g," ").trim();
          const attemptOnly=(v:string)=>v.includes("attempt")&&/(fail|unsuccess|not delivered)/.test(v)||/failed attempts?\s*\d*/.test(v)||/failed attempt/.test(v)||/reattempts failed/.test(v);
          const canCorrectMisclassifiedAttempt=status==="Shipping"&&(attemptOnly(raw)||attemptOnly(log));
          if(order.status==="Delivery Failed"&&inProgress.includes(status)&&!canCorrectMisclassifiedAttempt){unchanged++;continue;}
          if(order.status===status){unchanged++;continue;}
          changed.push({id:order.id,order_number:order.order_number,status});
        }

        for(const x of changed){
          const {error:updateError}=await db.from("orders").update({status:x.status}).eq("id",x.id);
          if(updateError) return out({error:updateError.message},500);
        }

        return out({
          success:true,
          imported:updates.length,
          matched:matched.size,
          updated:changed.length,
          unchanged,
          skippedProtected,
          skippedUnknown:missing.length,
          missing,
          updatedOrderIds:changed.map((x:any)=>x.order_number)
        });
      }

      // Backward-compatible delivered import. Kept isolated from courier-status
      // sync so existing workflows are not affected.
      if(b.action==="import_delivered"){
        const updates=Array.isArray(b.updates)?b.updates:[];
        if(!updates.length) return out({error:"No delivered orders found in the import file."},400);
        const externalIds=[...new Set(updates.map((x:any)=>String(x?.externalOrderId||"").trim()).filter(Boolean))];
        if(!externalIds.length) return out({error:"The file does not contain valid externalOrderId values."},400);
        if(externalIds.length>5000) return out({error:"Import file is too large. Please import up to 5,000 delivered orders at a time."},400);
        const {data:matchedOrders,error:lookupError}=await db.from("orders").select("id,order_number,status").in("order_number",externalIds);
        if(lookupError) return out({error:lookupError.message},500);
        const eligible=(matchedOrders||[]).filter((o:any)=>o.status!=="Cancelled"&&o.status!=="Returned"&&o.status!=="Delivered");
        const alreadyDelivered=(matchedOrders||[]).filter((o:any)=>o.status==="Delivered");
        const protectedOrders=(matchedOrders||[]).filter((o:any)=>o.status==="Cancelled"||o.status==="Returned");
        if(eligible.length){
          const {error:updateError}=await db.from("orders").update({status:"Delivered"}).in("id",eligible.map((o:any)=>o.id));
          if(updateError) return out({error:updateError.message},500);
        }
        return out({success:true,imported:externalIds.length,matched:matchedOrders?.length||0,updated:eligible.length,alreadyDelivered:alreadyDelivered.length,skippedProtected:protectedOrders.length,missing:externalIds.filter((id)=>!(matchedOrders||[]).some((o:any)=>String(o.order_number).trim()===id)),updatedOrderIds:eligible.map((o:any)=>o.order_number)});
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
      if(b.action==="manual_order_update"){
        const {data:existing,error:readError}=await db.from("orders").select("id,items,finance_note").eq("id",b.id).single();
        if(readError||!existing) return out({error:"Order not found"},404);
        if(String(existing.finance_note||"")!=="Manually entered by admin") return out({error:"Only manually entered orders can be edited here."},403);
        const full_name=String(b.full_name||"").trim(),phone=String(b.phone||"").trim(),address=String(b.address||"").trim(),city=String(b.city||"").trim(),itemName=String(b.item_name||"").trim();
        const quantity=Number(b.quantity),unitPrice=Number(b.unit_price),unitWeight=Number(b.item_weight),productCost=Number(b.product_cost),packagingCost=Number(b.packaging_cost),deliveryFee=Number(b.delivery_fee),status=String(b.status||"New");
        if(!full_name||!phone||!address||!city||!itemName||!Number.isInteger(quantity)||quantity<1||![unitPrice,unitWeight,productCost,packagingCost,deliveryFee].every(n=>Number.isFinite(n)&&n>=0)||!["New","Need To Confirm","Confirmed","Transit To Ship","Shipping","Out for Delivery","Delivered","Delivery Failed","Cancelled"].includes(status)) return out({error:"Please check all order fields and values."},400);
        const oldItems=Array.isArray(existing.items)?existing.items:[];
        const oldItem=oldItems[0]||{};
        const product_total=Math.round(unitPrice*quantity*100)/100,total=product_total+deliveryFee;
        const items=[{...oldItem,id:String(oldItem.id||"manual-item"),name:itemName,price:unitPrice,quantity,weight:unitWeight}];
        const {error:updateError}=await db.from("orders").update({full_name,phone,address,city,items,product_total,delivery_fee:deliveryFee,total,status,product_cost:productCost,packaging_cost:packagingCost}).eq("id",b.id);
        if(updateError) return out({error:updateError.message},500);
        return out({success:true});
      }
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