const { withAndroidManifest, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withWakeupNotificationManifest = (config) => {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;
    const mainApplication = androidManifest.manifest.application[0];

    if (!mainApplication.receiver) {
      mainApplication.receiver = [];
    }

    const receiverName = '.WakeupNotificationReceiver';
    const exists = mainApplication.receiver.some(
      (r) => r.$['android:name'] === receiverName
    );

    if (!exists) {
      mainApplication.receiver.push({
        $: {
          'android:name': receiverName,
          'android:exported': 'true',
        },
        'intent-filter': [
          {
            action: [
              {
                $: {
                  'android:name': 'android.intent.action.USER_PRESENT',
                },
              },
              {
                $: {
                  'android:name': 'com.weatherdashboard.app.ACTION_TRIGGER_WAKEUP_TEST',
                },
              },
            ],
          },
        ],
      });
    }

    return config;
  });
};

const withWakeupNotificationCode = (config) => {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const platformRoot = config.modRequest.platformProjectRoot;

      // Target directory for Kotlin source
      const targetDir = path.join(
        platformRoot,
        'app',
        'src',
        'main',
        'java',
        'com',
        'weatherdashboard',
        'app'
      );
      fs.mkdirSync(targetDir, { recursive: true });

      const filesToCopy = [
        'WakeupNotificationReceiver.kt',
        'WakeupNotificationModule.kt',
        'WakeupNotificationPackage.kt',
      ];

      for (const file of filesToCopy) {
        const src = path.join(projectRoot, 'src', 'native', file);
        const dest = path.join(targetDir, file);
        if (fs.existsSync(src)) {
          fs.copyFileSync(src, dest);
        }
      }

      // Ensure local.properties exists with Android SDK path
      const localPropPath = path.join(platformRoot, 'local.properties');
      if (!fs.existsSync(localPropPath)) {
        const homeDir = process.env.USERPROFILE || process.env.HOME || '';
        const sdkPath = path.join(homeDir, 'AppData', 'Local', 'Android', 'Sdk').replace(/\\/g, '\\\\');
        fs.writeFileSync(localPropPath, `sdk.dir=${sdkPath}\n`, 'utf-8');
      }

      return config;
    },
  ]);
};

module.exports = function withWakeupNotification(config) {
  return withWakeupNotificationCode(withWakeupNotificationManifest(config));
};
