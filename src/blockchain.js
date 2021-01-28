const sha3 = require('js-sha3');
const {verifySignature} = require("./ec")
const fetch = require('node-fetch');

class Peer { 
    constructor(address) { 
        this.address = address
    }

    static parse(json) {
        if(json["address"]) { 
            return new Peer(json["address"])
        }
        else {
            return null
        }
    }

    isValid() {
        return fetch("http://" + this.address + ":5500/chain")
                .then(response => response.json())
                .then((res) => {
                    return true
                })
                .catch(() => {
                    return false;
                })
    }

    getPeers() {
        return fetch("http://" + this.address + ":5500/peers")
                .then(response => response.json())
                .then(peers => {
                    return peers
                })
                .catch(()=>{
                    return false;
                })
    }

    getChain() {
        return fetch("http://" + this.address + ":5500/chain")
                .then(response => response.json())
                .then(chain => {
                    return chain
                })
                .catch(()=>{
                    return false;
                })
    }

    addPeer(peer) {
        fetch("http://" + this.address + ":5500/addPeer", {
                method: "POST",
                headers: {
                    'Content-Type' : "application/json"
                },
                body: JSON.stringify(peer),
            })
            .then(res => res.json())
            .then(peerList => {})
    }
}

class Transaction { 
    constructor(sender, recipient, amount, signature=null) { 
        this.sender = sender
        this.recipient = recipient
        this.amount = amount
        this.time = Date.now()
        this.signature = signature
    }

    json() { 
        return {
            "sender" : this.sender,
            "recipient" : this.recipient,
            "amount" : this.amount,
            "time" : this.time
        }
    }

    isValid() {

        if (!this.sender || !this.recipient || !this.amount) {
            return false
        }

        if(this.sender.length != 66 || this.recipient.length != 66 || isNaN(this.amount)) { 
            return false
        }

        if(this.sender == this.recipient) { 
            return false
        }

        let validSignature = false

        try {
            validSignature = verifySignature(JSON.stringify(this.json()), this.signature, this.sender)
        }
        catch { 
            validSignature = false
        }

        return validSignature
         
    }
}

class Block { 
    constructor(nonce, previousHash=null) { 
        this.height = 0
        this.difficulty = 4
        this.time = Date.now()
        this.transactions = []
        this.previousHash = previousHash
        this.nonce = nonce
    }
    
    json() {
        let jsonB = {
            "height" : this.height,
            "difficulty" : this.difficulty,
            "time" : this.time,
            "transactions" : this.transactions,
            "previousHash" : this.previousHash,
            "nonce" : this.nonce
        }

        return jsonB
    }

    hash(){
        let json = JSON.stringify(this.json())
        return sha3.sha3_256(json)
    }

    proofOfWork(x) {
        return sha3.sha3_256(this.hash().toString() + this.nonce.toString()).substring(0, this.difficulty) == ("0".repeat(this.difficulty))
    }
}

class Blockchain { 
    constructor(address) { 
        this.chain = []
        this.pendingTransactions = []
        this.difficulty = 4
        this.peers = []
        this.pendingPeers = []
        this.localPeer = new Peer("192.168.1.180")

        //Genesis Block
        let genesisBlock = new Block(100, 1)
        this.addBlock(genesisBlock)


        //Add known peer
        this.addPeer(new Peer("192.168.1.236"))
        
        
    }

    shareBlock(peer) {
        fetch("http://" + peer + "")
    }

    addBlock(block) {
        this.chain.push(block)
    }

    lastBlock() {
        return this.chain[this.chain.length-1]
    }
    
    //Adds a transaction to the pending transactions
    addTransaction(transaction) { 

        let balances = this.getPendingBalances()
        let senderBalance = balances.filter((e) => {return e.account = transaction.sender})[0]

        if(!senderBalance || senderBalance.amount < transaction.amount) {
            return false
        }


        this.pendingTransactions.push(transaction.json())

        return true
    }

    //Returns list containing addresses and balance based on previous transactions
    getBalances() { 

        let balances = []

        for(let block in this.chain) { 
            for(let transaction in this.chain[block].transactions){

                transaction = this.chain[block].transactions[transaction]


                if(transaction.sender != "0") {
                    let senderAccount = balances.filter((e) => {return e.account == transaction.sender})[0]

                    if(senderAccount) {
                        senderAccount.amount -= transaction.amount
                    } 
                    
                    else {
                        balances.push({account: transaction.sender, amount: -transaction.amount})
                    }
                }

                let recipientAccount = balances.filter((e) => {return e.account == transaction.recipient})[0]

                if(recipientAccount) {
                    recipientAccount.amount -= -transaction.amount
                } 
                
                else {
                    balances.push({account: transaction.recipient, amount: Number(transaction.amount)})
                }
            }
        }

        return balances
    }

    getPendingBalances() { 

        let balances = this.getBalances()

        for(let transaction in this.pendingTransactions) { 

            transaction = this.pendingTransactions[transaction]

            let senderAccount = balances.filter((e) => {return e.account == transaction.sender})[0]

            if(senderAccount) {
                senderAccount.amount -= transaction.amount
            } 
            
            else {
                balances.push({account: transaction.sender, amount: -transaction.amount})
            }


            let recipientAccount = balances.filter((e) => {return e.account == transaction.recipient})[0]

            if(recipientAccount) {
                recipientAccount.amount -= -transaction.amount
            } 
            
            else {
                balances.push({account: transaction.recipient, amount: transaction.amount})
            }

        }

        return balances
    }

    //mines latest block of a given chain TODO: Add consensus for mining difficulty (Currently fixed)
    mine(address) {

        let newBlock = new Block(1, this.lastBlock().hash())

        //Mining reward transaction
        newBlock.transactions.push(new Transaction("0", address, 10))

        this.pendingTransactions.forEach((e) => {
            newBlock.transactions.push(e)
        })

        newBlock.height = this.chain.length
        newBlock.difficulty = this.difficulty

        while(true) { 
                    
            //"newBlock.nonce" is an incrementing number
            if(newBlock.proofOfWork(newBlock.nonce)) {

                console.log("New Block Found! Adding it to the Blockchain.")


                this.addBlock(newBlock)
                this.pendingTransactions = []
                return newBlock
            }

            newBlock.nonce++
        }
    }

    //checks requirements for a given chain
    isValidChain(chain) { 
        for(let x=0; x<chain.length; x++) { 
            
            let block = chain[x]
            let previousBlock = chain[x-1]

            if(x > 0) { 
                //check hash lineage
                if(previousBlock.hash() != block.previousHash) {
                    console.log("Wrong hash at block: " + x)
                    return false
                }

                //check proof of work lineage
                if(!block.proofOfWork(block.nonce)) { 
                    console.log("Wrong proof at block: " + x)
                    return false
                }
            }
            
        }

        return true;
    }

    //replaces current chain if requirements for new are met 
    receiveChain(newChain, peer) {
        if(this.isValidChain(newChain) && newChain.length > this.chain.length) { 
            this.chain = newChain
            console.log("Received new chain from " + peer)
        }
    }

    //Parses json of chain into an object list
    parseChain(chain) { 

        let parsedChain = []
        for(let block in chain) { 

            block = chain[block]

            let parsedBlock = new Block(block.nonce, block.transactions)
            parsedBlock.height = block.height
            parsedBlock.difficulty = block.difficulty
            parsedBlock.time = block.time
            parsedBlock.transactions = block.transactions
            parsedBlock.previousHash = block.previousHash
            parsedChain.push(parsedBlock)
        }

        

        return(parsedChain)
    }

    //adds valid peers and resolves conflicts with them
    addPeer(peer) { 
        console.log("Attempting to add peer: " + peer.address)
        if(this.peers.indexOf(peer) == -1 && this.pendingPeers.indexOf(peer) == -1) { 
            this.pendingPeers.push(peer)
            peer.isValid()
                .then(valid => {
                    if (valid) {
                        this.peers.push(peer)
                        this.resolvePeer(peer)
                        peer.addPeer(this.localPeer)
                    }   
                    else {
                        console.log(this.peers)
                        console.log("Could not find peer: " + peer.address)
                        this.peers.splice(this.peers.indexOf(peer), 1)
                    }

                    this.pendingPeers.splice(this.pendingPeers.indexOf(peer), 1)
                })
        }
    }

    //resolves peer and chain conflicts with a given peer
    resolvePeer(peer) { 
        peer.getPeers()
            .then(peers => {
                if(peers) {
                    //Add all known peers from peer to current peers
                    peers.forEach(x => this.addPeer(new Peer(x)))
                }
            })

        peer.getChain()
            .then(chain => {
                if(chain) {
                    chain = this.parseChain(chain)
                    this.receiveChain(chain, peer)
                }
                else {
                    console.log("Could not locate chain at peer: " + peer.address)
                    this.peers.splice(this.peers.indexOf(e), 1)
                }
            })
    }
}

exports.Peer = Peer
exports.Transaction = Transaction
exports.Block = Block
exports.Blockchain = Blockchain