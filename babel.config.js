// babel.config.js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      'babel-preset-expo'
    ],
    plugins: [
      // --- この行が必須！必ず一番上に書く ---
      'expo-router/babel',

      // あなたのエイリアス設定など
      ['module-resolver', {
        alias: {
          '@': './',
        },
      }],
    ],
  };
};
