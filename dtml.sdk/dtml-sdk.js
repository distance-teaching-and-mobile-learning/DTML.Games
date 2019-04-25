/* The Distance Teaching and Mobile learning licenses this file
to you under the Apache License, Version 2.0 (the "License"); 
you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
*/
import 'isomorphic-fetch'

var dtml = {
    urls: {
        userService: 'https://dtml.org/Activity/Record/',
        gameService: 'https://dtml.org/api/GameService/',
        speechService: 'https://dtml.org/api/SpeechService/',
	dialogService: 'https://dtml.org/api/DialogService/'
    },

    listOfVoices: [],

    //*****************************************************************
    // API Call to get words
    //*****************************************************************
    getWords: function(level, callback, sender, debug) {
        fetch(this.urls.gameService + "Words/?step=" + level, {
            method: 'get',
            credentials: 'same-origin',
        }).catch (err => {
            console.log('err', err);
            callback(null, sender);
        }).then(res => res.json())
            .then(data => {
                if (debug) {
                    console.log(data);
                }
                callback(data, sender);
            });
    },

    //*****************************************************************
    // API Call to score phrase
    //*****************************************************************
    scorePhrase: function(phrase, success, callback, source, state) {
        fetch(this.urls.gameService + "ScorePhrase/?state="+state+"&source="+source+"&success=" + success + "&phrase=" + phrase, {
            method: 'get',
            credentials: 'same-origin',
        }).catch (err => {
            console.log('err', err);
            callback(false);
        }).then(res => res.json())
		    .then(data => {
                callback(data);
            });
    },

    //*****************************************************************
    // API Call to record events of the game
    //*****************************************************************
    recordGameEvent: function(name, eventType, eventData) {
        var data = {
            "envelop": null,
            "page": name,
            "time": null,
            "eventType": eventType,
            "eventData": eventData
        }
        fetch(this.urls.userService, {
            method: 'post',
            credentials: 'same-origin',
            body: JSON.stringify(data),
            headers: {
                'content-type': 'application/json'
            }
        }).catch (err => {
            console.log('err', err)
        });
    },

    //*****************************************************************
    // API Call to record start of the game
    //*****************************************************************
    recordGameStart: function(name) {
        this.recordGameEvent(name, "GameStarted", navigator.userAgent)
    },

    //*****************************************************************
    // API Call to record end of the game
    //*****************************************************************
    recordGameEnd: function(name, score, eventData) {
        this.recordGameEvent(name, "GameCompleted", score, eventData)
    },
	
	//*****************************************************************
    // Validate Did you mean state
    //*****************************************************************
    getSuggestedPath: function(gameId, state, userInput, stateOptions, callback) {
		var formBody = new URLSearchParams();
		formBody.append('name', gameId);
		formBody.append('state', state);
		formBody.append('input', userInput);
		formBody.append('options', JSON.stringify(stateOptions));

   	    fetch(this.urls.dialogService+"DidYouMean", {
            method: 'POST',
            credentials: 'same-origin',
            body: formBody,
            headers: {
                'content-type': 'application/x-www-form-urlencoded;charset=UTF-8'
            }
        })
		.catch (err => {
            callback(err);
        }).then(data => {
                callback(data);
            });
    },
	
    //*****************************************************************
    // Publish conversational Dialog
    //*****************************************************************
    publishDialog: function(gameId, json, callback) {
		var formBody = new URLSearchParams();
		formBody.append('Name', gameId);
		formBody.append('DialogJSON', JSON.stringify(json));

   	    fetch(this.urls.dialogService+"Dialog", {
            method: 'POST',
            credentials: 'same-origin',
            body: formBody,
            headers: {
                'content-type': 'application/x-www-form-urlencoded;charset=UTF-8'
            }
        })
		.catch (err => {
            callback(err);
        }).then(data => {
                callback(data);
            });
    },

    //*****************************************************************
    // Init voice
    //*****************************************************************
    initVoices: function() {   
        this.listOfVoices = window.speechSynthesis.getVoices()
        if (typeof window.speechSynthesis && window.speechSynthesis.onvoiceschanged) {
            var that = this;
            window.speechSynthesis.onvoiceschanged = function() {
                that.listOfVoices = window.speechSynthesis.getVoices();
            }
        }
    },

    //*****************************************************************
    // Say text
    //*****************************************************************
    textToSpeech: function(text, voice, pitch, provider, gender) {
	
        try {
            if (typeof speechSynthesis !== 'undefined' && window.speechSynthesis.onvoiceschanged !== undefined && provider != "dtml-speech-service") {
                if (speechSynthesis.speaking) {
                    speechSynthesis.cancel()
                    setTimeout(() => {
                        this.textToSpeech(text, voice, pitch)
                    }, 500)
                } else {
                    let voicename = this.listOfVoices.filter(a => a.name.toLowerCase().includes(voice.toLowerCase()));
                    let msg = new SpeechSynthesisUtterance();
                    msg.voice = voicename.length > 0 ? voicename[0] : this.listOfVoices[0];
                    msg.default = false
                    msg.voiceURI = 'native'
                    msg.volume = 1
                    msg.rate = 1
                    msg.pitch = parseInt(pitch)
                    msg.text = text
                    msg.lang = 'en-US'
                    speechSynthesis.speak(msg)
                }
            } else {

                let audio = new Audio(this.urls.speechService + 'SayPhrase/?text=' + text + "&gender=" + gender);
                audio.play();
            }

        } catch (e) {
            console.log(e)
        }
    }
}

export {
    dtml
};