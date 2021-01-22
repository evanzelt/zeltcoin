const fetch = require("node-fetch");

class Peer {
	constructor(address) {
		this.address = address;
	}

	getChain(callback) {
		fetch("http://" + this.address + ":5500/chain")
			.then((res) => res.json())
			.then((resJSON) => {
				callback(resJSON);
			})
			.catch(() => callback(false))
	}

	getPeers(callback) {
		fetch("http://" + this.address + ":5500/peers")
			.then((res) => res.json())
			.then((resJSON) => {
				callback(resJSON);
			})
			.catch(() => callback(false))
	}
}

module.exports = Peer;
