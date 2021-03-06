# Phaser + ES6 + Webpack.
#### A bootstrap project to create games with Phaser + ES6 + Webpack.
Conversation simulation games builder.

# Building and Testing

To test the game use:

```npm run dev -- --define game:[name of game folder]```

For example if you wanted to test the restaurant module you'd type:

```npm run dev -- --define game:restaurant```

To build the game use:

```npm run deploy -- --define game:[name of game folder]```

The extra set of hyphens is necessary. To build the store module you'd type:

```npm run deploy -- --define game:store```

# Setup
You'll need to install a few things before you have a working copy of the project.

## 1. Clone this repo:

Navigate into your workspace directory.

Run:

```git clone https://github.com/lean/phaser-es6-webpack.git```

## 2. Install node.js and npm:

https://nodejs.org/en/


## 3. Install dependencies (optionally you can install [yarn](https://yarnpkg.com/)):

Navigate to the cloned repo's directory.

Run: 

```npm install``` 

or if you chose yarn, just run ```yarn```

## 4. Run the development server:

Run:```npm run dev -- -- define game:[name of game folder]```

if you wanted to run dev server with the restaurant module you'd type:

```npm run dev -- -- define game:restaurant```

This will run a server so you can run the game in a browser. It will also start a watch process, so you can change the source and the process will recompile and refresh the browser automatically.

To run the game, open your browser and enter http://localhost:3000 into the address bar.

## Execute unit tests
Run tests use:

```npm run tests``

## Build for deployment:

To build the game use:

```npm run deploy -- --define game:[name of game folder]```

The extra set of hyphens is necessary. To build the store module you'd type:

```npm run deploy -- --define game:store```

This will optimize and minimize the compiled bundle.

## Config:
before you get to work you will surely want to check the config file. You could setup dimensions, webfonts, etc

## Webfonts:
In the config file you can specify which webfonts you want to include. In case you do not want to use webfonts simply leave the array empty

## Credits
Big thanks to these great repos:

https://github.com/belohlavek/phaser-es6-boilerplate

https://github.com/cstuncsik/phaser-es6-demo

