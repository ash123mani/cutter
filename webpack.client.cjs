const path = require('path');
const ReactServerWebpackPlugin = require('react-server-dom-webpack/plugin');

module.exports = {
	name: 'client',
	target: 'web',
	mode: 'development',
	entry: './src/client/index.tsx',
	output: {
		path: path.resolve(__dirname, 'public'),
		filename: 'client.bundle.js',
		publicPath: '/',
	},
	resolve: {
		extensions: ['.ts', '.tsx', '.js'],
		conditionNames: ['browser', 'module', 'import', 'default'],
	},
	plugins: [
		new ReactServerWebpackPlugin({ isServer: false }), // 👈 generates react-client-manifest.json
	],
	devServer: {
		port: 3001,
		hot: true,
		open: true,
		static: path.resolve(__dirname, 'public'),
		historyApiFallback: true,
		proxy: [
			{
				context: ['/rsc'],
				target: 'http://localhost:3000',
				changeOrigin: true,
			},
		],
	},
	module: {
		rules: [
			{
				test: /\.(ts|tsx)$/,
				use: {
					loader: 'babel-loader',
					options: {
						presets: [
							'@babel/preset-env',
							['@babel/preset-react', { runtime: 'automatic' }],
							'@babel/preset-typescript',
						],
					},
				},
				exclude: /node_modules/,
			},
		],
	},
};
