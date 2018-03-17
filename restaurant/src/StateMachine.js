import Phaser from 'phaser'

export default class {
    constructor(stateData) {
        this.stateData = stateData;
    }   

    printDebugInfo() {
        console.log(JSON.stringify(this.stateData));
    }
}
