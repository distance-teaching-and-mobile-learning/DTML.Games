import Phaser from 'phaser'
import _ from 'lodash'

export default class {
    constructor(stateData) {
        this.score = 0;
        this.stateData = stateData;
        this.setCurrentState(this.stateData.StartAt, this.stateData.States[this.stateData.StartAt]);
    }  
    
    setCurrentState(stateName, stateData) {
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

    getAnswerWords() {
        return this.currentState.AnswerWords;
    }

    submitSolution(solutionPhrase) {
        
        // Select solution, or default
        var solution = this.currentState.Solutions[solutionPhrase.toLowerCase()] || this.currentState.Solutions.default;
        
        // Apply score
        this.score += solution.Score;

        // Transition to next state
        if (solution.Next !== null) {
            this.setCurrentState(solution.Next, this.stateData.States[solution.Next]);
        } else {
            this.setCurrentState('DontUnderstand', {
                Question: "I'm sorry, I didn't understand you...",
                AnswerWords: null,
                Solutions: {
                    default: {"Score": 0, "Next": this.currentStateName }
                }
            });
        }

    }
}
