const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'development',
  devtool: 'cheap-module-source-map',
  
  entry: {
    background: './src/background.js',
    content: './src/content.js',
    popup: './popup.js'
  },
  
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    clean: true
  },
  
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'manifest.json',
          to: 'manifest.json'
        },
        {
          from: 'popup.html',
          to: 'popup.html'
        },
        {
          from: 'popup.css',
          to: 'popup.css'
        },
        {
          from: 'src/content.css',
          to: 'content.css'
        },
        {
          from: 'icons',
          to: 'icons',
          noErrorOnMissing: true
        }
      ]
    })
  ],
  
  resolve: {
    extensions: ['.js', '.json']
  },
  
  optimization: {
    splitChunks: false
  }
};
