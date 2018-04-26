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

function assembleNode(scene, node) {
    var object;
    switch (node.type) {
        case 'Node2D': {
            object = scene.add.container(node.position.x, node.position.y)
                .setVisible(node.visible)
        } break;
        case 'Sprite': {
            object = scene.add.image(node.position.x, node.position.y, 'sprites', node.texture)
                .setOrigin(node.anchor.x, node.anchor.y)
                .setScale(node.scale.x, node.scale.y)
                .setAlpha(node.alpha)
                .setTint(node.tint)
                .setVisible(node.visible)
        } break;
        case 'AnimatedSprite': {
            object = scene.add.sprite(node.position.x, node.position.y)
                .setOrigin(node.anchor.x, node.anchor.y)
                .setScale(node.scale.x, node.scale.y)
                .setAlpha(node.alpha)
                .setTint(node.tint)
                .setVisible(node.visible)
            object.play(node.frames + '/' + node.animation);
        } break;
        case 'Text': {
            object = scene.add.text(node.position.x, node.position.y, node.text, {
                fontFamily: node._style._fontFamily,
                fontSize: node._style._fontSize,
                fill: node._style._fill,
            })
                .setOrigin(node.anchor.x, node.anchor.y)
                .setScale(node.scale.x, node.scale.y)
                .setAlpha(node.alpha)
                .setVisible(node.visible)
            if (node._style._wordWrap) {
                object.setWordWrapWidth(node._style._wordWrapWidth)
            }
        } break;
    }

    if (object && node.name) {
        object.setName(node.name);
        scene.objectMap.set(node.name, object);
    }

    if (Array.isArray(node.children)) {
        var childObjects = [];
        for (var i = 0; i < node.children.length; i++) {
            childObjects.push(assembleNode(scene, node.children[i]));
        }

        if (node.type === 'Node2D') {
            object.add(childObjects);
        }
    }

    return object;
}

export default function assembleScene(scene, data) {
    if (!scene.objectMap) {
        scene.objectMap = new Phaser.Structs.Map();
    }

    for (var i = 0; i < data.children.length; i++) {
        assembleNode(scene, data.children[i]);
    }
}
