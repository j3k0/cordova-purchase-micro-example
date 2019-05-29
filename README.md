# Cordova Purchase Micro Example

This is a minimal example of an app using the [cordova purchase plugin](https://github.com/j3k0/cordova-plugin-purchase).

This example is part of the [official documentation](https://purchase.cordova.fovea.cc).

## Look at the source code

This repository contains different branches that demo different features of the plugin:

 * Auto-Renewing Subscriptions:
   * https://github.com/j3k0/cordova-purchase-micro-example/tree/subscriptions
 * Non-Consumable (unlock full version)
   * https://github.com/j3k0/cordova-purchase-micro-example/tree/nonconsumables
 * Consumables (virtual currency)
   * https://github.com/j3k0/cordova-purchase-micro-example/tree/consumables

## Usage

Clone the repository:

    git clone https://github.com/j3k0/cordova-purchase-micro-example.git

Checkout the branch of your choice:

    # for example...
    git checkout subscriptions
    # or...
    git checkout nonconsumables
    # or...
    git checkout consumables

Add the platform of your choice, for example android:

    cordova platform add android

For android, build a release AKP:

    ./android-release.sh

Note, this is setup to use an App ID that belongs to Fovea, you should change this in the config.xml file.

For Android, you also need your own keystore and to update the `BILLING_KEY` to your own.

## License

MIT

