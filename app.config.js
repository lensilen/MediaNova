const fs = require("fs");
const path = require("path");

const appJson = require("./app.json");

const googleServicesFile = "./google-services.json";
const googleServicesPath = path.join(__dirname, googleServicesFile);

function uniquePlugins(plugins) {
  return plugins.filter((plugin, index) => {
    const pluginName = Array.isArray(plugin) ? plugin[0] : plugin;

    return plugins.findIndex((item) => {
      return (Array.isArray(item) ? item[0] : item) === pluginName;
    }) === index;
  });
}

module.exports = () => {
  const config = {
    ...appJson.expo,
    android: {
      ...appJson.expo.android,
    },
    plugins: [...(appJson.expo.plugins || [])],
  };

  if (fs.existsSync(googleServicesPath)) {
    config.android.googleServicesFile = googleServicesFile;
    config.plugins = uniquePlugins([
      ...config.plugins,
      "@react-native-firebase/app",
      "@react-native-firebase/messaging",
    ]);
  }

  return { expo: config };
};
