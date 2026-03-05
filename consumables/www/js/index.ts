/// <reference path="../../plugins/cordova-plugin-purchase/www/store.d.ts" />

/**
 * Cordova Purchase Plugin — Consumables Example
 *
 * Demonstrates:
 *  - Registering consumable products on Apple App Store & Google Play
 *  - Receipt validation via iaptic
 *  - Quantity selection dialog before purchase
 *  - Handling the approved → verified → finished lifecycle
 */

document.addEventListener('deviceready', onDeviceReady);

// Pending order details for the quantity dialog
let pendingOrder: { platform: string; productId: string; offerId: string } | null = null;

function onDeviceReady() {

  const { store, Logger, ProductType, Platform, LogLevel } = CdvPurchase;
  const log = new Logger({ verbosity: LogLevel.DEBUG }, 'ConsumablesExample');

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
    .approved(transaction => transaction.verify())
    .verified(receipt => {
      receipt.finish();
      renderUI();
      // Here you would grant the user's coins/tokens:
      // receipt.collection.forEach(purchase => {
      //   grantCoins(purchase.id, purchase.quantity ?? 1);
      // });
    })
    .finished(() => renderUI());

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
          ? ` <button onclick="showQuantityDialog('${product.platform}','${product.id}','${offer.id}')">Buy</button>`
          : '';
        return `<li>${price}${buyBtn}</li>`;
      }).join('');
      el.innerHTML = `<h3>${product.title}</h3>`
        + `<div>${product.description || ''}</div>`
        + `<ul>${offers}</ul>`;
    });
  }

  // Expose globally so HTML onclick handlers work
  (window as any).showQuantityDialog = function(platform: string, productId: string, offerId: string) {
    pendingOrder = { platform, productId, offerId };
    const dialog = document.getElementById('quantity-dialog');
    const input = document.getElementById('quantity-input') as HTMLInputElement;
    if (dialog) dialog.classList.add('active');
    if (input) input.value = '1';
  };

  (window as any).confirmQuantity = function() {
    const dialog = document.getElementById('quantity-dialog');
    const input = document.getElementById('quantity-input') as HTMLInputElement;
    if (dialog) dialog.classList.remove('active');
    if (!pendingOrder) return;

    const qty = parseInt(input?.value || '1');
    if (isNaN(qty) || qty < 1 || qty > 10) {
      alert('Please enter a quantity between 1 and 10');
      return;
    }

    const { platform, productId, offerId } = pendingOrder;
    pendingOrder = null;

    const offer = CdvPurchase.store.get(productId, platform as CdvPurchase.Platform)?.getOffer(offerId);
    if (!offer) return;

    const additionalData: CdvPurchase.AdditionalData = {};
    if (platform === CdvPurchase.Platform.APPLE_APPSTORE) {
      additionalData.appStore = { quantity: qty } as any;
    }

    CdvPurchase.store.order(offer, additionalData);
  };

  (window as any).cancelQuantity = function() {
    const dialog = document.getElementById('quantity-dialog');
    if (dialog) dialog.classList.remove('active');
    pendingOrder = null;
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
