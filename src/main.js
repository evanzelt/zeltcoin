//import express
const express = require("express")
const app = express()
const port = 5500

//import express addons
const bodyParser = require("body-parser")
const pug = require("pug")

//import blockchain classes
let {Peer, Transaction, Block, Blockchain} = require("./blockchain")
let {generateKeys, signMessage, verifySignature} = require ("./ec")

//get local ext. ip and initialize blockchain
let zeltCoin
const getIP = require('external-ip')();
getIP((err, ip) => {
    if (err) throw err

    zeltCoin = new Blockchain(ip)
})

//set app params
app.use(bodyParser.json())
app.set('view engine', 'pug')
 
app.use(express.static('src/build'))
 
app.get("/", (req, res) => {
    res.send(`Blockchain Node hosted at ${zeltCoin.localPeer.address}`)
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
    res.send(zeltCoin.peers.map(x => x.address))
})

app.post("/addPeer", (req, res) => {
    let peer = Peer.parse(req.body)
    console.log(peer)
    zeltCoin.addPeer(peer)
    res.send(zeltCoin.peers)
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