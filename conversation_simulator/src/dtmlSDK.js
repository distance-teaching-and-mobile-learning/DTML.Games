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
import Phaser from 'phaser'
import 'isomorphic-fetch'

var dtml = {
    urls:{
        userService:'https://dtml.org/Activity/Record/'
    	},
		
	//*****************************************************************
	// API Call to record events of the game
	//*****************************************************************
    recordGameEvent: function(name, eventType, eventData) {
 	var data = { "envelop": null, "page": name, "time": null, "eventType": eventType, "eventData": eventData}
        fetch('https://dtml.org/Activity/Record/', 
		{ method: 'post', 
		  credentials: 'same-origin', 
		  body: JSON.stringify(data),
		  headers: {
      			   'content-type': 'application/json'
    			   }
		}).catch(err => {
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
    recordGameEnd: function(name, score) {
		this.recordGameEvent(name, "GameCompleted", score)
	},
}

export { dtml };