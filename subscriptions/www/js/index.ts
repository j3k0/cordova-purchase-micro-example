/// <reference path="../../plugins/cordova-plugin-purchase/www/store.d.ts" />

/**
 * Cordova Purchase Plugin — Subscriptions Example
 *
 * Demonstrates:
 *  - Registering subscription products on Apple App Store & Google Play
 *  - Receipt validation via iaptic
 *  - Handling the approved → verified → finished lifecycle
 *  - Displaying subscription status & available offers
 */

document.addEventListener('deviceready', onDeviceReady);

function onDeviceReady() {

  const { store, Logger, ProductType, Platform, LogLevel } = CdvPurchase;
  const log = new Logger({ verbosity: LogLevel.DEBUG }, 'SubscriptionsExample');

  // ──────────────────────────────────────────────
  // 1. Register products
  //    Replace these IDs with your own from App Store Connect / Google Play Console
  // ──────────────────────────────────────────────
  store.register([{
    id: 'monthly_basic',                        // ← replace with your product ID
    type: ProductType.PAID_SUBSCRIPTION,
    platform: Platform.APPLE_APPSTORE,
  }, {
    id: 'monthly_basic',                        // ← replace with your product ID
    type: ProductType.PAID_SUBSCRIPTION,
    platform: Platform.GOOGLE_PLAY,
  }, {
    id: 'yearly_pro',                           // ← replace with your product ID
    type: ProductType.PAID_SUBSCRIPTION,
    platform: Platform.APPLE_APPSTORE,
  }, {
    id: 'yearly_pro',                           // ← replace with your product ID
    type: ProductType.PAID_SUBSCRIPTION,
    platform: Platform.GOOGLE_PLAY,
  }]);

  store.verbosity = LogLevel.DEBUG;

  // ──────────────────────────────────────────────
  // 2. Receipt validation with iaptic
  //    Replace appName and apiKey with your iaptic credentials
  //    Sign up at https://www.iaptic.com
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
    .verified(receipt => receipt.finish())
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
    const statusEl = document.getElementById('status');
    const productsEl = document.getElementById('products');
    if (!statusEl || !productsEl) return;

    // Subscription status
    const subscriptions = store.products.filter(p => p.type === ProductType.PAID_SUBSCRIPTION);
    const owned = subscriptions.find(p => p.owned);
    if (owned) {
      const vp = store.findInVerifiedReceipts(owned);
      statusEl.innerHTML = `<h2>Subscribed</h2>`
        + `<div>Product: ${owned.id}</div>`
        + (vp?.expiryDate ? `<div>Renews: ${new Date(vp.expiryDate).toLocaleDateString()}</div>` : '');
    } else if (subscriptions.some(p => {
      const t = store.findInLocalReceipts(p);
      return t && (t.state === CdvPurchase.TransactionState.APPROVED || t.state === CdvPurchase.TransactionState.INITIATED);
    })) {
      statusEl.innerHTML = '<h2>Processing...</h2>';
    } else {
      statusEl.innerHTML = '<h2>Not Subscribed</h2>';
    }

    // Product list
    const validProducts = store.products.filter(p => p.offers.length > 0);
    productsEl.innerHTML = validProducts.map(p => `<div id="product-${p.id}"></div>`).join('');
    validProducts.forEach(product => {
      const el = document.getElementById(`product-${product.id}`);
      if (!el) return;
      const offers = product.offers.map(offer => {
        const pricing = offer.pricingPhases.map(phase => {
          const cycle =
            phase.recurrenceMode === 'FINITE_RECURRING'
              ? `${phase.billingCycles ?? ''} × `
              : phase.recurrenceMode === 'NON_RECURRING' ? ''
                : 'every ';
          return `${phase.price} (${cycle}${formatDuration(phase.billingPeriod)})`;
        }).join(' then ');
        const buyBtn = offer.canPurchase
          ? ` <button onclick="orderOffer('${product.platform}','${product.id}','${offer.id}')">Subscribe</button>`
          : '';
        return `<li>${pricing}${buyBtn}</li>`;
      }).join('');
      el.innerHTML = `<h3>${product.title}</h3>`
        + `<div>${product.description || ''}</div>`
        + `<ul>${offers}</ul>`;
    });
  }

  // Expose globally so HTML onclick handlers work
  (window as any).orderOffer = function(platform: string, productId: string, offerId: string) {
    const offer = CdvPurchase.store.get(productId, platform as CdvPurchase.Platform)?.getOffer(offerId);
    if (offer) CdvPurchase.store.order(offer);
  };

  (window as any).restorePurchases = function() {
    CdvPurchase.store.restorePurchases();
  };
}

function formatDuration(iso: string | undefined): string {
  if (!iso) return '';
  const n = iso.slice(1, iso.length - 1);
  const unit = iso[iso.length - 1];
  const units: Record<string, [string, string]> = {
    D: ['day', 'days'], W: ['week', 'weeks'], M: ['month', 'months'], Y: ['year', 'years'],
  };
  const [singular, plural] = units[unit] || [unit, unit];
  return n === '1' ? `1 ${singular}` : `${n} ${plural}`;
}

function onStoreError(error: CdvPurchase.IError) {
  const el = document.getElementById('error');
  if (!el) return;
  el.textContent = `ERROR ${error.code}: ${error.message}`;
  setTimeout(() => { el.textContent = ''; }, 10000);
}
