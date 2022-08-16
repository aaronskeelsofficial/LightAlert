const NET = require('net');
const GEOIP = require('geoip-lite');
const EXPRESS = require('express');
const app = EXPRESS();
const port = 3001;

/*
* Setup comms with lights and light util funcs
*/

function calcChecksum(hexString) {
    let sum = 0;
    let charBuffer = '';
    hexString.split('').forEach((char) => {
        if(charBuffer == ''){
            charBuffer = char;
        }else{
            sum += parseInt(Number("0x" + charBuffer + char), 10);
            charBuffer = '';
        }
    });
    return sum % 256;
}

function generateSendableHex(r, g, b){
    let rString = r.toString(16);
    rString = rString.length > 1 ? rString : "0" + rString;
    let gString = g.toString(16);
    gString = gString.length > 1 ? gString : "0" + gString;
    let bString = b.toString(16);
    bString = bString.length > 1 ? bString : "0" + bString;
    //Preformatted numbers yield solid colors don't question it
    let hexString = "31" + rString + gString + bString + "00000f";
    hexString = hexString + calcChecksum(hexString).toString(16);
    return Buffer.from(hexString, 'hex');
}

const _wakeClient = new NET.Socket();
function wakeUpLights(){
    _wakeClient.connect({port: 5577, host: "192.168.1.2"}, () => {
        _wakeClient.write(generateSendableHex(0,0,0), ()=>{
            _wakeClient.write(generateSendableHex(1,1,1), ()=>{
                _wakeClient.write(generateSendableHex(0,0,0), ()=>{
                    _wakeClient.end();
                });
            });
        });
    });
}

//NOSONAR
// let originalColorBuffer = [-1,-1,-1]; //Defaulted to -1. When -1, this means buffer is "empty".
// function attemptReloadStatus() {
//     //This function "attempts" because an original color may already be in buffer and waiting to be replaced
//     if(originalColorBuffer && originalColorBuffer[0] != -1){
//         //Do Nothing
//     } else {
//         lightClient.write(Buffer.from("818a8b96", "hex"));
//     }
// }

const lightClient = new NET.Socket();
lightClient.setEncoding('hex');
lightClient.connected = false;

lightClient.on("data", (_data) => {
    //NOSONAR
    // if(data.startsWith("81")) {
    //     let rString = data[12] + data[13];
    //     let gString = data[14] + data[15];
    //     let bString = data[16] + data[17];
    //     originalColorBuffer = [parseInt(rString), parseInt(gString), parseInt(bString)];
    //     console.log("Light Comms RX: " + originalColorBuffer);
    // }
});

function connectSocket(cb) {
    if(!lightClient.connected) {
        lightClient.connect({port: 5577, host: "192.168.1.2"}, ()=>{
            lightClient.connected = true;
            if (cb)
                cb();
        });
    } else {
        if (cb)
            cb();
    }
}
function disconnectSocket(cb) {
    if(lightClient.connected) {
        lightClient.end(()=>{
            lightClient.connected = false;
            if (cb)
                cb();
        });
    } else {
        if (cb)
            cb();
    }
}
lightClient.on("connect", (_data)=>{
    lightClient.connected = true;
    console.log("TCP Connected");
});
lightClient.on("close", (_data)=>{
    lightClient.connected = false;
    console.log("TCP Closed");
});
lightClient.on("error", (err)=>{
    console.log("Error:");
    console.log(err);
    lightClient.end(()=>{connectSocket();});
});

/*
* Standard Node setup
*/

app.use(EXPRESS.static('public'));
function logVisit(url, req){
    let reqIP = req.socket.remoteAddress.replace("::ffff:","");
    let user;
    if (reqIP == "127.0.0.1") { //Localhost
        user = "Aaron";
    } else if (reqIP == "192.168.1.31") { //Desktop on wifi using internal address
        user = "Aaron";
    } else if (reqIP == "192.168.1.6") { //Cellphone on wifi using internal address
        user = "Aaron";
    } else if (reqIP == "70.93.230.244") { //Another device on wifi using external address
        user = "Aaron";
    } else {
        user = reqIP;
    }
    
    if(user != "Aaron") {
        let dateString = new Date().toLocaleString();
        console.log(url + "  :  " + user + " : " + dateString);
    }
}

app.get('/', function(req, res) {
    // wakeUpLights();
    res.sendFile(__dirname + "/src/pages/index.html");
    logVisit("/", req);
    connectSocket();
});

function startBlink(maxSteps, timeDelta, r, g ,b){
    lightClient.write(generateSendableHex(r, g, b), ()=>{
        lightClient.write(Buffer.from("71240fa4", "hex"), ()=>{
            for(let i = 0;i < maxSteps;i++) {
                setTimeout(()=>{
                  if(i%2 == 0){
                    lightClient.write(Buffer.from("71230fa3", "hex"));
                  } else {
                    lightClient.write(Buffer.from("71240fa4", "hex"));
                  }
                }, timeDelta*i);
            }
        });
    });
}
app.get("/ylw", function(req, res) {
    // Yellow: 231, 228, 45
    res.send('');
    startBlink(6, 250, 231, 228, 45);
    logVisit("/ylw", req);
});
app.get("/red", function(req, res) {
    // Red: 218, 5, 5
    res.send('');
    startBlink(16, 500, 218, 5, 5);
    logVisit("/red", req);
});
app.get("/blu", function(req, res) {
    // Blue: 56, 67, 220
    res.send('');
    startBlink(2, 6000, 56, 67, 220);
    logVisit("/blu", req);
});
app.get("/off", function(_req, res) {
    lightClient.write(generateSendableHex(0,0,0), ()=>{
        res.send('');
    });
});
app.get("/connect", function(_req, res) {
    connectSocket(()=>{res.send('');});
});
app.get("/disconnect", function(_req, res) {
    disconnectSocket(()=>{res.send('');});
});
//NOSONAR
// app.get("/status", function(_req, res) {
//     attemptReloadStatus();
//     setTimeout(()=>{res.send(originalColorBuffer);}, 100);
// });

app.listen(port, function() {
  console.log(`Example app listening on port ${port}!`)
});
