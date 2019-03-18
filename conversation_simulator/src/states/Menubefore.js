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

export default class extends Phaser.State {
  init () {

  }

  create () {
      this.loadingText = this.add.text(this.game.world.centerX-100, this.game.world.centerY - 140, 'Loading game... please wait', {
      font: '20px Berkshire Swash',
      fill: '#ffffff'
    })
  }

  preload () {
    this.delayTimer = 0
  }

  update () {
	  //Why do we need this delay?
    this.deltaTime = game.time.elapsed / 1000
    this.delayTimer += 1 * this.deltaTime
    if (this.delayTimer >= 2) {
	  game.world.remove(this.loadingText);	
      this.state.start('Menu')
    }
	let progress = parseInt(this.delayTimer/2*100);
    this.loadingText.setText('Loading: ' + progress + '%');
  }
}
