document.addEventListener('deviceready', onDeviceReady);

function onDeviceReady() {

    // We should first register all our products or we cannot use them in the app.
    store.register([{
        alias: 's1',
        id:    'cc.fovea.purchase.subscription1',
        type:   store.PAID_SUBSCRIPTION,
    }, {
        alias: 's2',
        id:    'cc.fovea.purchase.subscription2',
        type:   store.PAID_SUBSCRIPTION,
    }]);

    // For subscriptions and secured transactions, we setup a receipt validator.
    store.validator = "https://devbox-reeceipt-validator.fovea.cc/v1/validate?appName=test&apiKey=13d71c00-e703-49d0-b354-3d989bbfe865";

    // Show errors on the dedicated Div.
    store.error(function(error) {
      document.getElementById('error').textContent = `ERROR ${error.code}: ${error.message}`;
      setTimeout(() => {
        document.getElementById('error').innerHTML = '<br/>';
      }, 10000);
    });

    // Define events handler for our subscription products
    store.when('subscription')
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

    // Render the products' DOM elements "s1-purchase" and "s2-purchase"
    renderProductUI('s1');
    renderProductUI('s2');

    // Does any our product has the given state?
    function haveState(value) {
        return getState('s2') === value || getState('s1') === value;

        function getState(id) {
            return store.get(id) ? store.get(id).state : '';
        }
    }

    // Refresh the displayed details about a product in the DOM
    function renderProductUI(alias) {

        // Retrieve the product in the store and make sure it exists
        const product = store.get(alias);
        if (!product) return;

        // Create and update the HTML content
        const info = product.loaded
            ? `title:      ${ product.title       || '' }<br/>` +
              `desc:       ${ product.description || '' }<br/>` +
              `price:      ${ product.price       || '' }<br/>` +
              `state:      ${ product.state       || '' }<br/>` +
              `expiry:     ${ product.expiryDate  || '' }<br/>`
            : `...`;
        const button = product.canPurchase
            ? `<button style="margin:20px 0" onclick="store.order('${product.id}')">Buy Now!</button>`
            : '';
        document.getElementById(`${alias}-purchase`).innerHTML = info + button;
    }
}

