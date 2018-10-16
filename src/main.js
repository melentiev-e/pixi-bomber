import * as PIXI from 'pixi.js'
const textureAtlas = require('./GM.json')
import textureAtlasImg from './assets/GM.png'
import Engine from './engine'

class PixiEngine extends Engine {
	constructor(options, app) {
		super(options)
		this.app = app
		this.fires = []
	}
	CreatePlayer() {
		// init player
		//  player = new PIXI.Sprite(this.textures["fpoint.png"]);
		let player = new PIXI.Graphics()
		player.beginFill(0x42f44e)
		player.drawEllipse(options.playerSize / 2, options.playerSize / 2, options.playerSize / 2, options.playerSize / 2)

		player.x = options.playerSize
		player.y = options.playerSize
		this.app.stage.addChild(player)
		return player
	}
	CreateWall(x, y) {
		let wall = new PIXI.Graphics()
		wall.beginFill(0xf49542)
		wall.drawRect(0, 0, options.playerSize, options.playerSize)
		wall.x = x * options.playerSize
		wall.y = y * options.playerSize
		wall.endFill()
		this.app.stage.addChild(wall)
		return wall
	}
	OnBombExploded(bomb) {
		for (let index = 0; index < 4; index++) {
			let fire = new PIXI.Graphics()
			fire.beginFill(0xff6e00)
			fire.drawEllipse(options.playerSize / 2, options.playerSize / 2, options.playerSize / 2, options.playerSize / 2)
			fire.options = options
			fire.x = bomb.x
			fire.y = bomb.y
			fire.vx = 1
			fire.vy = 0
			this._initObjectFunctions(fire)
			fire.dist = options.playerSize * options.fireSize
			fire.endFill()
			this._rotateUnit(fire, index)
			this.fires.push(fire)
			this.app.stage.addChild(fire)
		}

		this.app.stage.removeChild(bomb)
	}
	CreateColumn(x, y) {
		const rectangle = new PIXI.Graphics()
		rectangle.beginFill(0x66CCFF)
		rectangle.drawRect(0, 0, options.playerSize, options.playerSize)
		rectangle.endFill()
		rectangle.x = x * options.playerSize
		rectangle.y = y * options.playerSize
		this.app.stage.addChild(rectangle)
		return rectangle
	}
	CreateEnemy(x, y) {
		let enemy = new PIXI.Graphics()
		enemy.beginFill(0xf44242)
		enemy.drawEllipse(options.playerSize / 2, options.playerSize / 2, options.playerSize / 2, options.playerSize / 2)
		enemy.x = x * options.playerSize
		enemy.y = y * options.playerSize
		enemy.endFill()
		enemy.vx = 0
		enemy.vy = 1
		enemy.options = options
		enemy.speed = options.playerSize / options.enemySpeedFrames
		this.app.stage.addChild(enemy)
		return enemy
	}
	CreateBomb(x, y) {
		let bomb = new PIXI.Graphics()
		bomb.beginFill(0x000)
		bomb.drawEllipse(options.playerSize / 2, options.playerSize / 2, options.playerSize / 2, options.playerSize / 2)
		bomb.x = x * options.playerSize
		bomb.y = y * options.playerSize
		bomb.endFill()
		bomb.exploded = false
		this.app.stage.addChild(bomb)
		return bomb
	}
	CreateDoor(x, y) {
		var door = new PIXI.Graphics()
		door.beginFill(0x3f0fff)
		door.drawRect(0, 0, options.playerSize, options.playerSize)
		door.x = x
		door.y = y
		door.endFill()
		this.app.stage.addChildAt(door, this.app.stage.getChildIndex(this.player))
		return door
	}

	Refresh() {


		var dx1 = (this.app.view.width - this.options.margin) - (this.player.x + this.app.stage.x)
		var dx2 = this.options.margin - (this.player.x + this.app.stage.x)
		if (dx1 < 0) {
			this.app.stage.x = Math.max(this.app.stage.x + dx1, this.app.view.width - this.app.stage.width)
		}
		if (dx2 > 0) {
			this.app.stage.x = Math.min(0, this.app.stage.x + dx2)
		}

		var dy1 = (this.app.view.height - this.options.margin) - (this.player.y + this.app.stage.y)
		var dy2 = this.options.margin - (this.player.y + this.app.stage.y)
		if (dy1 < 0) {
			this.app.stage.y = Math.max(this.app.stage.y + dy1, this.app.view.height - this.app.stage.height)
		}
		if (dy2 > 0) {
			this.app.stage.y = Math.min(0, this.app.stage.y + dy2)
		}
		super.Refresh()
		this._runBombExplosing()
	}

	_runBombExplosing() {
		let removeFire = function (fire) {
			this.app.stage.removeChild(fire)
			this.fires.splice(this.fires.indexOf(fire), 1)
		}.bind(this)

		// move every fire of bomb
		for (let index = 0; index < this.fires.length; index++) {
			const fire = this.fires[index]

			// remove fire
			if (fire.dist == 0) {
				removeFire(fire)
				index--
				continue
			}
			if (this._unitInPoint(fire)) {

				var cell = this._getNextUnitCell(fire)
				switch (cell.cell) {
				// destroy wall
				case this.MapCellType.Wall:
					var wall = this._destroyWallAtPos(cell.dX, cell.dY)
					this.app.stage.removeChild(wall)
					removeFire(fire)
					index--
					continue
					// column
				case this.MapCellType.Column:
					removeFire(fire)
					index--
					continue
					// other bomb
				case this.MapCellType.Bomb:
					this._bombExplodeAtPos(cell.dX, cell.dY)
					removeFire(fire)
					index--
					continue
				}
			}
			var edx = fire.vx * options.explodeSpeed
			var edy = fire.vy * options.explodeSpeed
			fire.dist = fire.dist - Math.abs(edx - edy)

			fire.x += edx
			fire.y += edy


			// kill enemies
			for (let y = 0; y < this.enemies.length; y++) {
				const enemy = this.enemies[y]
				if (this._hitTestRectangle(fire, enemy)) {
					this.app.stage.removeChild(enemy)
					y--
					this.enemies.splice(this.enemies.indexOf(enemy), 1)
				}
			}

			// kill player
			if (this._hitTestRectangle(fire, this.player)) {
				this._killPlayer()
			}

		}
	}

}


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
	wallsThreshold: 0.65,
	margin: 300
}



options.speed = options.playerSize / options.speedFrames
options.explodeSpeed = options.playerSize / options.explodeSpeedFrames

//Create a Pixi Application
let app = new PIXI.Application({
	width: 850,
	height: 650
})

let engine = new PixiEngine(options, app)
engine.InitGame()

document.body.appendChild(app.view)


// Init textures
const baseTexture = new PIXI.BaseTexture.from(textureAtlasImg, null, 1)
const spritesheet = new PIXI.Spritesheet(baseTexture, textureAtlas)
spritesheet.parse(function () {

	app.ticker.add(() => engine.Refresh())

})


