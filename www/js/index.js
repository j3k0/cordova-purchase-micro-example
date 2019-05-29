document.addEventListener('deviceready', onDeviceReady);

function onDeviceReady() {

    // We should first register all our products or we cannot use them in the app.
    store.register([{
        id:    'nonconsumable1',
        type:   store.NON_CONSUMABLE,
    }]);
    store.verbosity = store.DEBUG;

    // For secured transactions, we setup a receipt validator.
    store.validator = "https://reeceipt-validator.fovea.cc/v1/validate?appName=test&apiKey=13d71c00-e703-49d0-b354-3d989bbfe865";

    // Show errors on the dedicated Div.
    store.error(function(error) {
      document.getElementById('error').textContent = `ERROR ${error.code}: ${error.message}`;
      setTimeout(() => {
        document.getElementById('error').innerHTML = '<br/>';
      }, 10000);
    });

    // Define events handler for our subscription products
    store.when('product')
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

    // When either of our products is owned, display "Full Version Unlocked".
    // If it is being purchased or validated, display "Processing".
    // In all other cases, display "Free Version".
    if (haveState('owned'))
        document.getElementById('status').textContent = 'Full Version Unlocked';
    else if (haveState('approved') || haveState('initiated'))
        document.getElementById('status').textContent = 'Processing...';
    else
        document.getElementById('status').textContent = 'Free Version';

    // Render the products' DOM elements
    renderProductUI('nonconsumable1');

    // Does any our product has the given state?
    function haveState(value) {
        return store.get('nonconsumable1') && store.get('nonconsumable1').state === value;
    }

    // Refresh the displayed details about a product in the DOM
    function renderProductUI(productId) {

        // Retrieve the product in the store and make sure it exists
        const product = store.get(productId);
        if (!product) return;

        // Create and update the HTML content
        const info = product.loaded
            ? `title:  ${ product.title       || '' }<br/>` +
              `desc:   ${ product.description || '' }<br/>` +
              `price:  ${ product.price       || '' }<br/>` +
              `state:  ${ product.state       || '' }<br/>` +
            : `...`;
        const button = product.canPurchase
            ? `<button style="margin:20px 0" onclick="store.order('${product.id}')">Buy Now!</button>`
            : '';
        document.getElementById(`${productId}-purchase`).innerHTML = info + button;
    }
}

