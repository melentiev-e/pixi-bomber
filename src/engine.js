
import GameField from './engine/game-field' 
import StartGameStage from './engine/start-stage' 

export default class Engine {

	/**
	 * 
	 * @param {GameField} gameField 
	 * @param {StartGameStage} startStage 
	 * @param {*} endStage 
	 */
	constructor(gameField, startStage, endStage) {
		

		this.GameField = gameField
		this.GameField.OnKillPlayer = this._onKillPlayer.bind(this)

		this.StartStage = startStage
		this.StartStage.OnStart = this._onGameStart.bind(this)

		this.EndStage = endStage


		this.CurrentStage = undefined

	}
	_onKillPlayer(){
		this.GameField.CleanUp()
		this.StartStage.Render()
		this.CurrentStage = this.StartStage

	}

	_onGameStart(){
		this.StartStage.CleanUp()

		this.GameField.RunLevel(1)
		this.CurrentStage = this.GameField
	}
	Launch(){

		this.StartStage.Render()
		this.CurrentStage = this.StartStage

	}
	Refresh(){

		if(!this.CurrentStage){
			return
		}
		this.CurrentStage.Refresh()
	}
}
