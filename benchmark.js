const FTX = require('./');
const now = require('performance-now');

// fake keys with real key lengths
const key = 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
const secret = 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
const subaccunt = 'arthurhayes';

var ftx = new FTX({
  key,
  secret,
  subaccount
});


const test = () => {
  const start = now();
  const d = bm.createDraft({
    method: 'POST',
    path: '/orders', 
    data: {
      market: 'BTC-PERP',
      size: 100 + i,
      side: 'sell',
      order_type: 'Limit',
      price: 10000 - i,
    }
  });
  console.log('drafting took', (now() - start).toFixed(5), 'ms');
}

let i = 0;
const limit = 30;
const loop = setInterval(() => {
  if(i++ > limit) {
    return clearInterval(loop);
  }

  setTimeout(test, 100);
}, 200);