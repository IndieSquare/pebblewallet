module.exports = (function() {
	var self = {};;

	var bitcoin = require('vendor/util/bitcoinjs-lib')

	var bip21lib = bitcoin.bip21;

	self.base64toHEX = function(base64) {

		return bitcoin.buffer(base64, 'base64').toString('hex');

	};

	self.checkExpired = function(req) {

		var timeExp = (Date.now() / 1000) - req.timestamp;

		if (timeExp > req.expiry) {

			return true;

		}

		return false;

	};

	self.decodeLNPayReq = function(req) {
		var res = null;
		try {
			res = tools.bolt11.decode(req);
		} catch (e) {
			return null;
		}
		return res;
	};

	self.URI = function(uri) {

		try {
			var decoded = bip21lib.decode(uri);

			var uri = {
				"address": decoded.address,
				"amount": decoded.options.amount
			};

			return uri;
		} catch (e) {
			console.error(e);
			return null;
		}

	};

	return self;
}());
