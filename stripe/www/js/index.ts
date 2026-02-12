/// <reference path="../../plugins/cordova-plugin-purchase/www/store.d.ts" />

/**
 * Cordova Purchase Plugin — Stripe via iaptic-js Example
 *
 * Demonstrates:
 *  - Using the IAPTIC_JS platform to sell via Stripe
 *  - Products defined in your iaptic dashboard (linked to Stripe)
 *  - Works on web (browser platform) and in Cordova apps
 *  - Receipt validation is handled by iaptic automatically
 *
 * Prerequisites:
 *  - Create products in your iaptic dashboard (https://www.iaptic.com)
 *  - Link your Stripe account in iaptic settings
 *  - Include iaptic-js script in index.html (before cordova.js)
 */

document.addEventListener('deviceready', onDeviceReady);

function onDeviceReady() {

  const { store, Logger, ProductType, Platform, LogLevel } = CdvPurchase;
  const log = new Logger({ verbosity: LogLevel.DEBUG }, 'StripeExample');

  // ──────────────────────────────────────────────
  // 1. Register products
  //    These product IDs come from your iaptic dashboard
  //    (they correspond to Stripe products/prices)
  // ──────────────────────────────────────────────
  store.register([{
    id: 'prod_XXXXXXXXXXXXX',                   // ← replace with your iaptic/Stripe product ID
    type: ProductType.CONSUMABLE,
    platform: Platform.IAPTIC_JS,
  }, {
    id: 'prod_YYYYYYYYYYYYY',                   // ← replace with your iaptic/Stripe product ID
    type: ProductType.PAID_SUBSCRIPTION,
    platform: Platform.IAPTIC_JS,
  }]);

  store.verbosity = LogLevel.DEBUG;

  // ──────────────────────────────────────────────
  // 2. Receipt validation with iaptic
  //    Replace appName and apiKey with your iaptic credentials
  // ──────────────────────────────────────────────
  const iaptic = new CdvPurchase.Iaptic({
    appName: 'YOUR_IAPTIC_APP_NAME',            // ← replace
    apiKey: 'YOUR_IAPTIC_API_KEY',              // ← replace
  });
  store.validator = iaptic.validator;

  // ──────────────────────────────────────────────
  // 3. Event handlers
  // ──────────────────────────────────────────────
  store.error(onStoreError);

  store.when()
    .productUpdated(() => renderUI())
    .approved(transaction => transaction.verify())
    .verified(receipt => {
      receipt.finish();
      renderUI();
    })
    .finished(() => renderUI());

  // ──────────────────────────────────────────────
  // 4. Initialize with the IAPTIC_JS platform (Stripe)
  //    Replace appName and apiKey with your iaptic credentials
  // ──────────────────────────────────────────────
  store.initialize([{
    platform: Platform.IAPTIC_JS,
    options: {
      type: 'stripe',
      stripePublicKey: 'pk_test_XXXXXXXXXXXXXX', // ← replace with your Stripe publishable key
      appName: 'YOUR_IAPTIC_APP_NAME',          // ← replace (same as above)
      apiKey: 'YOUR_IAPTIC_API_KEY',            // ← replace (same as above)
    }
  }]);

  renderUI();

  // ─── UI helpers ────────────────────────────────

  function renderUI() {
    const store = CdvPurchase.store;
    const productsEl = document.getElementById('products');
    if (!productsEl) return;

    const validProducts = store.products.filter(p => p.offers.length > 0);

    if (validProducts.length === 0) {
      productsEl.innerHTML = '<p>Loading products from Stripe…</p>';
      return;
    }

    productsEl.innerHTML = validProducts.map(p => `<div id="product-${p.id}"></div>`).join('');
    validProducts.forEach(product => {
      const el = document.getElementById(`product-${product.id}`);
      if (!el) return;
      const offers = product.offers.map(offer => {
        const pricing = offer.pricingPhases.map(phase => phase.price).join(' then ');
        const label = product.type === ProductType.PAID_SUBSCRIPTION ? 'Subscribe' : 'Buy';
        const buyBtn = offer.canPurchase
          ? ` <button onclick="orderOffer('${product.platform}','${product.id}','${offer.id}')">${label}</button>`
          : '';
        return `<li>${pricing}${buyBtn}</li>`;
      }).join('');
      el.innerHTML = `<h3>${product.title}</h3>`
        + `<div>${product.description || ''}</div>`
        + `<ul>${offers}</ul>`;
    });
  }

  (window as any).orderOffer = function(platform: string, productId: string, offerId: string) {
    const offer = CdvPurchase.store.get(productId, platform as CdvPurchase.Platform)?.getOffer(offerId);
    if (offer) CdvPurchase.store.order(offer);
  };
}

function onStoreError(error: CdvPurchase.IError) {
  const el = document.getElementById('error');
  if (!el) return;
  el.textContent = `ERROR ${error.code}: ${error.message}`;
  setTimeout(() => { el.textContent = ''; }, 10000);
}
