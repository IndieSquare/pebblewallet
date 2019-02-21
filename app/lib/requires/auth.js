module.exports = (function() {
	var self = {};

	var util = require("requires/util");

	var authPhrase = 'Fingerprint';

	// You can set the authentication policy on iOS (biometric or passcode)
	// In this case, we also check for Touch ID vs Face ID for a more personalized UI
	if (OS_IOS) {
		// In order to check the biometry type, you have to check if biometrics are supported in general
		var supported = globals.identity.isSupported();

		if (globals.identity.biometryType == globals.identity.BIOMETRY_TYPE_FACE_ID) {
			authPhrase = 'Face ID';
		} else if (globals.identity.biometryType == globals.identity.BIOMETRY_TYPE_TOUCH_ID) {
			authPhrase = 'Touch ID';
		} else {
			authPhrase = '(None available)';
		}

		if (!supported) {
			//alert('Authentication is not supported. Available biometrics: ' + authPhrase);
		}

		// Using this constant, iOS will automatically offer to authenticate with Face ID or Touch ID
		// when calling "authenticate" below.
		globals.identity.setAuthenticationPolicy(globals.identity.AUTHENTICATION_POLICY_BIOMETRICS); // or: AUTHENTICATION_POLICY_PASSCODE
	}

	self.REASON_CANCEL = -1;
	self.REASON_EASY = 0;
	self.REASON_SECONDEPASSWORD = 1;
	self.REASON_PASSWORD = 2;
	self.REASON_TOUCHID = 3;

	self.checkPasscode = function(params) {
		function input_password() {
			if (globals.passCodeHash != null) {
				var easyInput = util.createEasyInput({
					"type": "change",
					"callback": function(number) {
						params.callback({
							success: true,
							reason: self.REASON_EASY,
							inputText: number
						});
					},
					"cancel": function() {
						params.callback({
							success: false,
							reason: self.REASON_CANCEL
						});
					}
				});
				easyInput.open();
			}
		}

		if (OS_ANDROID) input_password();
		else {
			input_password();
		}
	};

	self.check = function(params) {
		function input_password() {
			if (globals.passCodeHash != null) {
				var easyInput = util.createEasyInput({
					type: "confirm",
					callback: function(number) {
						params.callback({
							success: true,
							reason: self.REASON_EASY,
							inputText: number
						});
					},
					cancel: function() {
						params.callback({
							success: false,
							reason: self.REASON_CANCEL
						});
					}
				});
				easyInput.open();
			}
		}

		if (OS_ANDROID) input_password();
		else {
			input_password();
		}
	};

	self.useTouchID = function(params) {
		try {
			globals.identity.authenticate({
				reason: L("label_fingerprint"),
				callback: function(e) {
					globals.identity.invalidate();
					Ti.API.info("callback");
					if (e.success) params.callback({
						"success": true
					});
					else params.callback({
						"success": false
					});
				}
			});
		} catch (e) {

			alert(JSON.stringify(e) + " " + e);
		}
	};

	return self;
}());
