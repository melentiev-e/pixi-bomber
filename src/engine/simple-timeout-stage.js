import Stage from './common-stage'


export default class SimpleTimeoutStage extends Stage{
	constructor(options) {
		super(options)
	}	
	OnTimeout(){
		
	}
	_onTimeout(){
		this.CleanUp()
		this.OnTimeout()
	}
	Render(){
		this.timer = setTimeout(()=> this._onTimeout(), 2000)
		super.Render()
	}
}
