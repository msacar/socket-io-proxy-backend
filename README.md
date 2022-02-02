# socket-io-proxy-localhost

## Features
Helps developers to reverse proxy their localhost via socket.io on on aws, heroku or any server can run node.js
Uses socket.io to make a one way reverse proxy
## Requirements
- a Node.js server installed with [Reverse proxy server](https://github.com/msacar/socket-io-reverse-proxy-server) (any server can run node.js which is going to be our publicly reachable server)
- a [Localhost proxy client](https://github.com/msacar/socket-io-proxy-localhost) (which is make a connection from localhost to proxy server and serve our localhost)

This project depends on  [Reverse proxy server](https://github.com/msacar/socket-io-reverse-proxy-server)
## How to use

Sample Localhost Server Code:

```js
const proxyBackend  = require('socket-io-reverse-proxy-client')
const proxyBackendClient =  proxyBackend({
    //its your localhost
    server :"http://localhost",//its default
    port : 80, //its default
    //secret key for authentication with proxy publisher server
    secretKey: "very_secret_key",
})

//Publish localhost to cloud
proxyBackendClient.publish({
    //its your aws server
    server : "http://ec2-3-120-246-199.eu-central-1.compute.amazonaws.com/",
    port : 80  //its default
})
```
Sample Publisher Server Code:

```js
const proxyServer  = require('msacar/socket-io-proxy-publisher')
const proxyPublisherServer = proxyServer({
    secretKey:"very_secret_key"
})

proxyPublisherServer.listen(80,(e)=>{
    console.log("Proxy Publisher server running and waiting for localhost's connection.")
})
```


## Installation

```bash
// with npm
npm install socket-io-proxy-localhost

```

## License

[MIT](LICENSE)