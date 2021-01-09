
let messageBox = document.querySelector("#status-messages")

let addMessage = (message) => { 
    messageBox.innerText = messageBox.innerText + "\n" + message
}

