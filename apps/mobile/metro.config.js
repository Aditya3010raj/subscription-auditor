const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// 1. Find the project and workspace ROOTS
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 2. Let Metro "see" the node_modules in the root and other packages
config.watchFolders = [workspaceRoot];

// 3. Force Metro to resolve modules from the workspace root first
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// 4. Important for Monorepos: tell Metro where to find the 'main' entry points
config.resolver.disableHierarchicalLookup = true;

module.exports = config;