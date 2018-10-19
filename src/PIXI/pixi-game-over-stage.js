import * as PIXI from 'pixi.js'
import SimpleTimeoutStage from '../engine/simple-timeout-stage'

export default class PixiGameOverStage extends SimpleTimeoutStage{
	constructor(options, app) {
		super(options)
		this.app = app
	}
	
	CleanUp(){
		this.app.stage.removeChild(this.stage)
		super.CleanUp()
	}

	Render(){

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
		let text = new PIXI.Text('GAME OVER', style)
		text.anchor.set(0.5, 0)
		text.x = this.stage.width / 2
		text.y = this.stage.height / 2
		this.stage.addChild(text)

		this.app.stage.addChild(this.stage)

		super.Render()
	}
	
}
