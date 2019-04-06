'use strict';

const BASE_PORT = 3000;

const path = require('path');
const portfinder = require('portfinder');
portfinder.basePort = BASE_PORT;

const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const watch = require('node-watch');
const fs = require('fs-extra');

const colors = require('colors/safe');
const cliPrefix = require('./utils').cliPrefix;

const es5Loader = require('./es5Loader');

// File with these extensions in `assets/image/standalone` will be copied to media
// during building process
const standalone_copy_exts = [
    '.png',
    '.tiff',
    '.jpg',
    '.jpeg',
];

function getIPAddress() {
    const interfaces = require('os').networkInterfaces();
    for (let devName in interfaces) {
        let iface = interfaces[devName];

        for (let i = 0; i < iface.length; i++) {
            let alias = iface[i];
            if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal)
                return alias.address;
        }
    }
    return '0.0.0.0';
}

function server(gameDir, port) {
    const ipAddress = getIPAddress();
    const fullAddress = `${ipAddress}:${port}`;

    const es5 = false;
    const cjs = false;

    const config = {
        mode: 'development',
        entry: {
            game: [
                // Live-reload
                `webpack-dev-server/client?http://${fullAddress}`,
                // Game entry
                path.resolve(gameDir, 'src/game/main.js'),
            ],
        },
        output: {
            path: path.resolve(gameDir, 'dist'),
            filename: '[name].js',
        },
        devtool: 'source-map',
        module: {
            rules: [
                // Shaders
                {
                    test: /\.(vert|frag|vs|fs)$/,
                    include: [path.resolve(gameDir, 'src')],
                    loader: require.resolve('raw-loader'),
                },
                // Styles
                {
                    test: /\.css$/,
                    include: [path.resolve(gameDir, 'src')],
                    use: [
                        {
                            loader: require.resolve('style-loader'),
                        },
                        {
                            loader: require.resolve('css-loader'),
                            options: {
                                modules: true,
                            },
                        },
                    ],
                },
                // Images, will be convert to data url if less than 10kb
                // Note: use `require()` to fetch
                {
                    test: /\.(jpg|png|gif)$/,
                    use: [
                        {
                            loader: require.resolve('url-loader'),
                            options: {
                                limit: 10000,
                            },
                        },
                    ],
                },
                // Fonts
                {
                    test: /\.woff(\?v=\d+\.\d+\.\d+)?$/,
                    use: [
                        {
                            loader: require.resolve('url-loader'),
                            options: {
                                limit: 10000,
                                mimetype: 'application/font-woff',
                            },
                        },
                    ],
                },
                {
                    test: /\.woff2(\?v=\d+\.\d+\.\d+)?$/,
                    use: [
                        {
                            loader: require.resolve('url-loader'),
                            options: {
                                limit: 10000,
                                mimetype: 'application/font-woff',
                            },
                        },
                    ],
                },
                {
                    test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
                    use: [
                        {
                            loader: require.resolve('url-loader'),
                            options: {
                                limit: 10000,
                                mimetype: 'application/octet-stream',
                            },
                        },
                    ],
                },
                {
                    test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,
                    use: [require.resolve('file-loader')],
                },
                {
                    test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
                    use: [
                        {
                            loader: require.resolve('url-loader'),
                            options: {
                                limit: 10000,
                                mimetype: 'image/svg+xml',
                            },
                        },
                    ],
                },
            ],
        },
        resolve: {
            modules: [
                path.join(gameDir, 'src'),
                path.join(gameDir, 'assets'),
                path.join(process.cwd(), 'node_modules'),
            ],
        },
        optimization: {
            splitChunks: {
                chunks: "all"
            }
        },
        plugins: [
            new HtmlWebpackPlugin({
                template: path.resolve(gameDir, 'index.html'),
                inject: 'body',
            }),
        ],
    };

    if (es5) {
        config.module.rules.unshift(es5Loader(gameDir, cjs));
    }

    const compiler = webpack(config);

    const devServer = new WebpackDevServer(compiler, {
        hot: false,

        quiet: false,
        noInfo: false,
        lazy: false,

        disableHostCheck: true,
        contentBase: gameDir,

        stats: {
            assets: false,
            colors: true,
            version: false,
            timings: true,
            hash: false,
            chunks: false,
            chunkModules: false,
        },
    });

    devServer.listen(port, null, function () {
        console.log(cliPrefix + colors.green(` Server is starting...`));
        console.log(cliPrefix + colors.bold(` Access URLS:`));
        console.log(colors.grey('--------------------------------------'));
        console.log(`      Local: ${colors.magenta('http://localhost:' + port)}`);
        console.log(`   External: ${colors.magenta('http://' + fullAddress)}`);
        console.log(colors.grey('--------------------------------------'));
    });

    const standalone_path = path.resolve(gameDir, 'assets/image/standalone');

    const copy_standalone_images_to_media = (image_url) => {
        fs.copyFileSync(image_url, path.resolve(gameDir, 'media', path.basename(image_url)));
    }

    // Watch `standalone` folder changes, and copy/delete images to `media`
    if (fs.existsSync(standalone_path)) {
        watch(standalone_path, { recursive: true }, (evt, name) => {
            if (standalone_copy_exts.indexOf(path.extname(name)) < 0) {
                return;
            }

            if (evt === 'update') {
                copy_standalone_images_to_media(name);
            } else if (evt === 'remove') {
                fs.removeSync(path.resolve(gameDir, 'media', path.basename(name)));
            }
        })
    }
}

(function(gameDir, callback) {
    portfinder.getPort(function (err, realPort) {
        if (err) {
            callback(err);
        }
        server(gameDir, realPort);
    });
})(path.resolve(process.cwd(), 'client'), (err) => console.log(err))
