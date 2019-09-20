document.addEventListener('deviceready', onDeviceReady);

function onDeviceReady() {

    // We should first register all our products or we cannot use them in the app.
    store.register([{
        id:    'subscription1',
        type:   store.PAID_SUBSCRIPTION,
    }, {
        id:    'nonconsumable1',
        type:   store.NON_CONSUMABLE,
    }, {
        id:    'consumable1',
        type:   store.CONSUMABLE,
    }, {
        id:    'consumable2',
        type:   store.CONSUMABLE,
    }, {
        id:    'subscription2',
        type:   store.PAID_SUBSCRIPTION,
    }]);
    store.verbosity = store.DEBUG;

    // For subscriptions and secured transactions, we setup a receipt validator.
    store.validator = "https://reeceipt-validator.fovea.cc/v1/validate?appName=test&apiKey=13d71c00-e703-49d0-b354-3d989bbfe865";

    // Show errors on the dedicated Div.
    store.error(function(error) {
      document.getElementById('error').textContent = `ERROR ${error.code}: ${error.message}`;
      setTimeout(() => {
        document.getElementById('error').innerHTML = '<br/>';
      }, 10000);
      if (error.code === store.ERR_LOAD_RECEIPTS) {
        // Cannot load receipt, ask user to refresh purchases.
        setTimeout(() => {
          alert('Cannot access purchase information. Use "Refresh" to try again.');
        }, 1);
      }
    });

    // Define events handler for our subscription products
    store.when()
         .updated(renderUI)          // render the interface on updates
         .approved(p => p.verify())   // verify approved transactions
         .verified(p => p.finish());  // finish verified transactions

    // Load informations about products and purchases
    store.refresh();

    // Updates the user interface to reflect the initial state
    renderUI();
}

// Perform a full render of the user interface
function renderUI() {

    // When either of our susbscription products is owned, display "Subscribed".
    // If one of them is being purchased or validated, display "Processing".
    // In all other cases, display "Not Subscribed".
    if (haveState('owned'))
        document.getElementById('status').textContent = 'Subscribed';
    else if (haveState('approved') || haveState('initiated'))
        document.getElementById('status').textContent = 'Processing...';
    else
        document.getElementById('status').textContent = 'Not Subscribed';

    document.getElementById('products').innerHTML =
        store.products
            .map(product => `<div id="${product.alias || product.id}-purchase" style="margin-top: 30px">...</div>`)
            .join('');

    // Render the products' DOM elements
    store.products.forEach(p => renderProductUI(p.alias || p.id));

    // Does any our product has the given state?
    function haveState(value) {
        return getState('subscription1') === value || getState('subscription2') === value;

        function getState(id) {
            return store.get(id) ? store.get(id).state : '';
        }
    }

    // Refresh the displayed details about a product in the DOM
    function renderProductUI(productId) {

        const el = document.getElementById(`${productId}-purchase`);
        if (!el) {
          console.error(`HTML element ${productId}-purchase does not exists`);
          return;
        }

        // Retrieve the product in the store and make sure it exists
        const product = store.get(productId);
        if (!product) {
          el.innerHTML = 'product not found';
          return;
        }

        function strikeIf(when) { return when ? '<strike>' : ''; }
        function strikeEnd(when) { return when ? '</strike>' : ''; }

        // Create and update the HTML content
        const info = product.loaded
            ? `title:  ${ product.title       || '' }<br/>` +
              `desc:   ${ product.description || '' }<br/>` +
              `price:  ${ product.price       || '' }<br/>` +
              `state:  ${ product.state       || '' }<br/>`
            : '';
        const introPrice = product.loaded && product.type === store.PAID_SUBSCRIPTION && product.introPrice
            ? `intro:  ${ strikeIf(product.ineligibleForIntroPrice) }${ product.introPrice || '' } for ${ product.introPricePeriod || '' } ${ product.introPricePeriodUnit || '' } (${ product.introPricePaymentMode || '' })${ strikeEnd(product.ineligibleForIntroPrice) }<br/>`
            : '';
        const discounts = product.discounts && product.discounts.map(discount =>
              `discount: ${ strikeIf(!discount.eligible) }${ discount.type } ${ discount.paymentMode }` +
              ` - ${ discount.price } for ${ discount.period } ${ discount.periodUnit }${ strikeEnd(!discount.eligible) }<br/>`).join('') || '';
        const subInfo = product.loaded && product.type === store.PAID_SUBSCRIPTION
            ? `per:    ${ product.billingPeriod || '' } ${ product.billingPeriodUnit || '' }<br/>` +
              (product.expiryDate ? `expiry: ${ product.expiryDate.toString() || '' }<br/>` : '') +
              (product.renewalIntent ? `intent: ${ product.renewalIntent}<br/>` : '') +
              (product.group ? `group:  ${ product.group }<br />` : '')
            : '';
        const button = product.canPurchase
            ? `<button style="margin:20px 0" onclick="store.order('${product.id}', {applicationUsername: 'hellokitty'})">Buy Now!</button>`
            : '';
        el.innerHTML = info + introPrice + discounts + subInfo + button;
    }
}

