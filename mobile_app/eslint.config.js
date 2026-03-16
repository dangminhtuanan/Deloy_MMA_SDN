// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");
const reactNative = require("eslint-plugin-react-native");

module.exports = defineConfig([
  ...expoConfig, // Destructure expoConfig array
  {
    plugins: {
      "react-native": reactNative,
    },
    rules: {
      // Most important rule to fix "Text strings must be rendered within a <Text> component" errors
      "react-native/no-raw-text": [
        "error",
        {
          skip: ["CustomButton", "SafeText"], // Skip custom components if you're sure they wrap Text inside
        },
      ],
      "react-native/no-inline-styles": "warn",
      "react-native/no-color-literals": "warn",
    },
  },
  {
    ignores: ["dist/*", ".expo/*", "node_modules/*"],
  },
]);
