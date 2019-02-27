document.addEventListener('deviceready', onDeviceReady);

function onDeviceReady() {
  store.when('cc.fovea.purchase.consumable1')
    .updated(refreshUI)
    .approved(finishPurchase);
  store.register({type: store.CONSUMABLE, id: 'cc.fovea.purchase.consumable1'});
  store.refresh();
}

function finishPurchase(p) {
  localStorage.goldCoins = (localStorage.goldCoins | 0) + 10;
  p.finish();
}

function refreshUI() {
  const product = store.get('cc.fovea.purchase.consumable1');
  const button = `<button onclick="store.order('cc.fovea.purchase.consumable1')">Purchase</button>`;

  document.getElementsByTagName('body')[0].innerHTML = `
  <div>
  <pre>
  Gold: ${localStorage.goldCoins | 0}

  Product.state: ${product.state}
  .title: ${product.title}
  .descr: ${product.description}
  .price: ${product.price}

  </pre>
  ${product.canPurchase ? button : ''}
  </div>`;
}
