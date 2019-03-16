// The contents of this file will be executed before any of
// your view controllers are ever executed, including the index.
// You have access to all functionality on the `Alloy` namespace.
//
// This is a great place to do any initialization for your app
// or create any global variables/functions that you'd like to
// make available throughout your app. You can easily make things
// accessible globally by attaching them to the `Alloy.Globals`
// object. For example:
//
// Alloy.Globals.someGlobalFunction = function(){};

Alloy.Globals = {
  currentTab: 1,
  copyright: '© 2015-2018 IndieSquare Inc.',

  datas: null,
  lastUrl: null,
  discoverEndpoint: 'https://discover.indiesquare.net',
  hubURITestnet: '026eb42e3190b6a89f6f24824796270270e5aa6bdba11cd85bb0ec6a111c466213@35.221.97.245',
  auth_id: 'indietest',
  auth_pass: 'indie4936test',

  sender_id: '35204291973',
  api_key: 'a6db8ab60116e98d7920e5c65545835c',

  SAVE_FILE_PATH: Ti.Filesystem.applicationDataDirectory + '/save_file.json',

  network: 'livenet'
};

Alloy.Globals.accountsKey = "AccountsV2";

function isiPhoneX() {
  return (Ti.Platform.displayCaps.platformWidth === 375 && Ti.Platform.displayCaps.platformHeight == 812) || // Portrait
    (Ti.Platform.displayCaps.platformHeight === 812 && Ti.Platform.displayCaps.platformWidth == 375); // Landscape
}

function isSmallScreen() {

  if (Ti.Platform.displayCaps.platformHeight < 570) {

    return true;
  }
  return false;
}

Alloy.Globals.lndMobileNetwork = "testnet";
Alloy.Globals.isiPhoneX = isiPhoneX();

Alloy.Globals.isSmallScreen = isSmallScreen();

Alloy.Globals.isAndroid = (OS_ANDROID);

Alloy.Globals.mainColor = "#8cb1a7";
Alloy.Globals.mainColorDarker = "#6ea18f";

Alloy.Globals.mainColorLighter = "#aeccc4";

Alloy.Globals.cancelColor = "#ba6464";

Alloy.Globals.currentBarImage = "/images/gradientIndiePink.jpg";
Alloy.Globals.currentMenuButton = "/images/menuButton.png";
Alloy.Globals.currentMenuButtonClose = "/images/menuButtonClose.png";
Alloy.Globals.tabBarHeight = 40;
Alloy.Globals.topBarHeight = 60;
Alloy.Globals.bottomButtonPos = 20;
Alloy.Globals.statusBarSize = 20;
Alloy.Globals.windowColor = "#e3e3e3";
if (Alloy.Globals.isiPhoneX) {
  Alloy.Globals.tabBarHeight = 52;
  Alloy.Globals.topBarHeight = 75;

  Alloy.Globals.bottomButtonPos = 45;
}
if (OS_ANDROID) {
  Alloy.Globals.topBarHeight = 60;
  Alloy.Globals.bottomButtonPos = 40;

  Alloy.Globals.statusBarSize = 0;
}

Alloy.Globals.fontColor1 = "#414141";
Alloy.Globals.btclnTopBarHeight = 200;
Alloy.Globals.btclnTopHeight = Alloy.Globals.btclnTopBarHeight;
Alloy.Globals.btclnAddressBarTop = 30;
Alloy.Globals.lightFont = 'GillSans-light';
Alloy.Globals.boldFont = 'GillSans-bold';
Alloy.Globals.normalFont = 'GillSans';

Alloy.Globals.lightFontItalic = 'GillSans-Light Italic';

Alloy.Globals.dappBarTop = 0;
Alloy.Globals.infoTop = 0;
Alloy.Globals.dappBarHeight = 42;

if (OS_IOS) {
  Alloy.Globals.dappBarTop = 20;
  Alloy.Globals.infoTop = 20;

}

if (Alloy.Globals.isiPhoneX) {
  Alloy.Globals.dappBarTop = 52;

  Alloy.Globals.dappBarHeight = 35;

  Alloy.Globals.infoTop = 35;
}
