const { getDefaultConfig } = require('expo/metro-config');
const path = require('node:path');
const config = getDefaultConfig(__dirname);
// Pure TypeScript curriculum, shared with the web app. No cross-app React tree.
config.watchFolders = [path.resolve(__dirname, '../../shared/noah-resuscitation')];
module.exports = config;
