export default class Stage {

	constructor(options) {
		this.options = options

		this.active = false
	}

	Activate(){
		this.active = true
	}
	Deactivate(){
		this.active = false
	}
	Refresh(){
		
	}

	Render(){
		this.Activate()
	}
	CleanUp(){
		this.Deactivate()
		
	}
}
