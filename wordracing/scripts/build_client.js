'use strict';

const path = require('path');
const fs = require('fs-extra');

const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const colors = require('colors/safe');
const cliPrefix = require('./utils').cliPrefix;

const es5Loader = require('./es5Loader');

// List of ignored files that won't be copied to media folder
const copy_ignores = [
  '.DS_Store',
];

// File with these extensions in `assets/image/standalone` will be copied to media
// during building process
const standalone_copy_exts = [
  '.png',
  '.tiff',
  '.jpg',
  '.jpeg',
];

function build(gameDir, callback) {
  console.log(`${cliPrefix} Start to build...`);

  const es5 = true;
  const cjs = false;

  const config = {
    mode: 'production',
    entry: {
      game: path.resolve(gameDir, 'src/game/main.js'),
    },
    output: {
      path: path.resolve(gameDir, 'dist'),
      filename: '[name].js',
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: path.resolve(gameDir, 'index.html'),
        inject: 'body',
      }),
    ],
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
        path.join(gameDir, 'node_modules'),
        path.join(process.cwd(), 'node_modules'),
      ],
    },
  };

  if (es5) {
    config.module.rules.unshift(es5Loader(gameDir, cjs));
  }

  const target_dir = path.resolve(gameDir, 'dist');

  const build_error = (err) => {
    console.log(err)
    console.log(`\n${cliPrefix} ${colors.red('Build failed!')}`);
  }

  // Clean up contents of the target dir
  fs.emptyDir(target_dir)
    .then(() => {
      console.log(`${cliPrefix} ${colors.yellow('Compile scripts...')}`);

      // Build with webpack
      const compiler = webpack(config);
      compiler.run(function(err, stats) {
        if (err) {
          build_error(err);
          return;
        }

        // Start to copy resources
        console.log(`${cliPrefix} ${colors.yellow('Copy media...')}`);

        const standalone_path = path.resolve(gameDir, 'assets/image/standalone');

        const copy_standalone_images_to_media = () => {
          fs.readdirSync(standalone_path)
            .filter(src => standalone_copy_exts.indexOf(path.extname(src).toLowerCase()) >= 0)
            .forEach(file => {
              fs.copyFileSync(path.resolve(standalone_path, file), path.resolve(gameDir, 'media', file));
            })
        }
        const copy_media_to_dist = () => (
          fs.copy(path.resolve(gameDir, 'media'), path.resolve(gameDir, 'dist/media'), {
            filter: (src, dest) => {
              return copy_ignores.indexOf(path.basename(src)) < 0;
            }
          })
        )
        const report_copy_complete = () => {
          console.log(`${cliPrefix} ${colors.green('Build complete!')}`);
        }

        // Copy images in the `standalone` folder if exist
        if (fs.pathExistsSync(standalone_path)) {
          copy_standalone_images_to_media();
        }

        // Copy
        copy_media_to_dist()
          .then(report_copy_complete)
          .catch(build_error)

        // Copy to server static folder
        fs.copy(path.resolve(gameDir, 'dist'), path.resolve(gameDir, '../server/static'), {
          filter: (src, dest) => {
            return copy_ignores.indexOf(path.basename(src)) < 0;
          }
        })
      });
    })
    .catch(build_error)
}

build(path.resolve(process.cwd(), 'client'), (err) => {
    if (err) console.error(err);
    else console.log('Done');
})
