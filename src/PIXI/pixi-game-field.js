import * as PIXI from 'pixi.js'
import GameField from '../engine/game-field'

export default class PixiGameField extends GameField {
	constructor(options, app) {
		super(options)
		this.app = app
		this.fires = []
	}

	// Cleaning the level and all other objects
	CleanUp() {
		this.stage && this.stage.destroy()
		this.walls.forEach(wall => wall.destroy())
		this.columns.forEach(column => column.destroy())
		this.fires.forEach(fire => fire.destroy())
		this.enemies.forEach(enemy => enemy.destroy())
		this.door && this.door.destroy()
		this.player && this.player.destroy()
		this.fires = []
		super.CleanUp()
	}

	OnGetHelper(helper) {
		helper.destroy()
	}
	OnBombExploded(bomb) {
		for (let index = 0; index < 4; index++) {
			let fire = new PIXI.Graphics()
			fire.beginFill(this.options.colors.fire)
			fire.drawEllipse(this.options.playerSize / 2, this.options.playerSize / 2, this.options.playerSize / 2, this.options.playerSize / 2)
			fire.options = this.options
			fire.x = bomb.x
			fire.y = bomb.y
			fire.vx = 1
			fire.vy = 0
			this._initObjectFunctions(fire)
			fire.dist = this.options.playerSize * (this.options.bombExplodeArea + this.helpers.bombsExplodeArea.collected)
			fire.endFill()
			this._rotateUnit(fire, index)
			this.fires.push(fire)
			this.stage.addChild(fire)
		}

		this.stage.removeChild(bomb)
	}


	CreateColumn(x, y) {

		var type = Math.round(Math.random()*10) % 2 ? 'a':'b'
		let column = new PIXI.Sprite(this.app.spritesheet.textures[`stone_${type}`])
		
		column.x = x * this.options.playerSize
		column.y = y * this.options.playerSize
		this.stage.addChild(column)
		return column
	}
	CreateWall(x, y) {
		let wall =  new PIXI.Sprite(this.app.spritesheet.textures['wall'])
		wall.x = x * this.options.playerSize
		wall.y = y * this.options.playerSize
		
		this.stage.addChild(wall)
		return wall
	}

	CreatePlayer() {
		// init player

		let container = new PIXI.Container()

		let textures = this.app.spritesheet.textures

		let animations = {
			hero_left: [textures.hero_left_1, textures.hero_left_2, textures.hero_left_3, textures.hero_left_2],
			hero_top: [textures.hero_top_1, textures.hero_top_2, textures.hero_top_3, textures.hero_top_2],
			hero_bottom: [textures.hero_bottom_1, textures.hero_bottom_2, textures.hero_bottom_3, textures.hero_bottom_2]
		}

		
		let player = new PIXI.Sprite(this.app.spritesheet.textures['hero_front'])
		let toLeft = new PIXI.extras.AnimatedSprite(animations.hero_left)
		let toRight = new PIXI.extras.AnimatedSprite(animations.hero_left)
		toRight.scale.x = -1
		toRight.x = 50
		let toTop = new PIXI.extras.AnimatedSprite(animations.hero_top)
		let toBottom = new PIXI.extras.AnimatedSprite(animations.hero_bottom)
		let playerMoveAnimations = {
			player,
			toLeft,
			toRight,
			toBottom,
			toTop
		}

		for (const key in playerMoveAnimations) {
			const animation = playerMoveAnimations[key]
			animation.visible = false
			animation.name = key
			animation.animationSpeed = 0.15
			container.addChild(animation)
		}
		player.visible = true
		container.x = this.options.playerSize
		container.y = this.options.playerSize

		this.stage.addChild(container)
		return container
	}
	CreateEnemy(x, y) {
		let enemy = new PIXI.Container()
		enemy.x = x * this.options.playerSize
		enemy.y = y * this.options.playerSize
		enemy.vx = 0
		enemy.vy = 1
		enemy.options = this.options
		enemy.speed = this.options.playerSize / this.options.enemySpeedFrames


		let textures = this.app.spritesheet.textures

		let animations = {
			enemy_front: [textures.enemy_front_1, textures.enemy_front_2, textures.enemy_front_3, textures.enemy_front_2],
			enemy_left: [textures.enemy_left_1, textures.enemy_left_2, textures.enemy_left_3, textures.enemy_left_2],
			enemy_top: [textures.enemy_top_1, textures.enemy_top_2, textures.enemy_top_3, textures.enemy_top_2],
			enemy_bottom: [textures.enemy_bottom_1, textures.enemy_bottom_2, textures.enemy_bottom_3, textures.enemy_bottom_2],
			enemy_right: [textures.enemy_left_1, textures.enemy_left_2, textures.enemy_left_3, textures.enemy_left_2]
		}

		let enemyMoveAnimations = {
			front: new PIXI.extras.AnimatedSprite(animations.enemy_front),
			left: new PIXI.extras.AnimatedSprite(animations.enemy_left),
			top: new PIXI.extras.AnimatedSprite(animations.enemy_top),
			bottom: new PIXI.extras.AnimatedSprite(animations.enemy_bottom),
			right: new PIXI.extras.AnimatedSprite(animations.enemy_left)
		}

		for (const direction in enemyMoveAnimations) {
			let animation = enemyMoveAnimations[direction]
			animation.animationSpeed = 0.12
			animation.name = direction
			animation.visible = false
			enemy.addChild(animation)
		}
		enemyMoveAnimations.right.scale.x = -1
		enemyMoveAnimations.right.x = 50


		enemyMoveAnimations.front.visible = true
		enemyMoveAnimations.front.play()
		this.stage.addChild(enemy)
		return enemy
	}
	CreateBomb(x, y) {
		let textures = this.app.spritesheet.textures
		let bombAnimation = new PIXI.extras.AnimatedSprite([textures.bomb_1,textures.bomb_2,textures.bomb_3,textures.bomb_2])
		bombAnimation.play()
		bombAnimation.animationSpeed = 0.2

		let bomb = new PIXI.Container()	
		bomb.x = x * this.options.playerSize
		bomb.y = y * this.options.playerSize	
		bomb.exploded = false
		bomb.addChild(bombAnimation)
		this.stage.addChild(bomb)
		return bomb
	}


	//#region HELPERS 
	CreateManualBombTriggeringHelper(x, y) {
		let helper = new PIXI.Sprite(this.app.spritesheet.textures['manual_trigger'])
		helper.x = x
		helper.y = y
		helper.visible = false
		this.stage.addChildAt(helper, this.stage.getChildIndex(this.player))
		return helper
	}
	CreateBombsCountHelper(x, y) {
		let helper = new PIXI.Sprite(this.app.spritesheet.textures['bomb_count'])
		helper.x = x
		helper.y = y
		helper.visible = false
		this.stage.addChildAt(helper, this.stage.getChildIndex(this.player))
		return helper
	}
	CreateBombsExplodeAreaHelper(x, y) {
		let helper = new PIXI.Sprite(this.app.spritesheet.textures['fire_size'])
		helper.x = x
		helper.y = y
		helper.visible = false
		this.stage.addChildAt(helper, this.stage.getChildIndex(this.player))
		return helper
	}
	CreateDoor(x, y) {
		let helper = new PIXI.Sprite(this.app.spritesheet.textures['door'])
		helper.x = x
		helper.y = y
		helper.visible = false
		this.stage.addChildAt(helper, this.stage.getChildIndex(this.player))
		return helper
	}

	OnWallDestroyed(x,y){
		for (const key in this.helpers) {
			if (this.helpers.hasOwnProperty(key)) {
				const helper = this.helpers[key]
				let helpeItem = helper.items.find( item => !item.visible && item.rX == x && item.rY == y)
				if(helpeItem){
					helpeItem.visible = true
					return
				}
			}
		}
		if(this.door.rX == x && this.door.rY == y){
			this.door.visible = true
		}
	}
	//#endregion 


	Render() {

		this.stage = new PIXI.Container()

		this.app.stage.addChild(this.stage)
		this.background = new PIXI.Graphics()
		this.background.beginFill(this.options.colors.background)
		this.background.drawRect(0, 0, this.options.width * this.options.playerSize, this.options.height * this.options.playerSize)
		this.background.endFill()
		this.stage.addChild(this.background)
		super.Render()
	}

	// Global refreshing scene
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

	// Change current Enemy animation
	OnEnemyMoving(enemy, dx, dy) {
		enemy.children.forEach(a => {
			a.stop()
			a.visible = false
		})
		let name
		if (dx > 0) {
			name = 'right'
		} else if (dx < 0) {
			name = 'left'
		} else if (dy > 0) {
			name = 'bottom'
		} else if (dy < 0) {
			name = 'top'
		} else {
			name = 'front'
		}
		let animation = enemy.getChildByName(name)
		animation.visible = true
		animation.play()
	}

	// Change current Player animation
	OnPlayerMoving(dx, dy) {
		this.player.children.forEach(a => {
			a.stop && a.stop()
			a.visible = false
		})
		
		let name
		if (dx > 0) {
			name = 'toRight'
		} else if (dx < 0) {
			name = 'toLeft'
		} else if (dy > 0) {
			name = 'toBottom'
		} else if (dy < 0) {
			name = 'toTop'
		} else {
			name = 'player'
		}
		let animation = this.player.getChildByName(name)
		animation.visible = true
		animation.play && animation.play()
	}

	_runBombExplosing() {
		let removeFire = function (fire) {
			this.stage.removeChild(fire)
			this.fires.splice(this.fires.indexOf(fire), 1)
		}.bind(this)

		if (!this.active) {
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

