const crypto = require('crypto');
const https = require('https');
const querystring = require('querystring');

const version = require('./package.json').version;
const name = require('./package.json').name;

const USER_AGENT = `${name}@${version}`;

class FTXRest {
  constructor(config) {
    this.ua = USER_AGENT;
    this.timeout = 90 * 1000;

    this.agent = new https.Agent({
      keepAlive: true,
      timeout: 90 * 1000,
      keepAliveMsecs: 1000 * 60
    });

    if(!config) {
      return;
    }

    if(config.key && config.secret) {
      this.key = config.key;
      this.secret = config.secret;
    }

    if(config.timeout) {
      this.timeout = config.timeout;
    }

    if(config.subaccount) {
      this.subaccount = config.subaccount;
    }

    if(config.userAgent) {
      this.ua += ' | ' + config.userAgent;
    }
  }

  // this fn can easily take more than 0.15ms due to heavy crypto functions
  // if your application is _very_ latency sensitive prepare the drafts
  // before you realize you want to send them.
  createDraft({path, method, data, timeout}) {
    if(!timeout) {
      timeout = this.timeout;
    }

    path = '/api' + path;

    let payload = '';
    if(method === 'GET' && data) {
      path += '?' + querystring.stringify(data);
    } else if(method === 'DELETE') {
      // cancel order or cancel all
      path += data;
    } else if(data) {
      payload = JSON.stringify(data);
    }

    const start = +new Date;

    const signature = crypto.createHmac('sha256', this.secret)
      .update(start + method + path + payload).digest('hex');

    const options = {
      host: 'ftx.com',
      path: path,
      method,
      agent: this.agent,
      headers: {
        'User-Agent': this.ua,
        'content-type' : 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'FTX-TS': start,
        'FTX-KEY': this.key,
        'FTX-SIGN': signature
      },
      // merely passed through for requestDraft
      timeout,
      payload
    };

    if(this.subaccount) {
      options.headers['FTX-SUBACCOUNT'] = this.subaccount;
    }

    return options;
  }

  // a draft is an option object created (potentially previously) with createDraft
  requestDraft(draft) {
    return new Promise((resolve, reject) => {
      const req = https.request(draft, res => {
        res.setEncoding('utf8');
        let buffer = '';
        res.on('data', function(data) {
          // TODO: we receive this event up to ~0.6ms before the end
          // event, though if this is valid json & doesn't contain
          // an error we can return from here, since we dont care
          // about status code.
          buffer += data;
        });
        res.on('end', function() {
          if (res.statusCode >= 300) {
            let message;
            let data;

            try {
              data = JSON.parse(buffer);
              message = data
            } catch(e) {
              message = buffer;
            }

            console.error('ERROR!', res.statusCode, message);
            return reject(new Error(message));
          }

          let data;
          try {
            data = JSON.parse(buffer);
          } catch (err) {
            console.error('JSON ERROR!', buffer);
            return reject(new Error('Json error'));
          }

          resolve(data);
        });
      });

      req.on('error', err => {
        reject(err);
      });

      req.on('socket', socket => {
        if(socket.connecting) {
          socket.setNoDelay(true);
          socket.setTimeout(draft.timeout);
          socket.on('timeout', function() {
            req.abort();
          });
        }
      });

      req.end(draft.payload);
    });
  }

  // props: {path, method, data, timeout}
  request(props) {
    return this.requestDraft(this.createDraft(props));
  }
};

module.exports = FTXRest;