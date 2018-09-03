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




export default class extends Phaser.State {

    init() {

    }

    create() {
        // this.state.start('Menu')
    }

    preload(){
 this.xxx = 0;
      
    }

    update() {
     
    this.deltaTime = game.time.elapsed/1000;
    this.xxx+=1*this.deltaTime;

    
     if(this.xxx>=2){  //yg bener 6
        this.state.start('Menu')
         console.log('sss')
     }else{
        console.log('starting')

     }
    }

    
}
