let elliptic = require("elliptic");
let sha3 = require("js-sha3");
let ec = new elliptic.ec("secp256k1");

let generateKeys = () => {
	let keyPair = ec.genKeyPair();
	let pubKey = keyPair.getPublic().encodeCompressed("hex");
	let privKey = keyPair.getPrivate("hex");
	return { pubKey, privKey };
};

let signMessage = (message, privKey) => {
	messageHash = sha3.sha3_256(message);
	return ec.sign(messageHash, privKey, "hex", { canonical: true });
};

let verifySignature = (message, signature, pubKey) => {
	messageHash = sha3.sha3_256(message);
	//pubKey = ec.keyFromPublic(pubKey, "hex")
	return ec.verify(messageHash, signature, pubKey, "hex");
};

exports.generateKeys = generateKeys;
exports.signMessage = signMessage;
exports.verifySignature = verifySignature;
