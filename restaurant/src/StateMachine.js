import Phaser from 'phaser'

export default class {
    constructor(stateData) {
        this.stateData = stateData;
        this.currentState = this.stateData.States[this.stateData.StartAt];
    }   

    printDebugInfo() {
        console.log(JSON.stringify(this.stateData));
    }

    getQuestion() {
        return this.currentState.Question;
    }

    getAnswerWords() {
        return this.currentState.AnswerWords;
    }
}
