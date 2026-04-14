/// <reference path="../../plugins/cordova-plugin-purchase/www/store.d.ts" />

/**
 * Cordova Purchase Plugin — Consumables Example
 *
 * Demonstrates:
 *  - Registering consumable products on Apple App Store & Google Play
 *  - Receipt validation via iaptic
 *  - Handling the approved → verified → finished lifecycle
 */

document.addEventListener('deviceready', onDeviceReady);

function onDeviceReady() {

  const { store, Logger, ProductType, Platform, LogLevel } = CdvPurchase;
  const log = new Logger({ verbosity: LogLevel.DEBUG }, 'ConsumablesExample');

  // ──────────────────────────────────────────────
  // Token counter (persisted in localStorage)
  // ──────────────────────────────────────────────
  // A real app would use a server-side DB; this is just a demo.
  const purchasesKey = 'purchases_v3';
  let purchases: Record<string, { date: string, quantity: number }> =
    JSON.parse(localStorage.getItem(purchasesKey) || '{}');

  function getTokens(): number {
    return Object.values(purchases).reduce((sum, p) => sum + p.quantity, 0);
  }

  function upsertPurchase(transactionId: string, quantity: number) {
    log.info(`upsertPurchase(${transactionId}): quantity=${quantity}`)
    if (purchases[transactionId]) {
      if (purchases[transactionId].quantity === quantity) {
        return false;
      }
      else {
        purchases[transactionId].quantity = quantity;
        return true;
      }
    }
    else {
      purchases[transactionId] = { date: new Date().toISOString(), quantity };
      localStorage.setItem(purchasesKey, JSON.stringify(purchases));
      return true;
    }
  }

  function setStatus(msg: string) {
    const el = document.getElementById('status');
    if (el) el.textContent = msg;
  }

  // ──────────────────────────────────────────────
  // 1. Register products (configured in env.ts)
  // ──────────────────────────────────────────────
  store.register(ENV.consumableIds.flatMap((id: string) => [{
    id,
    type: ProductType.CONSUMABLE,
    platform: Platform.APPLE_APPSTORE,
  }, {
    id,
    type: ProductType.CONSUMABLE,
    platform: Platform.GOOGLE_PLAY,
  }]));

  store.verbosity = LogLevel.DEBUG;
  store.applicationUsername = ENV.applicationUsername;

  // ──────────────────────────────────────────────
  // 2. Receipt validation with iaptic (configured in env.ts)
  // ──────────────────────────────────────────────
  const iaptic = new CdvPurchase.Iaptic({
    appName: ENV.iapticAppName,
    apiKey: ENV.iapticApiKey,
    url: ENV.iapticUrl,
  });
  store.validator = iaptic.validator;

  // ──────────────────────────────────────────────
  // 3. Event handlers
  // ──────────────────────────────────────────────
  store.error(onStoreError);

  store.when()
    .productUpdated(() => renderUI())
    .approved(transaction => {
      log.info(`transaction approved, for ${transaction.quantity || 1}x ${transaction.products.map(p => p.id).join(', ')}`);
      setStatus('Validating...');
      transaction.verify();
    })
    .verified(receipt => {
      log.info('verified collection: ' + JSON.stringify(receipt.collection));

      function findQuantity(purchase: CdvPurchase.VerifiedPurchase) {
        // validator returned the quantity
        if (purchase.quantity) return purchase.quantity;
        // if not, find the quantity reported by the client SDK for that product
        const t = receipt.sourceReceipt.transactions.find(t => t.products.some(p => p.id === purchase.id));
        return t?.quantity || 1;
      }

      // Sync purchases from the verified receipt's collection
      for (const purchase of receipt.collection) {
        if (!purchase.id || !ENV.consumableIds.includes(purchase.id)) continue;
        const key = purchase.transactionId || purchase.purchaseId || (purchase.id + ':' + purchase.purchaseDate);
        if (purchase.cancelationReason) {
          log.info('canceled purchase: ' + key + ' reason: ' + purchase.cancelationReason);
          if (purchases[key]) {
            purchases[key].quantity = 0;
            localStorage.setItem(purchasesKey, JSON.stringify(purchases));
          }
        } else {
          const quantity = findQuantity(purchase);
          if (upsertPurchase(key, quantity)) {
            setStatus(`Purchase complete! +${quantity} token`);
          }
        }
      }
      receipt.finish();
      renderUI();
    })
    .finished(() => {
      setTimeout(() => setStatus(''), 3000);
      renderUI();
    });

  // ──────────────────────────────────────────────
  // 4. Initialize — connects to the store
  // ──────────────────────────────────────────────
  store.initialize([
    Platform.APPLE_APPSTORE,
    Platform.GOOGLE_PLAY,
  ]);

  renderUI();

  // ─── UI helpers ────────────────────────────────

  function renderUI() {
    const store = CdvPurchase.store;
    const tokensEl = document.getElementById('tokens');
    if (tokensEl) tokensEl.textContent = `Tokens: ${getTokens()}`;

    const productsEl = document.getElementById('products');
    if (!productsEl) return;

    const validProducts = store.products.filter(p => p.offers.length > 0);
    productsEl.innerHTML = validProducts.map(p => `<div id="product-${p.id}"></div>`).join('');
    validProducts.forEach(product => {
      const el = document.getElementById(`product-${product.id}`);
      if (!el) return;
      const offers = product.offers.map(offer => {
        const price = offer.pricingPhases[0]?.price || '';
        const buyBtn = offer.canPurchase
          ? ` <button onclick="orderOffer('${product.platform}','${product.id}','${offer.id}', 1)">Buy</button>`
          : '';
        const buyX2Btn = offer.canPurchase && store.checkSupport(offer.platform, 'orderQuantity')
        ? ` <button onclick="orderOffer('${product.platform}','${product.id}','${offer.id}', 2)">Buy X2</button>`
        : '';
      return `<li>${price}${buyBtn}${buyX2Btn}</li>`;
      }).join('');
      el.innerHTML = `<h3>${product.title}</h3>`
        + `<div>${product.description || ''}</div>`
        + `<ul>${offers}</ul>`;
    });
    const storefrontEl = document.getElementById('storefront');
    const storefront = store.getStorefront();
    if (storefrontEl && storefront) storefrontEl.innerHTML = `
      <p>Store: ${storefront.platform} (${storefront.countryCode})</p>
    `;
  }

  // Expose globally so HTML onclick handlers work
  (window as any).orderOffer = function(platform: string, productId: string, offerId: string, quantity: number) {
    const offer = CdvPurchase.store.get(productId, platform as CdvPurchase.Platform)?.getOffer(offerId);
    if (offer) {
      setStatus('Processing...');
      CdvPurchase.store.order(offer, {quantity});
    }
  };

  (window as any).restorePurchases = function() {
    CdvPurchase.store.restorePurchases();
  };
}

function onStoreError(error: CdvPurchase.IError) {
  const el = document.getElementById('error');
  if (!el) return;
  el.textContent = `ERROR ${error.code}: ${error.message}`;
  setTimeout(() => { el.textContent = ''; }, 10000);
}
