import commonFunctions from '../common-functions'
import Stage from './common-stage'
export default class GameField extends Stage {

	constructor(options) {
		super(options)

		
		this._cleanUp()
		this._initKeyboardHandlers()
	}

	get MapCellType() {
		return {
			Empty: 0,
			Player: 1,
			Wall: 2,
			Column: 3,
			Bomb: 4,
			Enemy: 5
		}
	}

	get Directions() {
		return {
			Top: 0,
			Right: 1,
			Bottom: 2,
			Left: 3
		}
	}

	/** Start new level */
	RunLevel(level) {
		this.CleanUp()
		this.level = level
		this.Render()
	}

	/** Clean game stage */
	CleanUp() {
		this._cleanUp()
		super.CleanUp()
	}
	_cleanUp(){
		this.door = undefined
		this.player = undefined
		this.walls = []
		this.columns = []
		this.enemies = []
		this.bombs = []
		let helpersCount = this._randomInt(1, 9)
		this.helpers = {
			manualBombTriggering:	{ count: 1, collected: 0, items: [], creator: this.CreateManualBombTriggeringHelper },
			bombsCount: { count: helpersCount, collected: 0, items: [], creator: this.CreateBombsCountHelper },
			bombsExplodeArea: { count: 10 - helpersCount, collected: 0, items: [], creator: this.CreateBombsExplodeAreaHelper }
		}
	}
	_onGetTheDoor() {
		if (this.enemies.length > 0) {
			return false
		}
		this.active = false
		this.CleanUp()
		this.OnLevelPass()
		return true
	}
	OnLevelPass() {

	}
	_refreshEnemy(enemy) {

		if (!this.active) {
			return
		}

		if (this._unitInPoint(enemy)) {
			enemy.x = Math.fround(enemy.x)
			enemy.y = Math.fround(enemy.y)
			var nextCell = this._getNextUnitCell(enemy)
			var otherCells = []
			if (!nextCell.isFree) {
				this._rotateUnit(enemy, 2)
			}
			this._rotateUnitLeft(enemy)
			otherCells.push(this._getNextUnitCell(enemy))
			this._rotateUnitRight(enemy)
			otherCells.push(this._getNextUnitCell(enemy))
			this._rotateUnitRight(enemy)
			otherCells.push(this._getNextUnitCell(enemy))
			otherCells = otherCells.filter(c => c.isFree)
			if (otherCells.length > 0) {
				var randomIndex = this._randomInt(0, otherCells.length - 1)
				var randomCell = otherCells[randomIndex]
				enemy.vx = randomCell.dX - enemy.rX
				enemy.vy = randomCell.dY - enemy.rY
				enemy.speed = enemy._speed || enemy.speed
			}
			else if (enemy.speed > 0) {
				enemy._speed = enemy.speed
				enemy.speed = 0
			}
		}
		var edx = enemy.vx * enemy.speed
		var edy = enemy.vy * enemy.speed
		this.OnEnemyMoving(enemy,enemy.vx,enemy.vy)
		enemy.x += edx
		enemy.y += edy
		if (this._hitTestRectangle(enemy, this.player)) {
			this._onKillPlayer()
		}
	}


	_destroyWallAtPos(x, y) {
		var wall = this.walls.find(w => w.rX == x && w.rY == y)
		this.walls.splice(this.walls.indexOf(wall), 1)
		this.OnWallDestroyed(x,y)
		this.map[y][x] = this.MapCellType.Empty
		return wall
	}

	// eslint-disable-next-line no-unused-vars
	OnWallDestroyed(x,y){}

	/** Refresh player position on the map */
	_refreshPlayer() {
		if (this._unitInPoint(this.player)) {
			this.player.x = Math.fround(this.player.x)
			this.player.y = Math.fround(this.player.y)
			this.player.lastX = this.player.rX
			this.player.lastY = this.player.rY
			let nextCell = this._getNextUnitCell(this.player)

			if ((this.player.vx || this.player.vy) && nextCell.isFree) {
				this.player.lastVx = this.player.vx
				this.player.lastVy = this.player.vy
			} else {
				this.player.lastVx = 0
				this.player.lastVy = 0
			}
		}

		// check door hit
		if (this.door && this._hitTestRectangle(this.door, this.player)) {
			if (this._onGetTheDoor()) {
				return
			}
		}

		// check helpers hit
		this._testGettingHelpers()

		var dx = this.options.speed * this.player.lastVx
		var dy = this.options.speed * this.player.lastVy

		// on moving 
		this.OnPlayerMoving(this.player.lastVx, this.player.lastVy)
		this.player.x += dx
		this.player.y += dy
	}
	OnGetHelper(){}
	// eslint-disable-next-line no-unused-vars
	OnPlayerMoving(dx,dy){}
	// eslint-disable-next-line no-unused-vars
	OnEnemyMoving(enemy,dx,dy){}

	/** Check if player get a helper */
	_testGettingHelpers(){
		for (const key in this.helpers) {
			let helperType = this.helpers[key]
			for (const helper of helperType.items) {
				if(!helper.ischecked && this._hitTestRectangle(helper, this.player)){
					helper.ischecked = true
					helperType.collected++
					this.OnGetHelper(helper)
				}
			}
		}
	}


	/**
	 * Refresh player and enemies positon on the map
	 */
	Refresh() {
		if (!this.active) {
			return
		}
		this._refreshPlayer()

		for (const enemy of this.enemies) {
			this._refreshEnemy(enemy)
		}
	}

	_onKillPlayer() {
		if (!this.active) {
			return
		}
		this.active = false
		this.CleanUp()
		this.OnKillPlayer()
	}

	OnKillPlayer() {

	}

	/**
     * Initialize game field
     */
	Render() {
		this._createMap()
		this._fillColumns()
		this._initPlayer()
		this._fillWalls()
		this._setUpDoor()
		this._setUpHelpers()

		this._createEnemies()
		super.Render()
	}

	/**
     * Create clear map of the game field
     */
	_createMap() {
		this.map = []
		for (let row = 0; row < this.options.height; row++) {
			this.map[row] = []
			for (let col = 0; col < this.options.width; col++) {
				this.map[row][col] = this.MapCellType.Empty
			}
		}
	}


	/**
	 * Placing player helpers in free cells
	 */
	_setUpHelpers() {
		let getFreeWall = () => {
			var walls = this.walls.filter((w) => !w.busy)
			return walls[this._randomInt(0, walls.length - 1)]
		}

		for (const key in this.helpers) {
			let helperDescription = this.helpers[key]
			for (let index = 0; index < helperDescription.count; index++) {
				var wall = getFreeWall()
				wall.busy = true
				let helperItem = helperDescription.creator.call(this, wall.x, wall.y)
				this._initObjectFunctions(helperItem)
				helperDescription.items.push(helperItem)
			}
		}
	}


	_setUpDoor() {
		var randomIndex = this._randomInt(0, this.walls.length - 1)
		var wall = this.walls[randomIndex] || { x: 0, y: 0 }
		wall.busy = true
		
		this.door = this.CreateDoor(wall.x, wall.y)
		this._initObjectFunctions(this.door)
	}

	_setUpBomb() {

		if (this.map[this.player.lastY][this.player.lastX] == this.MapCellType.Bomb) {
			return
		}
		if (this.bombs.length >= this.options.maxBombCount + this.helpers.bombsCount.collected) {
			return
		}

		this.map[this.player.lastY][this.player.lastX] = this.MapCellType.Bomb
		let bomb = this.CreateBomb(this.player.lastX, this.player.lastY)
		this._initObjectFunctions(bomb)


		// bomb explode only manualy if option is set
		if (!this.helpers.manualBombTriggering.collected) {
			bomb.explodeTimer = setTimeout(() => this._bombExplode(bomb), this.options.bombTimer)
		}
		this.bombs.push(bomb)
	}

	_bombExplodeAtPos(x, y) {
		var nextBomb = this.bombs.find(b => b.rX == x && b.rY == y)
		this._bombExplode(nextBomb)
	}

	_bombExplode(bomb) {
		if (bomb.exploded) {
			return
		}
		bomb.exploded = true
		this.map[bomb.rY][bomb.rX] = this.MapCellType.Empty
		this.bombs.splice(this.bombs.indexOf(bomb), 1)
		this.OnBombExploded(bomb)

	}

	/**
	 * Check if player is in neigbour cell
	 */
	_isPlayerNear(x, y, arr = []) {

		if (arr.includes(x + '-' + y)) {
			return false
		}
		if (x == 1 && y == 1) {
			return true
		}
		if (this.map[y][x] != this.MapCellType.Empty) {
			return false
		}
		arr.push(`${x}-${y}`)

		return this._isPlayerNear(x + 1, y, arr) || this._isPlayerNear(x, y + 1, arr) || this._isPlayerNear(x - 1, y, arr) || this._isPlayerNear(x, y - 1, arr)

	}

	/**
	 * Create array of walls 
	 */
	_fillWalls() {
		for (let row = 1; row < this.options.height - 1; row += 1) {
			for (let col = 1; col < this.options.width - 1; col += 1) {

				// skip columns positions
				if (col % 2 == 0 && row % 2 == 0) {
					continue
				}
				// TODO: make better
				// skip player position
				if (col == 1 && row == 1 || col == 1 && row == 2 || col == 2 && row == 1) {
					continue
				}
				if (Math.random() > this.options.wallsThreshold) {
					this.map[row][col] = this.MapCellType.Wall
					let wall = this.CreateWall(col, row)
					this._initObjectFunctions(wall)
					this.walls.push(wall)
				}
			}
		}
	}

	/**
	 * Create column in position
	 * @param {Number} x X position
	 * @param {Number} y Y position
	 */
	_createColumn(x, y) {
		this.map[y][x] = this.MapCellType.Column
		this.columns.push(this.CreateColumn(x, y))
	}

	/**
	 * Generate fixed columns
	 */
	_fillColumns() {
		// Create borders
		for (let row = 0; row < this.options.height; row++) {
			for (let col = 0; col < this.options.width; col++) {
				if (row > 0 && row < this.options.height - 1 && col > 0 && col < this.options.width - 1) {
					continue
				}
				this._createColumn(col, row)
			}
		}
		// create columns
		for (let row = 2; row < this.options.height - 1; row += 2) {
			for (let col = 2; col < this.options.width - 1; col += 2) {
				this._createColumn(col, row)
			}
		}
	}

	_getFreeMapIndexes() {
		var freeIndexes = []
		for (let row = 0; row < this.options.height; row++) {
			for (let col = 0; col < this.options.width; col++) {
				if (this.map[row][col] == this.MapCellType.Empty && !this._isPlayerNear(col, row)) {
					freeIndexes.push([row, col])
				}
			}
		}
		return freeIndexes
	}

	/**
	* Create enemy units in free places
	*/
	_createEnemies() {

		// free cells
		var freeIndexes = this._getFreeMapIndexes()
		for (let i = 0; i < this.options.enemiesCount; i++) {
			var randomIndex = this._randomInt(0, freeIndexes.length - 1)

			var row = freeIndexes[randomIndex][0]
			var col = freeIndexes[randomIndex][1]
			this.map[row][col] = this.MapCellType.Enemy
			let enemy = this.CreateEnemy(col, row)
			this._initObjectFunctions(enemy)
			this.enemies.push(enemy)

		}
	}

	_getNextUnitCell(unit) {
		var x = unit.rX,
			y = unit.rY,
			cell = this.map[y + unit.vy][x + unit.vx]

		return {
			cell,
			dX: x + unit.vx,
			dY: y + unit.vy,
			isFree: !([this.MapCellType.Wall, this.MapCellType.Column, this.MapCellType.Bomb].includes(cell))
		}
	}

	_initObjectFunctions(obj) {
		Object.defineProperties(obj, {
			rX: {
				get: () => Math.fround(obj.x) / this.options.playerSize
			},
			rY: {
				get: () => Math.fround(obj.y) / this.options.playerSize
			}
		})
	}
	_initPlayer() {

		this.player = {
			x: 1,
			y: 1,
			lastX: 1,
			lastY: 1
		}
		this.player = this.CreatePlayer()

		this.player.vx = 0
		this.player.vy = 0
		this.player.lastVx = 0
		this.player.lastVy = 0
		this.player.lastX = 1
		this.player.lastY = 1
		this._initObjectFunctions(this.player)

	}

	/**
     * Initialize keyboard navigation handlers
     */
	_initKeyboardHandlers() {


		let arrowFunctionDown = (direction) => {
			if (!this.active) {
				return
			}
			switch (direction) {
			case 'left':
				this.player.vx = -1; this.player.vy = 0
				break
			case 'up':
				this.player.vy = -1; this.player.vx = 0
				break
			case 'right':
				this.player.vx = 1; this.player.vy = 0
				break
			case 'down':
				this.player.vy = 1; this.player.vx = 0
				break
			}
		}
		let arrowFunctionRelease = (direction) => {
			if (!this.active) {
				return
			}
			switch (direction) {
			case 'left':
			case 'right':
				this.player.vx = 0
				break
			case 'up':
			case 'down':
				this.player.vy = 0
				break
			}
		}

		let left = commonFunctions.keyboard(37),
			up = commonFunctions.keyboard(38),
			right = commonFunctions.keyboard(39),
			down = commonFunctions.keyboard(40),
			space = commonFunctions.keyboard(32),
			ctrl = commonFunctions.keyboard(17)
		// Left arrow key `press` method
		left.press = () => { arrowFunctionDown('left') }
		left.release = () => { arrowFunctionRelease('left') }
		// Up
		up.press = () => { arrowFunctionDown('up') }
		up.release = () => { arrowFunctionRelease('up') }
		// Right
		right.press = () => { arrowFunctionDown('right') }
		right.release = () => { arrowFunctionRelease('right') }
		// Down
		down.press = () => { arrowFunctionDown('down') }
		down.release = () => { arrowFunctionRelease('down') }

		// manual bomb exploding
		ctrl.release = () => {
			if (!this.active || !this.helpers.manualBombTriggering.collected || this.bombs.length == 0) {
				return
			}
			this._bombExplode(this.bombs[0])
		}
		space.release = () => {
			if (!this.active) {
				return
			}
			this._setUpBomb()
		}
	}



	_hitTestRectangle(r1, r2) {

		// Define the variables we'll need to calculate
		let hit; let combinedHalfWidths; let combinedHalfHeights; let vx; let
			vy

		// hit will determine whether there's a collision
		hit = false

		// Find the center points of each sprite
		r1.centerX = r1.x + r1.width / 2
		r1.centerY = r1.y + r1.height / 2
		r2.centerX = r2.x + r2.width / 2
		r2.centerY = r2.y + r2.height / 2

		// Find the half-widths and half-heights of each sprite
		r1.halfWidth = r1.width / 2
		r1.halfHeight = r1.height / 2
		r2.halfWidth = r2.width / 2
		r2.halfHeight = r2.height / 2

		// Calculate the distance vector between the sprites
		vx = r1.centerX - r2.centerX
		vy = r1.centerY - r2.centerY

		// Figure out the combined half-widths and half-heights
		combinedHalfWidths = r1.halfWidth + r2.halfWidth
		combinedHalfHeights = r1.halfHeight + r2.halfHeight

		// Check for a collision on the x axis
		if (Math.abs(vx) < combinedHalfWidths) {

			// A collision might be occurring. Check for a collision on the y axis
			if (Math.abs(vy) < combinedHalfHeights) {

				// There's definitely a collision happening
				hit = true
				window.r1 = r1; window.r2 = r2

			} else {


				// There's no collision on the y axis
				hit = false
			}
		} else {

			// There's no collision on the x axis
			hit = false
		}

		// `hit` will be either `true` or `false`
		return hit
	}

	_contain(sprite, container) {

		let collision

		// Left
		if (sprite.x < container.x) {
			sprite.x = container.x
			collision = 'left'
		}

		// Top
		if (sprite.y < container.y) {
			sprite.y = container.y
			collision = 'top'
		}

		// Right
		if (sprite.x + sprite.width > container.width) {
			sprite.x = container.width - sprite.width
			collision = 'right'
		}

		// Bottom
		if (sprite.y + sprite.height > container.height) {
			sprite.y = container.height - sprite.height
			collision = 'bottom'
		}

		// Return the `collision` value
		return collision
	}

	_unitInPoint(unit) {
		return unit.rX.toFixed() == unit.rX &&
			unit.rY.toFixed() == unit.rY
	}

	_randomInt(min, max) {
		return Math.floor(Math.random() * (max - min + 1)) + min
	}

	_rotateUnitLeft(unit) {
		this._rotateUnit(unit, 3)
	}

	_rotateUnitRight(unit) {
		this._rotateUnit(unit, 1)
	}

	_rotateUnit(unit, count) {

		for (let i = 0; i < count; i++) {
			let a = unit.vx
			unit.vx = -unit.vy
			unit.vy = a
		}
	}

	CreatePlayer() {

	}
	// eslint-disable-next-line
	CreateWall(x, y) {

	}
	// eslint-disable-next-line
	CreateColumn(x, y) {

	}
	// eslint-disable-next-line
	CreateEnemy(x, y) {

	}
	// eslint-disable-next-line
	CreateBomb(x, y) {

	}
	// eslint-disable-next-line
	CreateDoor(x, y) {

	}

}
