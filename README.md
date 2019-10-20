# Cordova Purchase Micro Example - Subscriptions

This is a minimal example of an app using the [cordova purchase plugin](https://github.com/j3k0/cordova-plugin-purchase) for subscriptions.

This example is part of the [official documentation](https://purchase.cordova.fovea.cc).

## Usage

Clone the repository:

    git clone https://github.com/j3k0/cordova-purchase-micro-example.git

Add the platform of your choice, for example android:

    cordova platform add android

For android, build a release APK:

    ./android-release.sh

Note, this is setup to use an App ID that belongs to Fovea, you can change this in the config.xml file.

For Android, you also need your own keystore and to update the `BILLING_KEY` to your own.

## Discount Offers Server

For signature generation, the demo application uses this demo server:

https://github.com/j3k0/nodejs-suboffer-signature-server

## License

MIT

