const NET = require('net');
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
    console.log("Sending: " + hexString);
    return Buffer.from(hexString, 'hex');
}

//NOSONAR
// const _wakeClient = new NET.Socket();
// function wakeUpLights(){
//     _wakeClient.connect({port: 5577, host: "192.168.1.2"}, () => {
//         _wakeClient.write(generateSendableHex(0,0,0), ()=>{
//             _wakeClient.write(generateSendableHex(1,1,1), ()=>{
//                 _wakeClient.write(generateSendableHex(0,0,0), ()=>{
//                     _wakeClient.end();
//                 });
//             });
//         });
//     });
// }

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

lightClient.on("data", (_data) => {
    console.log("Receiving: " + _data);
    //NOSONAR
    // if(data.startsWith("81")) {
    //     let rString = data[12] + data[13];
    //     let gString = data[14] + data[15];
    //     let bString = data[16] + data[17];
    //     originalColorBuffer = [parseInt(rString), parseInt(gString), parseInt(bString)];
    //     console.log("Light Comms RX: " + originalColorBuffer);
    // }
});

lightClient.connected = false;
lightClient.on("connect", (_data)=>{
    console.log("TCP Connected");
    lightClient.connected = true;
});
lightClient.on("close", (_data)=>{
    console.log("TCP Closed");
    lightClient.connected = false;
});
lightClient.on("error", (err)=>{
    console.log("Error:");
    console.log(err);
});

/*
* Standard Node setup
*/

app.use(EXPRESS.static('public'));

app.get('/', function(_req, res) {
    //NOSONAR
    // wakeUpLights();
    res.sendFile(__dirname + "/src/pages/index.html");
});

app.get("/connectsocket", function(_req, res) {
    console.log("/connectsocket: " + _req.ip);
    if(!lightClient.connected)
        lightClient.connect({port: 5577, host: "192.168.1.2"}, ()=>{res.send('');});
    else
        res.send('');
});
app.get("/disconnectsocket", function(_req, res) {
    console.log("/disconnectsocket: " + _req.ip);
    if(lightClient.connected)
        lightClient.end(()=>{res.send('');});
    else
        res.send('');
});
app.get("/ylw", function(_req, res) {
    console.log("/ylw: " + _req.ip);
    function turnYellow() {
        lightClient.write(generateSendableHex(231, 228, 45), ()=>{
            res.send('');
        });
    }
    if(lightClient.connected){
        turnYellow();
    } else {
        lightClient.connect({port: 5577, host: "192.168.1.2"}, turnYellow);
    }
});
app.get("/red", function(_req, res) {
    console.log("/red: " + _req.ip);
    function turnRed() {
        lightClient.write(generateSendableHex(218, 5, 5), ()=>{
            res.send('');
        });
    }
    if(lightClient.connected){
        turnRed();
    } else {
        lightClient.connect({port: 5577, host: "192.168.1.2"}, turnRed);
    }
});
app.get("/blu", function(_req, res) {
    console.log("/blu: " + _req.ip);
    function turnBlue() {
        lightClient.write(generateSendableHex(56, 67, 220), ()=>{
            res.send('');
        });
    }
    if(lightClient.connected){
        turnBlue();
    } else {
        lightClient.connect({port: 5577, host: "192.168.1.2"}, turnBlue);
    }
});
app.get("/off", function(_req, res) {
    console.log("/off: " + _req.ip);
    function turnOff() {
        lightClient.once('data', (_data)=>{
            res.send('');
        });
        lightClient.write(Buffer.from("71240fa4", "hex"));
        console.log("Sending: 71240fa4");
    }
    if(lightClient.connected) {
        turnOff();
    } else {
        lightClient.connect({port: 5577, host: "192.168.1.2"}, turnOff);
    }
});
app.get("/on", function(_req, res) {
    console.log("/on: " + _req.ip);
    function turnOn() {
        lightClient.once('data', (_data)=>{
            res.send('');
        });
        lightClient.write(Buffer.from("71230fa3", "hex"));
        console.log("Sending: 71230fa3");
    }
    if(lightClient.connected) {
        turnOn();
    } else {
        lightClient.connect({port: 5577, host: "192.168.1.2"}, turnOn);
    }
});

app.listen(port, function() {
  console.log(`Example app listening on port ${port}!`)
});
