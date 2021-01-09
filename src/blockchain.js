const sha3 = require('js-sha3');
const {verifySignature} = require("./ec")
const fetch = require('node-fetch');

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
    constructor() { 
        this.chain = []
        this.pendingTransactions = []
        this.difficulty = 4
        this.peers = []

        //Genesis Block
        let genesisBlock = new Block(100, 1)
        this.addBlock(genesisBlock)


        //Get peer list from peers
        this.peers.forEach(e => {
            fetch("http://" + e + ":5400/peers")
            .then(response => response.json())
            .then(peerList => {
                peerList.forEach(x => this.addPeer(x))
            })
        })
        
        //Get longest chain in network
        this.peers.forEach(e => {
            fetch("http://" + e + ":5400/chain")
            .then(response => response.json())
            .then(peerChain => {
                peerChain = this.parseChain(peerChain)
                this.receiveChain(peerChain, e)
            })
        })
    }

    addBlock(block) {
        this.chain.push(block)
    }

    lastBlock() {
        return this.chain[this.chain.length-1]
    }
    
    addTransaction(transaction) { 

        let balances = this.getPendingBalances()
        let senderBalance = balances.filter((e) => {return e.account = transaction.sender})[0]

        if(!senderBalance || senderBalance.amount < transaction.amount) {
            return false
        }


        this.pendingTransactions.push(transaction.json())

        return true
    }

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

    mine(address) {

        let newBlock = new Block(1, this.lastBlock().hash())
        newBlock.transactions.push(new Transaction("0", address, 10))
        this.pendingTransactions.forEach((e) => {
            newBlock.transactions.push(e)
        })
        newBlock.height = this.chain.length
        newBlock.difficulty = this.difficulty

        while(true) { 
                    
            //Where "newBlock.nonce" is an incrementing number
            if(newBlock.proofOfWork(newBlock.nonce)) {

                console.log("New Block Found! Adding it to the Blockchain.")


                this.addBlock(newBlock)
                this.pendingTransactions = []
                return newBlock
            }

            newBlock.nonce++
        }
    }

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

    receiveChain(newChain, peer) {
        if(this.isValidChain(newChain) && newChain.length > this.chain.length) { 
            this.chain = newChain
            console.log("Received new chain from " + peer)
        }
    }

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

    addPeer(peer) { 
        if(this.peers.indexOf(peer) == -1) { 
            this.peers.push(peer)
        }
    }
}


exports.Transaction = Transaction
exports.Block = Block
exports.Blockchain = Blockchain