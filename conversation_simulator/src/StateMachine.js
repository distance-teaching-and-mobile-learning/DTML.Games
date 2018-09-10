import Phaser from 'phaser'
import _ from 'lodash'
import jQuery from 'jquery'

export default class {
    constructor(stateData) {
        this.score = 0;
        this.stateData = stateData;
        this.setCurrentState(this.stateData.StartAt, this.stateData.States[this.stateData.StartAt]);
        this.submitSolutionResult = true;
    }

    setCurrentState(stateName, stateData) {
        console.log(`State transition: '${this.currentStateName}' => '${stateName}'`);

        this.currentStateName = stateName;
        this.currentState = stateData;
    }

    printDebugInfo() {
        console.log(JSON.stringify(this.stateData));
    }

    getQuestion() {
        return this.currentState.Question;
    }

    getScore() {
        return this.score;
    }

    getOnEnterLeft(){
        if(this.currentState.OnStateEnter!=null){
        return this.currentState.OnStateEnter.Left;
    }else{
       return null; 
    }
    }

    getOnEnterRight(){
        if(this.currentState.OnStateEnter!=null){
        return this.currentState.OnStateEnter.Right;
    }else{
       return null; 
    }
    }

    getOnExitLeft(){
        if(this.currentState.OnStateExit!=null){
        return this.currentState.OnStateExit.Left;
    }else{
       return null; 
    }
    }

     getOnExitRight(){
        if(this.currentState.OnStateExit!=null){
        return this.currentState.OnStateExit.Right;
    }else{
       return null; 
    }
    }

    getOnExitBg(){
        if(this.currentState.OnStateExit!=null){
        return this.currentState.OnStateExit.Background;
    }else{
       return null; 
    }
    }

    getOnEnterBg(){
        if(this.currentState.OnStateEnter!=null){
        return this.currentState.OnStateEnter.Background;
    }else{
       return null; 
    }
    }


    getAnswerWords() {
        return this.currentState.AnswerWords;
    }

    set submitSolutionResult(value) {
        this._submitSolutionResult = value;
    }

    get submitSolutionResult() {
        return this._submitSolutionResult;
    }

    submitSolution(solutionPhrase) {

        var normalizedPhrase = solutionPhrase.toLowerCase().trim();
        console.log(`Checking solution: '${normalizedPhrase}'. Current state is '${this.currentStateName}'`);

        // Select solution, or default
        var solution = this.currentState.Solutions[normalizedPhrase] || this.currentState.Solutions.default;

        // Apply score

        jQuery.get("https://dtml.org/api/GameService/ScorePhrase/?phrase=" + solutionPhrase.trim(), (result) => {

            if (solution.Next !== null) {
                this.setCurrentState(solution.Next, this.stateData.States[solution.Next]);
                this.submitSolutionResult = true;
                this.score += result;
            }
            else {
                this.submitSolutionResult = false;
                //this.score -= result;
            }
        });
        //https://dtml.org/api/GameService/ScorePhrase/?phrase=eggs%27please 

        //this.score += solution.Score;

        // Transition to next state
    }
}
