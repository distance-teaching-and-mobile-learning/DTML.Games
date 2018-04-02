# Distance Teaching and Mobile Learning - eLearning Games
#### eLearning games in Phaser + ES6 + Webpack.

[Distance Teaching and Mobile Learning](https://dtml.org)

[Distance Teaching and Mobile Learning Blog](https://blog.dtml.org)

[Distance Teaching and Mobile Learning ELearning Games](https://games.dtml.org/games)

## Our Mission
Our mission is to provide opportunities for kids worldwide to build a foundation for their future by engaging in free educational activities powered by state of the art e-Learning technologies.

Our vision is to leverage technology to provide access to free educational support to every child around the globe. We have constructed an on-line portal where students across the globe can access variety of free eLearning materials.

We know that knowledge and education are the basics of economic opportunity. Giving children access to basic education from a young age is critical for the success of any country. We believe the biggest impact can be made by augmenting school activities with powerful e-Learning technologies. We partner with schools in developing countries to leverage existing facilities and equipment to provide students with our educational platform.

[Consider supporting our platform](https://dtml.org/Home/Donate)


# Setup
You'll need to install a few things before you have a working copy of the project.

## 1. Clone this repo:

Navigate into your workspace directory.

Run:

```git clone https://github.com/seattleuser/DTML.Games.git```

## 2. Install node.js and npm:

https://nodejs.org/en/


## 3. Install dependencies (optionally you can install [yarn](https://yarnpkg.com/)):

Navigate to the cloned repo's directory.

Run:

```npm install``` 

or if you chose yarn, just run ```yarn```

## 4. Run the development server:

Run:

```npm run dev```

This will run a server so you can run the game in a browser. It will also start a watch process, so you can change the source and the process will recompile and refresh the browser automatically.

To run the game, open your browser and enter http://localhost:3000 into the address bar.


## Build for deployment:

Run:

```npm run deploy```

This will optimize and minimize the compiled bundle.

## Deploy for cordova:
Make sure to uncomment the cordova.js file in the src/index.html and to update config.xml with your informations. (name/description...)

More informations about the cordova configuration:
https://cordova.apache.org/docs/en/latest/config_ref/

There is 3 platforms actually tested and supported : 
- browser
- ios
- android

First run (ios example):

```
npm run cordova
cordova platform add ios
cordova run ios
```

Update (ios example):

```
npm run cordova
cordova platform update ios
cordova run ios
```

This will optimize and minimize the compiled bundle.

## Config:
before you get to work you will surely want to check the config file. You could setup dimensions, webfonts, etc

## Webfonts:
In the config file you can specify which webfonts you want to include. In case you do not want to use webfonts simply leave the array empty

## Credits
Big thanks to these great repos:

https://github.com/belohlavek/phaser-es6-boilerplate

https://github.com/cstuncsik/phaser-es6-demo
