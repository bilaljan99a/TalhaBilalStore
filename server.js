import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

const PRODUCTS = {
  'mango-1kg': { name: 'Mango Pulp Drink Premix 1kg', description: 'Refreshing mango drink premix for easy homemade mango juice — makes approximately 9.8–10 liters.', price: 450, image: 'assets/products/1kg-mango-pulp.webp', weight: 1 },
  'mango-2kg': { name: 'Mango Pulp Drink Premix 2kg', description: 'Refreshing mango drink premix for easy homemade mango juice — makes approximately 19.6–20 liters.', price: 795, image: 'assets/products/2kg-mango-pulp.jpg', weight: 2 },
  'mango-3kg': { name: 'Mango Pulp Drink Premix 3kg', description: 'Liquid mango pulp mix for larger family use — makes approximately 29.4–30 liters.', price: 1214, image: 'assets/products/3kg-mango-pulp.webp', weight: 3 },
  'mango-4kg': { name: 'Mango Pulp Drink Premix 4kg', description: 'Family-size mango drink premix — makes approximately 39.2–40 liters.', price: 1650, image: 'assets/products/4kg-mango-pulp.webp', weight: 4 },
  'mango-5kg': { name: 'Mango Pulp Drink Premix 5kg', description: '1kg × 5 pack for larger gatherings — makes approximately 49–50 liters.', price: 2130, image: 'assets/products/5kg-mango-pulp.jpg', weight: 5 },
  'mango-10kg': { name: 'Mango Pulp Drink Premix 10kg', description: 'Large 10kg pack for events, families and bulk use — makes approximately 98–100 liters.', price: 4130, image: 'assets/products/10kg-mango-pulp.webp', weight: 10 }
};

function attr(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function getProductSeo(p, id, host) {
  const site = `https://${host || 'www.talhabilalstore.com'}`;
  const cleanUrl = `${site}/product/${encodeURIComponent(id)}`;
  const image = `${site}/${p.image}`;
  const yieldMatch = p.description.match(/makes\s+(?:approximately\s+)?(.*?liters?)/i);
  const yieldText = (yieldMatch && yieldMatch[1]) ? yieldMatch[1].trim() : `${Number(p.weight) * 9.8} liters`;
  const title = `${p.name} – Rs. ${Number(p.price).toLocaleString('en-PK')} | Makes ${yieldText} | Talha Bilal Store`;
  const description = `${p.name} for Rs. ${Number(p.price).toLocaleString('en-PK')}. This ${p.weight}kg Mango Pulp Drink Premix makes ${yieldText}. Cash on Delivery available across Pakistan with product details and customer reviews.`;
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    description: p.description,
    image: [image, `${site}/assets/products/mango-pulp-product-image.webp`],
    sku: id,
    brand: { '@type': 'Brand', name: 'Talha Bilal Store' },
    offers: {
      '@type': 'Offer',
      url: cleanUrl,
      priceCurrency: 'PKR',
      price: Number(p.price),
      availability: 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition'
    }
  };
  return { title, description, image, cleanUrl, schema };
}

// Route handlers for specific known pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/products', (req, res) => {
  res.sendFile(path.join(__dirname, 'products.html'));
});

app.get('/product', (req, res) => {
  const id = req.query.id;
  if (id && PRODUCTS[id]) {
    return res.redirect(301, `/product/${encodeURIComponent(id)}`);
  }
  if (id) {
    return res.sendFile(path.join(__dirname, 'product.html'));
  }
  res.redirect(301, '/products');
});

app.get('/product/:id', (req, res) => {
  const id = String(req.params.id || '').toLowerCase();
  const p = PRODUCTS[id];
  const productHtmlPath = path.join(__dirname, 'product.html');

  if (!p) {
    // If not found in predefined map, still render product.html so client-side fallback can handle
    return res.sendFile(productHtmlPath);
  }

  try {
    let html = fs.readFileSync(productHtmlPath, 'utf8');
    const seo = getProductSeo(p, id, req.get('host'));
    const schemaJson = JSON.stringify(seo.schema).replace(/</g, '\\u003c');
    const headMeta = `<meta property="og:title" content="${attr(seo.title)}"><meta property="og:description" content="${attr(seo.description)}"><meta property="og:type" content="product"><meta property="og:image" content="${attr(seo.image)}"><meta property="og:url" content="${attr(seo.cleanUrl)}"><link rel="canonical" href="${attr(seo.cleanUrl)}"><script type="application/ld+json" data-product-schema>${schemaJson}</script>`;

    html = html.replace(/<title>.*?<\/title>/i, `<title>${attr(seo.title)}</title>`);
    html = html.replace(/<meta\s+name=["']description["']\s+content=["'][^"']*["']/i, `<meta name="description" content="${attr(seo.description)}"`);
    html = html.replace('</head>', `${headMeta}\n</head>`);

    res.setHeader('Content-Type', 'text/html; charset=UTF-8');
    return res.send(html);
  } catch (err) {
    console.error('Error generating product page:', err);
    return res.sendFile(productHtmlPath);
  }
});

// Clean URL middleware for any other HTML pages (e.g. /reviews -> /reviews.html)
app.use((req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return next();
  }

  const cleanPath = req.path.replace(/^\//, '').replace(/\/$/, '');
  if (!cleanPath) return next();

  const directHtml = path.join(__dirname, `${cleanPath}.html`);
  if (fs.existsSync(directHtml) && fs.statSync(directHtml).isFile()) {
    return res.sendFile(directHtml);
  }

  next();
});

// Serve all static assets from root directory
app.use(express.static(__dirname, {
  extensions: ['html', 'htm']
}));

// Fallback to 404 for unknown paths
app.use((req, res) => {
  res.status(404).send('Page Not Found');
});

app.listen(PORT, HOST, () => {
  console.log(`Talha Bilal Store server running at http://${HOST}:${PORT}`);
});
