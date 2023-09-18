module.exports = {
  extensions: ['.ts', '.tsx'],
  resolve: {
    alias: {
      ...require('./tsconfig.json').compilerOptions.paths,
    },
  },
};
