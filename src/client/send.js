let {Transaction, Block, Blockchain} = require("../blockchain")
let {generateKeys, signMessage, verifySignature} = require ("../ec")

let sendForm = document.querySelector("#transaction-form")
let transactionConfirmationBox = document.querySelector("#transaction-box")


sendForm.onsubmit = (e) => {
    e.preventDefault()

    let data = new FormData(sendForm)

    let transaction = new Transaction(data.get("pubKey"), data.get("recipient"), data.get("amount"))
    
    let signature = signMessage(JSON.stringify(transaction.json()), data.get("privKey")).toDER("hex")

    console.log(signature)

    

    if(verifySignature(JSON.stringify(transaction.json()), signature, data.get("pubKey"))) {
        transactionConfirmationBox.innerText = JSON.stringify(transaction.json()) + signature
        transaction = transaction.json()

        transaction.signature = signature
        fetch("/makeTransaction", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(transaction),
        })
        .then((response) => response.text())
        .then(response => {
            console.log(response)
        })
    }

}