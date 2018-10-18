import * as PIXI from 'pixi.js'
import GameField from '../engine/game-field'

export default class PixiGameField extends GameField {
	constructor(options, app) {
		super(options)
		this.app = app
		
		this.fires = []
	}
	CleanUp(){
		this.stage && 
		this.stage.destroy()
		this.walls.forEach(wall => wall.destroy())
		this.columns.forEach(column => column.destroy())
		this.fires.forEach(fire => fire.destroy())
		this.enemies.forEach(enemy => enemy.destroy())
		this.door && this.door.destroy()
		this.player && this.player.destroy()
		this.fires = []
		super.CleanUp()
	}
	CreatePlayer() {
		// init player
		//  player = new PIXI.Sprite(this.textures["fpoint.png"]);
		let player = new PIXI.Graphics()
		player.beginFill(0x42f44e)
		player.drawEllipse(this.options.playerSize / 2, this.options.playerSize / 2, this.options.playerSize / 2, this.options.playerSize / 2)

		player.x = this.options.playerSize
		player.y = this.options.playerSize
		this.stage.addChild(player)
		return player
	}
	CreateWall(x, y) {
		let wall = new PIXI.Graphics()
		wall.beginFill(0xf49542)
		wall.drawRect(0, 0, this.options.playerSize, this.options.playerSize)
		wall.x = x * this.options.playerSize
		wall.y = y * this.options.playerSize
		wall.endFill()
		this.stage.addChild(wall)
		return wall
	}
	OnBombExploded(bomb) {
		for (let index = 0; index < 4; index++) {
			let fire = new PIXI.Graphics()
			fire.beginFill(0xff6e00)
			fire.drawEllipse(this.options.playerSize / 2, this.options.playerSize / 2, this.options.playerSize / 2, this.options.playerSize / 2)
			fire.options = this.options
			fire.x = bomb.x
			fire.y = bomb.y
			fire.vx = 1
			fire.vy = 0
			this._initObjectFunctions(fire)
			fire.dist = this.options.playerSize * this.options.fireSize
			fire.endFill()
			this._rotateUnit(fire, index)
			this.fires.push(fire)
			this.stage.addChild(fire)
		}

		this.stage.removeChild(bomb)
	}
	CreateColumn(x, y) {
		const rectangle = new PIXI.Graphics()
		rectangle.beginFill(0x66CCFF)
		rectangle.drawRect(0, 0, this.options.playerSize, this.options.playerSize)
		rectangle.endFill()
		rectangle.x = x * this.options.playerSize
		rectangle.y = y * this.options.playerSize
		this.stage.addChild(rectangle)
		return rectangle
	}
	CreateEnemy(x, y) {
		let enemy = new PIXI.Graphics()
		enemy.beginFill(0xf44242)
		enemy.drawEllipse(this.options.playerSize / 2, this.options.playerSize / 2, this.options.playerSize / 2, this.options.playerSize / 2)
		enemy.x = x * this.options.playerSize
		enemy.y = y * this.options.playerSize
		enemy.endFill()
		enemy.vx = 0
		enemy.vy = 1
		enemy.options = this.options
		enemy.speed = this.options.playerSize / this.options.enemySpeedFrames
		this.stage.addChild(enemy)
		return enemy
	}
	CreateBomb(x, y) {
		let bomb = new PIXI.Graphics()
		bomb.beginFill(0x000)
		bomb.drawEllipse(this.options.playerSize / 2, this.options.playerSize / 2, this.options.playerSize / 2, this.options.playerSize / 2)
		bomb.x = x * this.options.playerSize
		bomb.y = y * this.options.playerSize
		bomb.endFill()
		bomb.exploded = false
		this.stage.addChild(bomb)
		return bomb
	}
	CreateDoor(x, y) {
		var door = new PIXI.Graphics()
		door.beginFill(0x3f0fff)
		door.drawRect(0, 0, this.options.playerSize, this.options.playerSize)
		door.x = x
		door.y = y
		door.endFill()
		this.stage.addChildAt(door, this.stage.getChildIndex(this.player))
		return door
	}
	Render(){

		this.stage = new PIXI.Container()
		this.stage.width = this.options.width * this.options.playerSize
		this.stage.height = this.options.height * this.options.playerSize
		this.app.stage.addChild(this.stage)
		super.Render()
	}

	Refresh() {
		if (!this.active) {
			return
		}

		// move scene when player moves
		// width
		var dx1 = (this.app.view.width - this.options.margin) - (this.player.x + this.stage.x)
		var dx2 = this.options.margin - (this.player.x + this.stage.x)
		if (dx1 < 0) {
			this.stage.x = Math.max(this.stage.x + dx1, this.app.view.width - this.stage.width)
		}
		if (dx2 > 0) {
			this.stage.x = Math.min(0, this.stage.x + dx2)
		}
		// htight
		var dy1 = (this.app.view.height - this.options.margin) - (this.player.y + this.stage.y)
		var dy2 = this.options.margin - (this.player.y + this.stage.y)
		if (dy1 < 0) {
			this.stage.y = Math.max(this.stage.y + dy1, this.app.view.height - this.stage.height)
		}
		if (dy2 > 0) {
			this.stage.y = Math.min(0, this.stage.y + dy2)
		}
		super.Refresh()
		// bomb exploding
		this._runBombExplosing()
	}

	_runBombExplosing() {
		let removeFire = function (fire) {
			this.stage.removeChild(fire)
			this.fires.splice(this.fires.indexOf(fire), 1)
		}.bind(this)

		if(!this.active)
		{
			return
		}
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
					this.stage.removeChild(wall)
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
			var edx = fire.vx * this.options.explodeSpeed
			var edy = fire.vy * this.options.explodeSpeed
			fire.dist = fire.dist - Math.abs(edx - edy)

			fire.x += edx
			fire.y += edy


			// kill enemies
			for (let y = 0; y < this.enemies.length; y++) {
				const enemy = this.enemies[y]
				if (this._hitTestRectangle(fire, enemy)) {
					this.stage.removeChild(enemy)
					y--
					this.enemies.splice(this.enemies.indexOf(enemy), 1)
				}
			}

			// kill player
			if (this._hitTestRectangle(fire, this.player)) {
				this._onKillPlayer()
				removeFire(fire)
				index--
			}

		}
	}

}

