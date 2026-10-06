const META_CONFIG = {
  adAccountId: '1783909009396122',
  accessToken: 'EAATJw1ZANghQBSqNI6b78E4Ku0Pthwhx6LzEQFWgjptn5ZByXtPIgcIsbWast3ZBbTEygzVqmXdqMrzVbcxPIZBYbhbnIz6ncNI5quVSlofDZAtcL0sGjY7a08F1bDfnEFDHBzmbcZCe2XaQYZBbObhYX3QxZA1qPaArnbwkr3nZAENuDqORbHjLmhyigKIPQEtKjOfrWX85FAiHOIniBYYR8f9DZCQSRoXrDvAffztpaHZBsQqyQxJZBeQD6eFLeGZBxipNsgW2juin2iZBHVrZAMZD'
};

export async function onRequestGet(context) {
  try {
    const url = new URL(context.request.url);
    const singleDate = url.searchParams.get('date');
    const fromDate = url.searchParams.get('from');
    const toDate = url.searchParams.get('to');
    const range = url.searchParams.get('range') || 'yesterday';

    const accountId = 'act_' + (context.env?.META_AD_ACCOUNT_ID || META_CONFIG.adAccountId).replace(/^act_/, '');
    const token = context.env?.META_ACCESS_TOKEN || META_CONFIG.accessToken;

    let timeParam = '';
    let label = range;
    if (singleDate) {
      timeParam = `time_range=${encodeURIComponent(JSON.stringify({ since: singleDate, until: singleDate }))}`;
      label = singleDate;
    } else if (fromDate && toDate) {
      timeParam = `time_range=${encodeURIComponent(JSON.stringify({ since: fromDate, until: toDate }))}`;
      label = `${fromDate} to ${toDate}`;
    } else {
      timeParam = `date_preset=${encodeURIComponent(range)}`;
    }

    const accountUrl = `https://graph.facebook.com/v19.0/${accountId}/insights?${timeParam}&fields=spend,impressions,reach,clicks,cpc,cpm,ctr,actions,cost_per_action_type&access_token=${token}`;
    const campaignsUrl = `https://graph.facebook.com/v19.0/${accountId}/insights?level=campaign&${timeParam}&fields=campaign_id,campaign_name,spend,impressions,reach,clicks,cpc,ctr,actions,cost_per_action_type&access_token=${token}`;
    const statusUrl = `https://graph.facebook.com/v19.0/${accountId}/campaigns?fields=id,name,status,objective,daily_budget&access_token=${token}`;

    const [accountRes, campaignsRes, statusRes] = await Promise.all([
      fetch(accountUrl).then(r => r.json()),
      fetch(campaignsUrl).then(r => r.json()),
      fetch(statusUrl).then(r => r.json())
    ]);

    if (accountRes.error) {
      return new Response(JSON.stringify({ success: false, error: accountRes.error.message || 'Meta API error' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    const statusMap = {};
    if (statusRes && Array.isArray(statusRes.data)) {
      statusRes.data.forEach(c => { statusMap[c.id] = c; });
    }

    const campaigns = (campaignsRes.data || []).map(c => {
      const extra = statusMap[c.campaign_id] || {};
      const actions = c.actions || [];
      const costPerAction = c.cost_per_action_type || [];
      const purchaseAction = actions.find(a => a.action_type === 'purchase' || a.action_type === 'omni_purchase');
      const costPerPurchase = costPerAction.find(a => a.action_type === 'purchase' || a.action_type === 'omni_purchase');
      const checkoutAction = actions.find(a => a.action_type === 'initiate_checkout' || a.action_type === 'omni_initiated_checkout');
      const linkClickAction = actions.find(a => a.action_type === 'link_click');
      return {
        id: c.campaign_id,
        name: c.campaign_name,
        status: extra.status || 'ACTIVE',
        daily_budget: extra.daily_budget ? Number(extra.daily_budget) : null,
        spend: Number(c.spend || 0),
        impressions: Number(c.impressions || 0),
        reach: Number(c.reach || 0),
        clicks: Number(c.clicks || 0),
        link_clicks: linkClickAction ? Number(linkClickAction.value) : Number(c.clicks || 0),
        cpc: Number(c.cpc || 0),
        ctr: Number(c.ctr || 0),
        purchases: purchaseAction ? Number(purchaseAction.value) : 0,
        cost_per_purchase: costPerPurchase ? Number(costPerPurchase.value) : 0,
        checkouts: checkoutAction ? Number(checkoutAction.value) : 0
      };
    });

    const summary = accountRes.data && accountRes.data[0] ? accountRes.data[0] : null;
    let totalPurchases = 0;
    let costPerPurchase = 0;
    let totalCheckouts = 0;
    let linkClicks = 0;
    if (summary && summary.actions) {
      const pAct = summary.actions.find(a => a.action_type === 'purchase' || a.action_type === 'omni_purchase');
      totalPurchases = pAct ? Number(pAct.value) : 0;
      const cppAct = summary.cost_per_action_type?.find(a => a.action_type === 'purchase' || a.action_type === 'omni_purchase');
      costPerPurchase = cppAct ? Number(cppAct.value) : 0;
      const chkAct = summary.actions.find(a => a.action_type === 'initiate_checkout' || a.action_type === 'omni_initiated_checkout');
      totalCheckouts = chkAct ? Number(chkAct.value) : 0;
      const linkAct = summary.actions.find(a => a.action_type === 'link_click');
      linkClicks = linkAct ? Number(linkAct.value) : Number(summary.clicks || 0);
    }

    const payload = {
      success: true,
      range: label,
      account_id: accountId,
      summary: summary ? {
        spend: Number(summary.spend || 0),
        impressions: Number(summary.impressions || 0),
        reach: Number(summary.reach || 0),
        clicks: Number(summary.clicks || 0),
        link_clicks: linkClicks,
        cpc: Number(summary.cpc || 0),
        cpm: Number(summary.cpm || 0),
        ctr: Number(summary.ctr || 0),
        purchases: totalPurchases,
        cost_per_purchase: costPerPurchase,
        checkouts: totalCheckouts
      } : { spend: 0, impressions: 0, reach: 0, clicks: 0, link_clicks: 0, cpc: 0, cpm: 0, ctr: 0, purchases: 0, cost_per_purchase: 0, checkouts: 0 },
      campaigns
    };

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': '*'
    }
  });
}
