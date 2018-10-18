import commonFunctions from '../common-functions'
import Stage from './common-stage'


export default class StartGameStage extends Stage{
	constructor(options) {
		super(options)

		this.items = [
			'START',
			'EXIT'
		]
		this.position = 0
		this._initKeyboardHandlers()
	}	
	OnStart(){

	}
	OnExit(){
		this.CleanUp()
	}
	_initKeyboardHandlers(){
		let up = commonFunctions.keyboard(38),
			down = commonFunctions.keyboard(40),
			space = commonFunctions.keyboard(32),
			enter = commonFunctions.keyboard(13)
			
		up.press = () => { this.active && (this.position = Math.max(this.position-1,0)) }
		down.press = () => { this.active && (this.position = Math.min(this.position+1,1)) }

		space.press = enter.press = () => { 
			
			if(!this.active){
				return
			}
			if(this.position == 0){
				this.OnStart()
			}else{
				this.OnExit()
			}
		}
	}
}
