import * as PIXI from 'pixi.js'
const textureAtlas = require('./GM.json')
import textureAtlasImg from './assets/GM.png'
import Engine from './engine'

import PixiGameField from './PIXI/pixi-game-field'
import PixiStartStage from './PIXI/pixi-start-stage'
import PixiGameOverStage from './PIXI/pixi-game-over-stage'
import PixiNextLevelStage from './PIXI/pixi-next-level-stage'


/**Game setup */
const options = {
	// dimensions
	width: 15,
	height: 13,
	playerSize: 50,
	enemiesCount: 1,
	speedFrames: 12,
	enemySpeedFrames: 22,
	explodeSpeedFrames: 5,
	bombTimer: 2000,
	bombExplodeArea: 5,
	bombReleaseHelper: true,
	maxBombCount:3,
	wallsThreshold: 0.7,
	margin: 300,
	colors:{
		background : 0xFFFFF8,
		onBackground: 0x013859,
		columns: 0x21BEDA,
		walls: 0xC4A985,
		bomb: 0x3E4E59,
		fire: 0xF25652,
		player:0x00986F,
		enemy:0xEB3E4A
	}
}

options.speed = options.playerSize / options.speedFrames
options.explodeSpeed = options.playerSize / options.explodeSpeedFrames

//Create a Pixi Application
let app = new PIXI.Application({
	width: 850,
	height: 650
})

window.engine = new Engine(new PixiGameField(options, app),
	new PixiStartStage(options, app),
	new PixiGameOverStage(options, app),
	new PixiNextLevelStage(options, app))
 
window.engine.Launch()

document.body.appendChild(app.view)


// Init textures
const baseTexture = new PIXI.BaseTexture.from(textureAtlasImg, null, 1)
const spritesheet = new PIXI.Spritesheet(baseTexture, textureAtlas)
spritesheet.parse(function () {

	app.ticker.add(() => window.engine.Refresh())

})


