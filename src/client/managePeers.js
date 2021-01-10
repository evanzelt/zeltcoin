let peerBox = document.querySelector("#peers")
let newPeerInput = document.querySelector("#newPeer")
let inputButton = document.querySelector("#peerButton")

fetch("/peers")
    .then(response => response.json())
    .then(json => {
        json.forEach(e => {
            let peerElement = document.createElement("div")
            peerElement.innerText = e
            peerBox.appendChild(peerElement)
        });
    })