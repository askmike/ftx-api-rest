const FTXRest = require('./');

const ftx = new FTXRest({
  key: 'x',
  secret: 'y',
  subaccount: 'z'
})

ftx.request({
  method: 'GET',
  path: '/account'
}).then(console.log);