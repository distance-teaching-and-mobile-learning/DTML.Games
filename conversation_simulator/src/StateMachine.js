import Phaser from 'phaser'
import _ from 'lodash'
import { dtml } from './dtmlSDK'

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

    getCurrentSolutions() {
        return this.currentState.Solutions;
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

    getOnEnterLeft() {
        if (this.currentState.OnStateEnter != null) {
            return this.currentState.OnStateEnter.Left;
        } else {
            return null;
        }
    }

    getOnEnterRight() {
        if (this.currentState.OnStateEnter != null) {
            return this.currentState.OnStateEnter.Right;
        } else {
            return null;
        }
    }


    getOnEnterLeftDo() {
        if (this.currentState.OnStateEnter != null) {
            return this.currentState.OnStateEnter.LeftDo;
        } else {
            return null;
        }
    }

    getOnEnterRightDo() {
        if (this.currentState.OnStateEnter != null) {
            return this.currentState.OnStateEnter.RightDo;
        } else {
            return null;
        }
    }


    getOnExitLeft() {
        if (this.currentState.OnStateExit != null) {
            return this.currentState.OnStateExit.Left;
        } else {
            return null;
        }
    }

    getOnExitRight() {
        if (this.currentState.OnStateExit != null) {
            return this.currentState.OnStateExit.Right;
        } else {
            return null;
        }
    }

    getOnExitLeftDo() {
        if (this.currentState.OnStateExit != null) {
            return this.currentState.OnStateExit.LeftDo;
        } else {
            return null;
        }
    }

    getOnExitRightDo() {
        if (this.currentState.OnStateExit != null) {
            return this.currentState.OnStateExit.RightDo;
        } else {
            return null;
        }
    }


    getOnExitBg() {
        if (this.currentState.OnStateExit != null) {
            return this.currentState.OnStateExit.Background;
        } else {
            return null;
        }
    }

    getOnEnterBg() {
        if (this.currentState.OnStateEnter != null) {
            return this.currentState.OnStateEnter.Background;
        } else {
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

    isNumber(o) {
        return typeof o == "number" || (typeof o == "object" && o["constructor"] === Number);
    }

    submitSolution(solutionPhrase) {

        var normalizedPhrase = solutionPhrase.toLowerCase().trim();
        console.log(`Checking solution: '${normalizedPhrase}'. Current state is '${this.currentStateName}'`);

        // Select solution, or default
        var correct = false;
        var wrongOrder = false;

        for (const possibility in this.currentState.Solutions) {
            // possibility is perfect
            if (possibility === normalizedPhrase) {
                correct = true;
                break;
            }

            var solutionWords = possibility.split(" ");
            var normalWords = normalizedPhrase.split(" ");
            // theres a chance all the words are correct
            if (solutionWords.length === normalWords.length) {
                var numWrong = 0;
                var solutionWordsToFrequencies = new Map();
                // load all words to freq
                solutionWords.forEach(word => {
                    if (solutionWordsToFrequencies.has(word)) {
                        solutionWordsToFrequencies.set(word, solutionWordsToFrequencies.get(word) + 1);
                    } else {
                        solutionWordsToFrequencies.set(word, 1);
                    }
                });

                // check words in answer
                normalWords.forEach(word => {
                    if (solutionWordsToFrequencies.has(word) && solutionWordsToFrequencies.get(word) > 0) {
                        solutionWordsToFrequencies.set(word, solutionWordsToFrequencies.get(word) - 1);
                    } else {
                        // this word is fully incorrect, we've lost hope for correctness 
                        numWrong++;
                    }
                });

                if (numWrong > 0 && !wrongOrder) {
                    this.failureType = "I'm sorry, I didn't understand you...";
                } else {
                    wrongOrder = true;
                    this.failureType = "I'm sorry, the word order seems wrong...";
                }
            }
        }

        var solution = "";
        if (!correct) {
            solution = this.currentState.Solutions.default;
        } else {
            solution = this.currentState.Solutions[normalizedPhrase]
        }

        // var solution = this.currentState.Solutions[normalizedPhrase] || this.currentState.Solutions.default;

        var success = solution == this.currentState.Solutions.default ? "False" : "True";

        // Apply score
        dtml.scorePhrase(normalizedPhrase, success, (result) => {
            if (solution.Next !== null) {
                this.setCurrentState(solution.Next, this.stateData.States[solution.Next]);
                this.submitSolutionResult = true;
                this.score += result;
                if (this.isNumber(solution.scoreadjustment)) {
                    this.score += solution.scoreadjustment;
                }
            }
            else {
                this.submitSolutionResult = false;
                this.score -= 10;
            }
        });
    }
}
