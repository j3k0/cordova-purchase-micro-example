/// <reference path="../../plugins/cordova-plugin-purchase/www/store.d.ts" />

/**
 * Cordova Purchase Plugin — Braintree Payments Example
 *
 * Demonstrates:
 *  - Initializing the Braintree platform with iaptic as the client token provider
 *  - Launching a payment request via the Braintree Drop-In UI
 *  - Handling payment lifecycle: initiated → approved → verified → finished
 *  - Billing address support
 */

document.addEventListener('deviceready', onDeviceReady);

function onDeviceReady() {

  const { store, Logger, Platform, LogLevel } = CdvPurchase;
  const log = new Logger({ verbosity: LogLevel.DEBUG }, 'BraintreeExample');

  // ──────────────────────────────────────────────
  // 1. Receipt validation with iaptic (configured in env.ts)
  // ──────────────────────────────────────────────
  const iaptic = new CdvPurchase.Iaptic({
    appName: ENV.iapticAppName,
    apiKey: ENV.iapticApiKey,
    url: ENV.iapticUrl,
  });
  store.validator = iaptic.validator;
  store.verbosity = LogLevel.DEBUG;
  store.applicationUsername = ENV.applicationUsername;

  // ──────────────────────────────────────────────
  // 2. Event handlers
  // ──────────────────────────────────────────────
  store.error(onStoreError);

  store.when()
    .approved(transaction => transaction.verify())
    .verified(receipt => receipt.finish())
    .finished(() => setStatus('Payment successful!'));

  // ──────────────────────────────────────────────
  // 3. Initialize with Braintree platform
  //    iaptic provides the client token automatically
  // ──────────────────────────────────────────────
  store.initialize([{
    platform: Platform.BRAINTREE,
    options: {
      clientTokenProvider: iaptic.braintreeClientTokenProvider,
      threeDSecure: {
        exemptionRequested: true,
      },
      googlePay: {
        googleMerchantName: ENV.googleMerchantName,
        countryCode: ENV.googlePayCountryCode,
        environment: ENV.googlePayEnvironment,
      }
    }
  }]);

  // ─── Payment handler ──────────────────────────

  (window as any).launchBraintreePayment = function() {
    setStatus('Select payment method...');

    // Optional: pre-fill billing address
    const billingAddress: CdvPurchase.PostalAddress = {
      givenName: 'Jane',                              // ← optional, remove or customize
      surname: 'Doe',
      streetAddress1: '123 Main St',
      locality: 'Seattle',
      region: 'WA',
      postalCode: '98101',
      countryCode: 'US',
    };

    const payment = store.requestPayment({
      platform: Platform.BRAINTREE,
      items: [{
        id: 'widget-pro',
        title: 'Widget Pro',
        pricing: { priceMicros: 1_490_000 },          // $1.49
      }, {
        id: 'gadget-plus',
        title: 'Gadget Plus',
        pricing: { priceMicros: 2_990_000 },          // $2.99
      }],
      currency: 'USD',
      description: '1× Widget Pro + 1× Gadget Plus',
      billingAddress,
    });

    payment
      .cancelled(() => setStatus(''))
      .failed(error => { alert(error.message); setStatus(''); })
      .initiated(() => setStatus('Processing payment...'))
      .approved(() => setStatus('Verifying payment...'))
      .finished(() => setStatus('Payment successful!'));
  };
}

function setStatus(message: string) {
  const el = document.getElementById('status');
  if (el) el.textContent = message;
}

function onStoreError(error: CdvPurchase.IError) {
  const el = document.getElementById('error');
  if (!el) return;
  el.textContent = `ERROR ${error.code}: ${error.message}`;
  setTimeout(() => { el.textContent = ''; }, 10000);
}
