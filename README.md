# Nayuta Wallet

Developed using Appcelerator Titanium Alloy SDK with custom native iOS and Java libraries.

Alloy allows app development in Javascript which can cross compile into iOS and Android mobile applications.

With Alloy/Titanium UI is native however any controller functions are run as javascript in a javascript engine which has performance and security (due to errors) implications.
Therefore any controller functions are kept to a minimum with the important functions being coded natively in respective iOS and Java frameworks that are then imported into the Alloy application, the benefit being we can experience native performance and security whilst at the same time having a shared code base for UI and light controller functions for easier development.

#Getting Started

You will need to install the Appcelerator tool kit which can be done by following the instructions here
https://wiki.appcelerator.org/display/guides2/Titanium+SDK+Getting+Started

You will then need to add your own tiapp.xml you can use the SAMPLE_tiapp.xml as a basis and add your own GUID, opening and building the project in Appcelerator Studio should add this for you.

All the native libraries can be found in the app/platform folder apart from the Lndmobile.framework and lndmobile.aar which can be built from LND using gomobile from the branch below. It can be downloaded as a binary from the releases section also linked below

Source Code:https://github.com/mandelmonkey/lnd/tree/mobile_support_latest
Binary Release:https://github.com/mandelmonkey/lnd/releases/tag/v0.1-mobile


The lndmobile libraries need to be placed in the respective folders under app/platform/android, app/platform/ios

#Build libraries from source
The necessary libraries are already contained in the repo however if you wish to build the libraries from source the repos can be found at the links below.
note: the libs need to be placed in the respective folders under app/platform/android, app/platform/ios

androidcrypto-release.aar
androidkeystore-release.aar
customwebview-release.aar
https://github.com/mandelmonkey/AndroidModules

ioscrypto.framework
https://github.com/mandelmonkey/ioscrypto

web3.framework
https://github.com/mandelmonkey/web3iOSWebView

lngrpc-1.0.jar
https://github.com/mandelmonkey/android_lngrpc
lnGRPCWrapper.framework
https://github.com/mandelmonkey/lnGRPCWrapper
*note this library's xcode project uses cocoapods and the generated pod frameworks must also be placed in the app/platform/ios directory.

#Caveats
Development with Alloy can be slow as inorder to view changes to UI you must rebuild the project each time.
Alloy/Titanium does offer a live view option however this does not seem to work if native libraries are loaded.
The project contains and override function which will not load native libraries and instead use dummy data, this allows the use of liveview and thus quicker development
particularly when working on UI.
The override can be enabled by setting '''globals.enableLiveView = true''' in index.js
