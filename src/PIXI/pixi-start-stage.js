import * as PIXI from 'pixi.js'
import StartGameStage from '../engine/start-stage'

export default class PixiStartGameStage extends StartGameStage {
	/**
	 * 
	 * @param {*} options Engine options
	 * @param {PIXI.Application} app 
	 */
	constructor(options, app) {
		super(options)
		this.app = app
	}


	Refresh() {
		if(!this.active){
			return
		}
		this.cursor.x = this.selectOptions[this.position].x - this.selectOptions[this.position].width / 2 - 16
		this.cursor.y = this.selectOptions[this.position].y + 16
	}


	Render() {
		this.stage = new PIXI.Container()
		this.background = new PIXI.Graphics()
		this.background.beginFill(this.options.colors.background)
		this.background.drawRect(0, 0, this.app.view.width, this.app.view.height)
		this.background.endFill()
		this.stage.addChild(this.background)

		let style = new PIXI.TextStyle({
			fontSize: 36,
			fill: this.options.colors.onBackground
		})

		this.selectOptions = this.items.map(el => new PIXI.Text(el, style))

		this.selectOptions.forEach((el, ind) => {
			el.anchor.set(0.5, 0)
			el.x = this.stage.width / 2
			el.y = this.stage.height / 2 - el.height + el.height * ind
			this.stage.addChild(el)
		})

		this.cursor = new PIXI.Graphics()
		this.cursor.beginFill(this.options.colors.onBackground)
		this.cursor.drawCircle(0, 0, 16)
		this.cursor.endFill()
		this.stage.addChild(this.cursor)

		this.app.stage.addChild(this.stage)

		super.Render()
	}

	CleanUp(){
		this.app.stage.removeChild(this.stage)
		super.CleanUp()
	}
}
