// Talha Bilal Store — customer-account helpers (Phase 5 stub).
//
// Customer login was REMOVED by the user (2026-11-05): it was live at the
// start, then he took it down after Google Search Console flagged a security
// issue on the customer account pages. There is no customer session any
// more — checkout is anonymous guest Cash on Delivery, and reviews are
// admin-managed only (cms-demo). The old customer-account / login-by-phone /
// submit-review / purchase-data endpoints were NOT ported to the new Worker
// backend, and no login.html / account.html rebuild exists.
//
// These function names stay (returning "no customer session") so any page
// that still references them cannot throw. No page loads a customer session
// any more; index.html / products.html / reviews.html no longer include
// this file.
async function tbSession(){return null;}
async function tbRequireLogin(){return null;}
async function tbLogout(){/* no customer session to sign out of */}
async function tbAccountOrders(){return [];}
function tbFormatDate(value){try{return new Date(value).toLocaleDateString('en-PK',{day:'numeric',month:'short',year:'numeric'});}catch{return value||''}}
function tbStatusClass(status){return String(status||'').toLowerCase().replace(/\s+/g,'-')}
