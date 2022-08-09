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
    console.log(hexString);
    return Buffer.from(hexString, 'hex');
}

//NOSONAR
// var originalColorBuffer = [-1,-1,-1]; //Defaulted to -1. When -1, this means buffer is "empty".
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
    //NOSONAR
    // if(data.startsWith("81")) {
    //     let rString = data[12] + data[13];
    //     let gString = data[14] + data[15];
    //     let bString = data[16] + data[17];
    //     originalColorBuffer = [parseInt(rString), parseInt(gString), parseInt(bString)];
    //     console.log("Light Comms RX: " + originalColorBuffer);
    // }
});

lightClient.on("close", (_data)=>{
    console.log("TCP Closed");
    //NOSONAR
    // lightClient.connect({port: 5577, host: "192.168.1.2"}, () => {
    //     console.log('TCP connection established with the server.');
    // });
});

/*
* Standard Node setup
*/

app.use(EXPRESS.static('public'));

app.get('/', function(_req, res) {
    res.sendFile(__dirname + "/src/pages/index.html");
});

app.get("/ylw", function(_req, res) {
    res.send('');
    lightClient.connect({port: 5577, host: "192.168.1.2"}, () => {
        lightClient.write(generateSendableHex(231, 228, 45));
        lightClient.end();
    });
});
app.get("/red", function(_req, res) {
    res.send('');
    lightClient.connect({port: 5577, host: "192.168.1.2"}, () => {
        lightClient.write(generateSendableHex(218, 5, 5));
        lightClient.end();
    });
});
app.get("/blu", function(_req, res) {
    res.send('');
    lightClient.connect({port: 5577, host: "192.168.1.2"}, () => {
        lightClient.write(generateSendableHex(56, 67, 220));
        lightClient.end();
    });
});
app.get("/off", function(_req, res) {
    res.send('');
    lightClient.connect({port: 5577, host: "192.168.1.2"}, () => {
        lightClient.write(generateSendableHex(0,0,0));
        lightClient.end();
    });
});
//NOSONAR
// app.get("/status", function(_req, res) {
//     attemptReloadStatus();
//     setTimeout(()=>{res.send(originalColorBuffer);}, 100);
// });

app.listen(port, function() {
  console.log(`Example app listening on port ${port}!`)
});
