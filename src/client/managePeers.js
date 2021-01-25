let { Peer } = require("../blockchain")

let peerBox = document.querySelector("#peers")
let newPeerInput = document.querySelector("#newPeer")
let inputButton = document.querySelector("#peerButton")
let peers = []

fetch("/peers")
    .then(response => response.json())
    .then(json => {
        json.forEach(e => {
            let peerElement = document.createElement("div")
            peerElement.innerText = e
            peerBox.appendChild(peerElement)
            peers.push(e)
        });
    })

inputButton.onclick = () => {
    let newPeerAddress = newPeerInput.value
    if(peers.indexOf(newPeerAddress) != -1) { 
        alert("This peer already exists")
        return
    }

    let data = JSON.stringify(new Peer(newPeerAddress))
    fetch("addPeer", {
        method: "POST",
        headers: {
            'Content-Type' : "application/json"
        },
        body: data,
    })
    .then(res => res.json())
    .then(peerList => {
         peerList.forEach(e => {
             if(peers.indexOf(e) == -1) {
                 peers.push(e)
             }
         })


        peerBox.innerHTML = ""
        peers.forEach(e => {
            let peerElement = document.createElement("div")
            peerElement.innerText = e
            peerBox.appendChild(peerElement)
            peers.push(e)
        });
    })
    .catch(() => {alert("Could not connect to node")})


}