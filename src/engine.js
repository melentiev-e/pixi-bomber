
export default class Engine {

	/**
	 * 
	 * @param {GameField} gameField 
	 * @param {StartGameStage} startStage 
	 * @param {*} endStage 
	 */
	constructor(gameField, startStage, gameOverStage, nextLevelStage, endStage) {


		this.GameField = gameField
		this.GameField.OnKillPlayer = this._onKillPlayer.bind(this)
		this.GameField.OnLevelPass = this._onLevelPass.bind(this)

		this.StartStage = startStage
		this.StartStage.OnStart = this._onGameStart.bind(this)

		this.GameOverStage = gameOverStage
		this.GameOverStage.OnTimeout = this._onGameOverTimeout.bind(this)

		this.NextLevelStage = nextLevelStage
		this.NextLevelStage.OnTimeout = this._onNextLevelTimeout.bind(this)

		this.EndStage = endStage
		this.Level = 1
		this.CurrentStage = undefined

	}
	_onLevelPass(){
		this.GameField.options.enemiesCount++
		this.NextLevelStage.Render(++this.Level)
		this.CurrentStage = this.NextLevelStage
	}
	_onKillPlayer() {
		this.GameOverStage.Render()
		this.CurrentStage = this.GameOverStage
	}

	_onGameOverTimeout() {
		this.StartStage.Render()
		this.CurrentStage = this.StartStage
	}
	_onNextLevelTimeout(){
		
		this.GameField.RunLevel(this.Level)
		this.CurrentStage = this.GameField
	}
	_onGameStart() {
		this.NextLevelStage.Render(this.Level)
		this.CurrentStage = this.NextLevelStage
	}
	Launch() {

		this.StartStage.Render()
		this.CurrentStage = this.StartStage

	}
	Refresh() {

		if (!this.CurrentStage) {
			return
		}
		this.CurrentStage.Refresh()
	}
}
