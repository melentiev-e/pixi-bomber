import * as PIXI from 'pixi.js'
const textureAtlas = require('./GM.json')
import textureAtlasImg from './assets/GM.png'
import Engine from './engine'
import PixiGameField from './PIXI/pixi-game-field'
import PixiStartSage from './PIXI/pixi-start-stage'


/**Game setup */
const options = {
	// dimensions
	width: 19,
	height: 19,
	playerSize: 50,
	enemiesCount: 5,
	speedFrames: 12,
	enemySpeedFrames: 22,
	explodeSpeedFrames: 5,
	bombTimer: 2000,
	fireSize: 3,
	wallsThreshold: 0.7,
	margin: 300
}



options.speed = options.playerSize / options.speedFrames
options.explodeSpeed = options.playerSize / options.explodeSpeedFrames

//Create a Pixi Application
let app = new PIXI.Application({
	width: 850,
	height: 650
})

window.engine = new Engine(new PixiGameField(options, app), new PixiStartSage(options, app))
 
window.engine.Launch()

document.body.appendChild(app.view)


// Init textures
const baseTexture = new PIXI.BaseTexture.from(textureAtlasImg, null, 1)
const spritesheet = new PIXI.Spritesheet(baseTexture, textureAtlas)
spritesheet.parse(function () {

	app.ticker.add(() => window.engine.Refresh())

})


