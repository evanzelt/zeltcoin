//import express
const express = require("express")
const app = express()
const port = 5500

//import express addons
const bodyParser = require("body-parser")
const pug = require("pug")

//import blockchain classes
let {Transaction, Block, Blockchain} = require("./blockchain")
let {generateKeys, signMessage, verifySignature} = require ("./ec")

let zeltCoin = new Blockchain()

//set app params
app.use(bodyParser.json())
app.set('view engine', 'pug')

//get local ext. ip
var address, ifaces = require('os').networkInterfaces();
for (var dev in ifaces) {
    ifaces[dev].filter((details) => details.family === 'IPv4' && details.internal === false ? address = details.address: undefined);
}

app.use(express.static('src/build'))

app.get("/", (req, res) => {
    res.send(`Blockchain Node hosted at ${address}`)
})

app.get("/chain", (req, res) => {
    res.send(zeltCoin.chain)
})

app.post("/makeTransaction", (req, res) => {

    let reqJSON = req.body
    
    let transaction =  new Transaction(reqJSON["sender"], reqJSON["recipient"], reqJSON["amount"], reqJSON['signature'])

    if(transaction.isValid() && zeltCoin.addTransaction(transaction)) {
        res.send("Your transaction has been added to the mempool.")

        return
    }


    res.status(400).send("Invalid Transaction Request")

})

app.get("/mine", (req, res) => {
    zeltCoin.mine('031a87d27158955effe3bd4e9ef7d63a8210397709dbdf444eb5107006a63310ea')
    res.render('mine', {ip: address})
})

app.get("/balances", (req, res) => {
    res.send(JSON.stringify(zeltCoin.getBalances()))
})

app.get("/send", (req, res) => {
    res.render('send')
})

app.get("/chainValidity", (req, res) => {
    res.send(zeltCoin.isValidChain(zeltCoin.chain))
})

app.get("/peers", (req, res) => {
    res.send(zeltCoin.peers)
})

app.post("/addPeer", (req, res) => {
    let peer = req.body["peer"]
    zeltCoin.addPeer(peer)
})

app.get("/managePeers", (req, res) => {
    res.render("managePeers")
})

app.get("/generate", (req, res) => {
    res.render('generate')
})


app.listen(port, () => {
    console.log(`Listening on port ${port}`)
})