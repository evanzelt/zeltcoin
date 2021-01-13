(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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
    let newPeer = newPeerInput.value
    if(peers.indexOf(newPeer) != -1) { 
        alert("This peer already exists")
        return
    }

    let data = {"peer" : newPeer}
    fetch("addPeer", {
        method: "POST",
        headers: {
            'Content-Type' : "application/json"
        },
        body: JSON.stringify(data),
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
},{}]},{},[1]);
