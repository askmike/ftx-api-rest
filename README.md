# ftx-api-rest

    npm install ftx-api-rest

API wrapper for the [FTX REST API](https://docs.ftx.com/#rest-api). Please refer to [their documentation](https://docs.ftx.com/#rest-api) for all calls explained. Check out `sample.js` for lib usage.

This is a low level wrapper with zero dependencies focussed on speed:

- Disables Nagle's algorithm
- No complex code
- No third party libraries
- Allows you to pre compile your message (see below under low latency usage)\
- Supports keep-alive

This is a fork based of my bitmex library: https://github.com/askmike/bitmex-simple-rest

Used by my low(ish) latency arb system that's running in production. I don't think you can go much faster in nodejs without rewriting [Node.js' core http library](https://nodejs.org/api/http.html#http_http_request_options_callback) (if you think you can, feel free to open an issue or propose a PR).

## Usage

See sample.js.

### Low latency usage

Sending an API request to FTX requires hashing the payload with your API key. **In nodejs, this process can easily take 0.15 millisecond** (on the non compute optimized AWS boxes I tested this on - because yes, you should run in AWS ap-northeast-1 if you want to trade fast on FTX). You can test the speed of creating API requests yourself on your system by running `benchmark.js`, preferably with real keys and and a request similar to what your system might send.

This library allows you to prepare an API request draft before hand (doing all the heavy work). The microsecond you realize you actually want to send it you simply send the draft you created previously:

    // create the draft before hand
    const draft = ftx.createDraft({
      method: 'GET',
      path: '/account'
    });

    // later when you actually want to send
    const data = await ftx.requestDraft(draft);

Note that this only works in scenarios where you can estimate what will happen or which scenarios might happen: You can create drafts for all of them and only end up sending one later.

## TODO

- Figure out if we can reliably skip the `end` event of the packetstream (see requestDraft comment).
- String compare for common errors (overload), skipping `JSON.parse`.

## Final

If this library is helping you trade better on FTX feel free to use [my ref link](https://ftx.com/#a=1275753).