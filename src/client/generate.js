let { generateKeys } = require("../ec")

let generateButton = document.querySelector("#generate")
let privKeyBox = document.querySelector("#privKey")
let pubKeyBox = document.querySelector("#pubKey")


generateButton.onclick = () => {
    let { pubKey, privKey } = generateKeys()
    privKeyBox.innerText = "Private Key: " + privKey
    pubKeyBox.innerText = "Public Key: " + pubKey
}