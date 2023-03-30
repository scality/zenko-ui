const merge = require('webpack-merge');
const common = require('./rspack.common');

module.exports = merge(common, {
  mode: 'production',
  devtool: 'hidden-source-map',
  // plugins: [new CompressionPlugin()],
});
