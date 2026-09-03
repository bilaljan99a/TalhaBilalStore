const TB_SUPABASE_URL='https://dxdjqeqlmyawqrzphzdb.supabase.co';
const TB_SUPABASE_KEY='sb_publishable__VZebPfljfwPNTxcWbDD7Q_pzIJvn_K';
const tbSupabase=window.supabase.createClient(TB_SUPABASE_URL,TB_SUPABASE_KEY);
const TB_ACCOUNT_FUNCTION=`${TB_SUPABASE_URL}/functions/v1/customer-account`;
const TB_REVIEW_FUNCTION=`${TB_SUPABASE_URL}/functions/v1/submit-review`;
async function tbSession(){const {data}=await tbSupabase.auth.getSession();return data.session;}
async function tbRequireLogin(){const session=await tbSession();if(!session){const returnTo=location.pathname+location.search;location.href=`login.html?return=${encodeURIComponent(returnTo)}`;return null;}return session;}
async function tbLogout(){await tbSupabase.auth.signOut();location.href='login.html';}
async function tbAccountOrders(session){const res=await fetch(TB_ACCOUNT_FUNCTION,{method:'POST',headers:{Authorization:`Bearer ${session.access_token}`,apikey:TB_SUPABASE_KEY,'Content-Type':'application/json'},body:JSON.stringify({action:'orders'})});const data=await res.json().catch(()=>({}));if(!res.ok||!data.success)throw new Error(data.error||'Could not load your orders.');return data.orders||[];}
function tbFormatDate(value){try{return new Date(value).toLocaleDateString('en-PK',{day:'numeric',month:'short',year:'numeric'});}catch{return value||''}}
function tbStatusClass(status){return String(status||'').toLowerCase().replace(/\s+/g,'-')}
