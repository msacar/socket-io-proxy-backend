//client bir product
//proxy e bilgi taşıyor
const { io } = require("socket.io-client");
const ss = require('socket.io-stream');
const fs = require('fs')
const axios  = require("axios");
let socket = {}
const FormData = require('form-data');


const transformRequest = (jsonData = {}) =>
  Object.entries(jsonData)
        .map(x => `${encodeURIComponent(x[0])}=${encodeURIComponent(x[1])}`)
        .join('&');

module.exports = function (configData) {
    let defaults =  {
        backend:{},
        secretKey:null,
    }

    let config = {...defaults, ...configData}


    if (!config.secretKey)
        throw new Error('Publisher server key secret key is not defined')

    if (!config.server)
        throw new Error('Backend server required ')

    let backendUrl =config.server

    if (config.port && config.port.port == 443 && config.port.port == 80 )
        backendUrl +=`:${publishConfig.port.toString()}`

    axios.defaults.baseURL = backendUrl


    function publish(publishConfig){
        if (!publishConfig.server)
            throw new Error('Publisher server not defined')
        let connectUrl = `${publishConfig.server}`

        if (publishConfig.port)
            connectUrl +=`:${publishConfig.port.toString()}`


        socket = io.connect(connectUrl, {
            reconnection        : true,
            query: `secret_key=${config.secretKey}`,
            reconnectionDelay   : 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: 5,
            transports          : ['websocket']
        })

        socket.on('connect', function () {
            console.log("connected")
            ss(socket).on('request', function (data, response) {
                delete data.headers['content-length']
                data.headers['X-Real-IP'] =            data.ip;
                data.headers['X-Forwarded-For'] =      data.ip;

                console.log(`${data.method} ${data.url} ${data.ip}`)

                switch (data.method) {
                    case "GET":
                        axios
                            .get(data.url, {
                                params: transformRequest(data.query || {}),
                                headers :data.headers,
                                redirect: 'manual',
                                maxRedirects:0,
                                responseType: 'stream'
                            })
                            .then(result => {
                                let ackStream =ss.createStream();
                                 response(ackStream,{
                                     status : result.status,
                                     headers: result.headers,
                                 })
                                result.data.pipe(ackStream)
                            })
                            .catch(err => {
                                console.warn(err)
                                response(
                                    {
                                        status : err.response.status,
                                        headers: err.response.headers,
                                        content: err.response.data,
                                    }
                                )

                            })

                        break;
                    case "POST":

                        let postData = data.body
                        if (data.headers["content-type"] === "application/x-www-form-urlencoded")
                        {
                            const params = new URLSearchParams();
                            for (let key in data.body){
                                params.append(key,data.body[key])
                            }
                            postData =params;
                        }

                        axios({
                            method: 'post',
                            url: data.url,
                            params: transformRequest(Object.assign(data.query)),
                            data: postData,
                            headers:data.headers,
                            redirect: 'manual',
                            maxRedirects:0
                        })
                            .then(result => {
                                let ackStream =ss.createStream();
                                response(ackStream,{
                                    status : result.status,
                                    headers: result.headers,
                                })
                                result.data.pipe(ackStream)
                                //
                                // response({
                                //     status : result.status,
                                //     headers: result.headers,
                                //     content: result.data,
                                // })
                            })
                            .catch(err => {
                                let ackStream =ss.createStream();
                                response({
                                    status : err.response ? err.response.status :null, 
                                    headers: err.response ? err.response.headers :null, 
                                    content: err.response ? err.response.data :null, 
                                })
                                // result.data.pipe(ackStream)
                                return
                                console.warn(err)
                                response(
                                    {
                                        status : err.response.status,
                                        headers: err.response.headers,
                                        content: err.response.data,
                                    }
                                )
                            })
                        break;

                }

            })

            socket.on("disconnect", (reason) => {
                console.warn(reason)
            });

        });

        return socket
    }

    return {
        publish
    }
}



