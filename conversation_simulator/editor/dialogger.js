import './index.css'
import './lib/jquery.contextMenu.css'
import './lib/jquery.contextMenu.js'
import './lib/jquery.ui.position.js'
import Validator from './validator.js'
import CharacterList from './characterList.json'
import BackgroundList from './backgroundList.json'

function getURLParameter (name) {
  return (
    decodeURIComponent(
      (new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(
        location.search
      ) || [, ''])[1].replace(/\+/g, '%20')
    ) || null
  )
}

function onError (e) {
  console.log('Error', e)
}

var fs = null
var loadOnStart = getURLParameter('load')
var importOnStart = getURLParameter('import')
var loadGameName = getURLParameter('name')
var loadGameVersion = getURLParameter('version')

addEventListener('app-ready', function (e) {
  fs = require('fs')
  $('#import').hide()
  $('#export').hide()
  $('#export-game').hide()
})

var graph = new joint.dia.Graph()

if (loadGameName && loadGameVersion) {
  importRemoteFile(loadGameName, loadGameVersion)
}

var viewTemplates = {
  'options': '<button class="toggle" style="float:left;margin-right:5px;">+</button> <span>Options</span>',
  'mic': '<svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="microphone" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 352 512" class="svg-inline"><path fill="currentColor" d="M176 352c53.02 0 96-42.98 96-96V96c0-53.02-42.98-96-96-96S80 42.98 80 96v160c0 53.02 42.98 96 96 96zm160-160h-16c-8.84 0-16 7.16-16 16v48c0 74.8-64.49 134.82-140.79 127.38C96.71 376.89 48 317.11 48 250.3V208c0-8.84-7.16-16-16-16H16c-8.84 0-16 7.16-16 16v40.16c0 89.64 63.97 169.55 152 181.69V464H96c-8.84 0-16 7.16-16 16v16c0 8.84 7.16 16 16 16h160c8.84 0 16-7.16 16-16v-16c0-8.84-7.16-16-16-16h-56v-33.77C285.71 418.47 352 344.9 352 256v-48c0-8.84-7.16-16-16-16z" class=""></path></svg>',
  'speaker': '<svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="volume-down" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" class="svg-inline"><path fill="currentColor" d="M215.03 72.04L126.06 161H24c-13.26 0-24 10.74-24 24v144c0 13.25 10.74 24 24 24h102.06l88.97 88.95c15.03 15.03 40.97 4.47 40.97-16.97V89.02c0-21.47-25.96-31.98-40.97-16.98zm123.2 108.08c-11.58-6.33-26.19-2.16-32.61 9.45-6.39 11.61-2.16 26.2 9.45 32.61C327.98 229.28 336 242.62 336 257c0 14.38-8.02 27.72-20.92 34.81-11.61 6.41-15.84 21-9.45 32.61 6.43 11.66 21.05 15.8 32.61 9.45 28.23-15.55 45.77-45 45.77-76.88s-17.54-61.32-45.78-76.87z" class=""></path></svg>'
}

var allowableConnections = [
  ['dialogue.Text', 'dialogue.Text'],
  ['dialogue.Text', 'dialogue.Node'],
  ['dialogue.Text', 'dialogue.Choice'],
  ['dialogue.Text', 'dialogue.Set'],
  ['dialogue.Text', 'dialogue.Branch'],
  ['dialogue.Node', 'dialogue.Text'],
  ['dialogue.Node', 'dialogue.Node'],
  ['dialogue.Node', 'dialogue.Choice'],
  ['dialogue.Node', 'dialogue.Set'],
  ['dialogue.Node', 'dialogue.Branch'],
  ['dialogue.Choice', 'dialogue.Text'],
  ['dialogue.Choice', 'dialogue.Node'],
  ['dialogue.Choice', 'dialogue.Set'],
  ['dialogue.Choice', 'dialogue.Branch'],
  ['dialogue.Set', 'dialogue.Text'],
  ['dialogue.Set', 'dialogue.Node'],
  ['dialogue.Set', 'dialogue.Set'],
  ['dialogue.Set', 'dialogue.Branch'],
  ['dialogue.Branch', 'dialogue.Text'],
  ['dialogue.Branch', 'dialogue.Node'],
  ['dialogue.Branch', 'dialogue.Set'],
  ['dialogue.Branch', 'dialogue.Branch'],
  ['dialogue.Question', 'dialogue.Solution'],
  ['dialogue.Solution', 'dialogue.Question'],
  ['dialogue.Start', 'dialogue.Question'],
  ['dialogue.Solution', 'dialogue.End']
]

var voiceList = window.speechSynthesis.getVoices()
if (window.speechSynthesis.onvoiceschanged !== undefined) {
  window.speechSynthesis.onvoiceschanged = function () {
    voiceList = window.speechSynthesis.getVoices()
  }
}

var remoteModules
updateRemoteModuleList()

function validateConnection (
  cellViewS,
  magnetS,
  cellViewT,
  magnetT,
  end,
  linkView
) {
  // Prevent loop linking
  if (magnetS === magnetT) return false

  if (cellViewS === cellViewT) return false

  // Can't connect to an output port
  if (magnetT.attributes['port-group'].value === 'out') return false

  var sourceType = cellViewS.model.attributes.type
  var targetType = cellViewT.model.attributes.type
  var valid = false
  for (var i = 0; i < allowableConnections.length; i++) {
    var rule = allowableConnections[i]
    if (sourceType === rule[0] && targetType === rule[1]) {
      valid = true
      break
    }
  }
  if (!valid) return false

  return true
}

function validateMagnet (cellView, magnet) {
  if (magnet.getAttribute('magnet') === 'passive') return false

  // If unlimited connections attribute is null, we can only ever connect to one object
  // If it is not null, it is an array of type strings which are allowed to have unlimited connections
  var unlimitedConnections = false
  for (let i = 0; i < magnet.attributes.length; i++) {
    if (magnet.attributes[i].name === 'unlimited-connections' && magnet.attributes[i].value === 'true') {
      unlimitedConnections = true
      break
    }
  }
  var links = graph.getConnectedLinks(cellView.model)
  for (var i = 0; i < links.length; i++) {
    var link = links[i]
    if (
      link.attributes.source.id === cellView.model.id &&
      link.attributes.source.port === magnet.attributes.port.nodeValue
    ) {
      // This port already has a connection
      if (unlimitedConnections && link.attributes.target.id) {
        return true
      }
      return false
    }
  }

  return true
}

joint.shapes.dialogue = {}

joint.shapes.dialogue.Base = joint.shapes.devs.Model.extend({
  defaults: joint.util.deepSupplement(
    {
      type: 'dialogue.Base',
      size: { width: 250, height: 135 },
      name: '',
      attrs: {
        rect: { stroke: 'none', 'fill-opacity': 0 },
        text: { display: 'none' },
        '.inPorts circle': { magnet: 'passive' },
        '.outPorts circle': { magnet: true }
      }
    },
    joint.shapes.devs.Model.prototype.defaults
  )
})
joint.shapes.dialogue.BaseView = joint.dia.ElementView.extend({
  template: [
    '<div class="node">',
    '<span class="label"></span>',
    '<button class="delete">x</button>',
    '<input type="actor" class="actor" placeholder="Actor" />',
    '<p> <textarea type="text" class="name" rows="4" cols="27" placeholder="Speech"></textarea></p>',
    '</div>'
  ].join(''),

  initialize: function () {
    _.bindAll(this, 'updateBox')
    joint.dia.ElementView.prototype.initialize.apply(this, arguments)

    this.$box = $(_.template(this.template)())
    // Prevent paper from handling pointerdown.
    this.$box.find('input').on('mousedown click', function (evt) {
      evt.stopPropagation()
    })

    // Prevent paper from handling pointerdown.
    this.$box.find('textarea').on('mousedown click', function (evt) {
      evt.stopPropagation()
    })

    // This is an example of reacting on the input change and storing the input data in the cell model.
    this.$box.find('input.name').on(
      'change',
      _.bind(function (evt) {
        this.model.set('name', $(evt.target).val())
      }, this)
    )

    // This is an example of reacting on the input change and storing the input data in the cell model.
    this.$box.find('input.actor').on(
      'change',
      _.bind(function (evt) {
        this.model.set('actor', $(evt.target).val())
      }, this)
    )

    // This is an example of reacting on the input change and storing the input data in the cell model. TEXTAREA
    this.$box.find('textarea.name').on(
      'change',
      _.bind(function (evt) {
        this.model.set('name', $(evt.target).val())
      }, this)
    )

    this.$box.find('.delete').on('click', _.bind(this.model.remove, this.model))
    // Update the box position whenever the underlying model changes.
    this.model.on('change', this.updateBox, this)
    // Remove the box when the model gets removed from the graph.
    this.model.on('remove', this.removeBox, this)

    this.updateBox()
  },

  render: function () {
    joint.dia.ElementView.prototype.render.apply(this, arguments)
    this.paper.$el.prepend(this.$box)
    this.updateBox()
    return this
  },

  updateBox: function () {
    // Set the position and dimension of the box so that it covers the JointJS element.
    var bbox = this.model.getBBox()

    // Example of updating the HTML with a data stored in the cell model.
    var nameField = this.$box.find('input.name')
    if (!nameField.is(':focus')) nameField.val(this.model.get('name'))

    // Example of updating the HTML with a data stored in the cell model.
    var actorField = this.$box.find('input.actor')
    if (!actorField.is(':focus')) actorField.val(this.model.get('actor'))

    // Example of updating the HTML with a data stored in the cell model.
    var textAreaField = this.$box.find('textarea.name')
    if (!textAreaField.is(':focus')) textAreaField.val(this.model.get('name'))

    var label = this.$box.find('.label')
    var type = this.model.get('type').slice('dialogue.'.length)
    label.text(type)
    label.attr('class', 'label ' + type)
    this.$box.css({
      width: bbox.width,
      height: bbox.height,
      left: bbox.x,
      top: bbox.y,
      transform: 'rotate(' + (this.model.get('angle') || 0) + 'deg)'
    })
  },

  removeBox: function (evt) {
    this.$box.remove()
  }
})

joint.shapes.dialogue.ChoiceView = joint.dia.ElementView.extend({
  template: [
    '<div class="node">',
    '<span class="label"> </span>',
    '<button class="delete">x</button>',
    '<input type="choice" class="title" placeholder="Title" />',
    '<p> <textarea type="text" class="name" rows="4" cols="27" placeholder="Speech"></textarea></p>',
    '</div>'
  ].join(''),

  initialize: function () {
    _.bindAll(this, 'updateBox')
    joint.dia.ElementView.prototype.initialize.apply(this, arguments)

    this.$box = $(_.template(this.template)())
    // Prevent paper from handling pointerdown.
    this.$box.find('textarea').on('mousedown click', function (evt) {
      evt.stopPropagation()
    })
    this.$box.find('input').on('mousedown click', function (evt) {
      evt.stopPropagation()
    })
    this.$box.find('idd').on('mousedown click', function (evt) {
      evt.stopPropagation()
    })

    // This is an example of reacting on the input change and storing the input data in the cell model.
    this.$box.find('textarea.name').on(
      'change',
      _.bind(function (evt) {
        this.model.set('name', $(evt.target).val())
      }, this)
    )

    // This is an example of reacting on the input change and storing the input data in the cell model.
    this.$box.find('input.title').on(
      'change',
      _.bind(function (evt) {
        this.model.set('title', $(evt.target).val())
      }, this)
    )

    this.$box.find('.delete').on('click', _.bind(this.model.remove, this.model))
    // Update the box position whenever the underlying model changes.
    this.model.on('change', this.updateBox, this)
    // Remove the box when the model gets removed from the graph.
    this.model.on('remove', this.removeBox, this)

    this.updateBox()
  },

  render: function () {
    joint.dia.ElementView.prototype.render.apply(this, arguments)
    this.paper.$el.prepend(this.$box)
    this.updateBox()
    return this
  },

  updateBox: function () {
    // Set the position and dimension of the box so that it covers the JointJS element.
    var bbox = this.model.getBBox()
    // Example of updating the HTML with a data stored in the cell model.
    var nameField = this.$box.find('textarea.name')
    if (!nameField.is(':focus')) nameField.val(this.model.get('name'))

    // Example of updating the HTML with a data stored in the cell model.
    var nameField = this.$box.find('input.title')
    if (!nameField.is(':focus')) nameField.val(this.model.get('title'))

    var label = this.$box.find('.label')
    var type = this.model.get('type').slice('dialogue.'.length)
    label.text(type)
    label.attr('class', 'label ' + type)

    this.$box.css({
      width: bbox.width,
      height: bbox.height,
      left: bbox.x,
      top: bbox.y,
      transform: 'rotate(' + (this.model.get('angle') || 0) + 'deg)'
    })
  },

  removeBox: function (evt) {
    this.$box.remove()
  }
})

joint.shapes.dialogue.Node = joint.shapes.devs.Model.extend({
  defaults: joint.util.deepSupplement(
    {
      type: 'dialogue.Node',
      inPorts: ['input'],
      outPorts: ['output'],
      attrs: {
        '.outPorts circle': { unlimitedConnections: ['dialogue.Choice'] }
      }
    },
    joint.shapes.dialogue.Base.prototype.defaults
  )
})
joint.shapes.dialogue.NodeView = joint.shapes.dialogue.BaseView

joint.shapes.dialogue.Text = joint.shapes.devs.Model.extend({
  defaults: joint.util.deepSupplement(
    {
      type: 'dialogue.Text',
      inPorts: ['input'],
      outPorts: ['output'],
      actor: '',
      textarea: 'Start writing',
      attrs: {
        '.outPorts circle': { unlimitedConnections: ['dialogue.Choice'] }
      }
    },
    joint.shapes.dialogue.Base.prototype.defaults
  )
})
joint.shapes.dialogue.TextView = joint.shapes.dialogue.BaseView

joint.shapes.dialogue.Choice = joint.shapes.devs.Model.extend({
  defaults: joint.util.deepSupplement(
    {
      size: { width: 250, height: 135 },
      type: 'dialogue.Choice',
      inPorts: ['input'],
      outPorts: ['output'],
      title: '',
      name: ''
    },
    joint.shapes.dialogue.Base.prototype.defaults
  )
})
joint.shapes.dialogue.ChoiceView = joint.shapes.dialogue.ChoiceView

joint.shapes.dialogue.Branch = joint.shapes.devs.Model.extend({
  defaults: joint.util.deepSupplement(
    {
      type: 'dialogue.Branch',
      size: { width: 200, height: 100 },
      inPorts: ['input'],
      outPorts: ['output0'],
      values: []
    },
    joint.shapes.dialogue.Base.prototype.defaults
  )
})
joint.shapes.dialogue.BranchView = joint.shapes.dialogue.BaseView.extend({
  template: [
    '<div class="node">',
    '<span class="label"></span>',
    '<button class="delete">x</button>',
    '<button class="add">+</button>',
    '<button class="remove">-</button>',
    '<input type="text" class="name" placeholder="Variable" />',
    '<input type="text" value="Default" readonly/>',
    '</div>'
  ].join(''),

  initialize: function () {
    joint.shapes.dialogue.BaseView.prototype.initialize.apply(this, arguments)
    this.$box.find('.add').on('click', _.bind(this.addPort, this))
    this.$box.find('.remove').on('click', _.bind(this.removePort, this))
  },

  removePort: function () {
    if (this.model.get('outPorts').length > 1) {
      var outPorts = this.model.get('outPorts').slice(0)
      outPorts.pop()
      this.model.set('outPorts', outPorts)
      var values = this.model.get('values').slice(0)
      values.pop()
      this.model.set('values', values)
      this.updateSize()
    }
  },

  addPort: function () {
    var outPorts = this.model.get('outPorts').slice(0)
    outPorts.push('output' + outPorts.length.toString())
    this.model.set('outPorts', outPorts)
    var values = this.model.get('values').slice(0)
    values.push(null)
    this.model.set('values', values)
    this.updateSize()
  },

  updateBox: function () {
    joint.shapes.dialogue.BaseView.prototype.updateBox.apply(this, arguments)
    var values = this.model.get('values')
    var valueFields = this.$box.find('input.value')

    // Add value fields if necessary
    for (var i = valueFields.length; i < values.length; i++) {
      // Prevent paper from handling pointerdown.
      var field = $('<input type="text" class="value" />')
      field.attr('placeholder', 'Value ' + (i + 1).toString())
      field.attr('index', i)
      this.$box.append(field)
      field.on('mousedown click', function (evt) {
        evt.stopPropagation()
      })

      // This is an example of reacting on the input change and storing the input data in the cell model.
      field.on(
        'change',
        _.bind(function (evt) {
          var values = this.model.get('values').slice(0)
          values[$(evt.target).attr('index')] = $(evt.target).val()
          this.model.set('values', values)
        }, this)
      )
    }

    // Remove value fields if necessary
    for (var i = values.length; i < valueFields.length; i++) { $(valueFields[i]).remove() }

    // Update value fields
    valueFields = this.$box.find('input.value')
    for (var i = 0; i < valueFields.length; i++) {
      var field = $(valueFields[i])
      if (!field.is(':focus')) field.val(values[i])
    }
  },

  updateSize: function () {
    var textField = this.$box.find('input.name')
    var height = textField.outerHeight(true)
    this.model.set('size', {
      width: 200,
      height:
        100 + Math.max(0, (this.model.get('outPorts').length - 1) * height)
    })
  }
})

joint.shapes.dialogue.Set = joint.shapes.devs.Model.extend({
  defaults: joint.util.deepSupplement(
    {
      type: 'dialogue.Set',
      inPorts: ['input'],
      outPorts: ['output'],
      size: { width: 200, height: 100 },
      value: ''
    },
    joint.shapes.dialogue.Base.prototype.defaults
  )
})
joint.shapes.dialogue.SetView = joint.shapes.dialogue.BaseView.extend({
  template: [
    '<div class="node">',
    '<span class="label"></span>',
    '<button class="delete">x</button>',
    '<input type="text" class="name" placeholder="Variable" />',
    '<input type="text" class="value" placeholder="Value" />',
    '</div>'
  ].join(''),

  initialize: function () {
    joint.shapes.dialogue.BaseView.prototype.initialize.apply(this, arguments)
    this.$box.find('input.value').on(
      'change',
      _.bind(function (evt) {
        this.model.set('value', $(evt.target).val())
      }, this)
    )
  },

  updateBox: function () {
    joint.shapes.dialogue.BaseView.prototype.updateBox.apply(this, arguments)
    var field = this.$box.find('input.value')
    if (!field.is(':focus')) field.val(this.model.get('value'))
  }
})

joint.shapes.dialogue.Question = joint.shapes.devs.Model.extend({
  defaults: joint.util.deepSupplement(
    {
      size: { width: 260, height: 240 },
      type: 'dialogue.Question',
      inPorts: ['input'],
      outPorts: ['output'],
      ports: {
        groups: {
          'in': {},
          'out': {
            attrs: {
              '.port-body': {
                unlimitedConnections: true
              }
            }
          }
        }
      },
      name: '',
      prompt: '',
      answerWords: '',
      background: null,
      enterLeftAnimation: null,
      enterLeftDirection: null,
      enterRightAnimation: null,
      enterRightDirection: null,
      exitLeftAnimation: null,
      exitLeftDirection: null,
      exitRightAnimation: null,
      exitRightDirection: null
    },
    joint.shapes.dialogue.Base.prototype.defaults
  )
})
joint.shapes.dialogue.QuestionView = joint.shapes.dialogue.BaseView.extend({
  template: [
    '<div class="node">',
    '<span class="label"> </span>',
    '<button class="delete">x</button>',
    '<input type="choice" class="name" placeholder="Name" />',
    '<p> <textarea type="text" class="prompt" rows="3" cols="27" placeholder="Prompt"></textarea></p>',
    '<span>Answer Words:</span>',
    '<p> <textarea type="text" class="answerWords" rows="2" cols="27" placeholder="hello, thanks, etc..."></textarea></p>',
    viewTemplates.options,
    '</div>'
  ].join(''),

  initialize: function () {
    joint.shapes.dialogue.BaseView.prototype.initialize.apply(this, arguments)
    this.$box.find('.toggle').on('click', _.bind(this.expandNode, this))

    // Expand and collapse the node in case the it's the wrong size when loaded
    this.expandNode()
    this.collapseNode()

    // Fill in data if present when loaded
    var promptBox = this.$box.find('textarea.prompt')
    promptBox.val(this.model.get('prompt'))
    var answerWordsBox = this.$box.find('textarea.answerWords')
    answerWordsBox.val(this.model.get('answerWords'))
  },

  updateBox: function () {
    joint.shapes.dialogue.BaseView.prototype.updateBox.apply(this, arguments)

    var promptBox = this.$box.find('textarea.prompt')
    promptBox.on(
      'change',
      _.bind(function (evt) {
        var newPrompt = $(evt.target).val()
        this.model.set('prompt', newPrompt)
      }, this)
    )
    var answerWordsBox = this.$box.find('textarea.answerWords')
    answerWordsBox.on(
      'change',
      _.bind(function (evt) {
        var newAnswerWords = $(evt.target).val()
        this.model.set('answerWords', newAnswerWords)
      }, this)
    )

    // Update value fields
    // var textAreas = this.$box.find('textarea')
    // for (var i = 0; i < textAreas.length; i++) {
    //   var field = $(textAreas[i])
    //   if (!field.is(':focus')) field.val(textAreas[i])
    // }
  },

  expandNode: function () {
    this.model.set('size', {
      width: 260,
      height: 475
    })
    this.$box.find('.toggle').unbind('click')
    this.$box.find('.toggle').on('click', _.bind(this.collapseNode, this))
    this.$box.find('.toggle').html('-')
    var elements = [
      $('<div class="collapseDelete" style="display:block; overflow:hidden;"><span class="background" style="width:50%; float:left;">Background:</span><select class="backgroundSelector" style="width:50%; float:right;"></select></div>'),
      $('<hr class="collapseDelete" /></p>'),
      $('<p><span class="collapseDelete" style="font-weight:bold">On State Enter</span><br class="collapseDelete" /></p>'),
      $('<div class="collapseDelete" style="float:left;padding-top:6px">Left Character: </div>'),
      $('<input type="text" class="enterLeftAnimation" style="width:74px; float:right;" placeHolder="Animation" />'),
      $('<select class="enterLeftDirection" style="width:54px; float:right; margin-right:5px"/></select><br class="collapseDelete" />'),
      $('<div class="collapseDelete" style="float:left;padding-top:6px">Right Character: </div>'),
      $('<input type="text" class="enterRightAnimation" style="width:74px; float:right;" placeHolder="Animation" />'),
      $('<select class="enterRightDirection" style="width:54px; float:right; margin-right:5px" /></select><br class="collapseDelete" /><br class="collapseDelete" />'),
      $('<p><span class="collapseDelete" style="font-weight:bold">On State Exit</span><br class="collapseDelete" /></p>'),
      $('<div class="collapseDelete" style="float:left;padding-top:8px">Left Character: </div>'),
      $('<input type="text" class="exitLeftAnimation" style="width:74px;float:right" placeHolder="Animation" />'),
      $('<select class="exitLeftDirection" style="width:54px; float:right; margin-right:5px" placeHolder="in or out" /></select><br class="collapseDelete" />'),
      $('<div class="collapseDelete" style="float:left;padding-top:8px">Right Character: </div>'),
      $('<input type="text" class="exitRightAnimation" style="width:74px;float:right" placeHolder="Animation" />'),
      $('<select class="exitRightDirection" style="width:54px; margin-right:5px;float:right" placeHolder="in or out" /></select><br class="collapseDelete" />')
    ]
    let _this = this
    $(elements).each(function (index, element) {
      _this.$box.append(element)
      if (element.is('input')) {
        element.on('click', function () { element.focus() })
      }
    })

    // Populate drop-down options
    this.$box.find('select.enterLeftDirection').append($('<option>', { value: 'none', text: 'None' }))
    this.$box.find('select.enterLeftDirection').append($('<option>', { value: 'in', text: 'in' }))
    this.$box.find('select.enterLeftDirection').append($('<option>', { value: 'out', text: 'out' }))
    this.$box.find('select.enterRightDirection').append($('<option>', { value: 'none', text: 'None' }))
    this.$box.find('select.enterRightDirection').append($('<option>', { value: 'in', text: 'in' }))
    this.$box.find('select.enterRightDirection').append($('<option>', { value: 'out', text: 'out' }))
    this.$box.find('select.exitLeftDirection').append($('<option>', { value: 'none', text: 'None' }))
    this.$box.find('select.exitLeftDirection').append($('<option>', { value: 'in', text: 'in' }))
    this.$box.find('select.exitLeftDirection').append($('<option>', { value: 'out', text: 'out' }))
    this.$box.find('select.exitRightDirection').append($('<option>', { value: 'none', text: 'None' }))
    this.$box.find('select.exitRightDirection').append($('<option>', { value: 'in', text: 'in' }))
    this.$box.find('select.exitRightDirection').append($('<option>', { value: 'out', text: 'out' }))

    this.$box.find('select.backgroundSelector').append($('<option>', {
      value: null,
      text: '-'
    }))
    for (let i = 0; i < BackgroundList.length; i++) {
      this.$box.find('select.backgroundSelector').append($('<option>', {
        value: BackgroundList[i][0],
        text: BackgroundList[i][1]
      }))
    }

    // Fill in values
    if (this.model.get('backgroundSelector')) { elements[0].val(this.model.get('background')) }
    if (this.model.get('enterLeftAnimation')) { elements[4].val(this.model.get('enterLeftAnimation')) }
    if (this.model.get('enterLeftDirection')) { elements[5].val(this.model.get('enterLeftDirection')) }
    if (this.model.get('enterRightAnimation')) { elements[7].val(this.model.get('enterRightAnimation')) }
    if (this.model.get('enterRightDirection')) { elements[8].val(this.model.get('enterRightDirection')) }
    if (this.model.get('exitLeftAnimation')) { elements[11].val(this.model.get('exitLeftAnimation')) }
    if (this.model.get('exitLeftDirection')) { elements[12].val(this.model.get('exitLeftDirection')) }
    if (this.model.get('exitRightAnimation')) { elements[14].val(this.model.get('exitRightAnimation')) }
    if (this.model.get('exitRightDirection')) { elements[15].val(this.model.get('exitRightDirection')) }

    // Background
    elements[0].on(
      'change',
      _.bind(function (evt) {
        var background = $(evt.target).val()
        this.model.set('background', background)
      }, this)
    )
    // Enter Left Animation
    elements[4].on('change', _.bind(function (evt) {
      this.model.set('enterLeftAnimation', $(evt.target).val())
    }, this))
    // Enter Left Direction
    elements[5].on('change', _.bind(function (evt) {
      this.model.set('enterLeftDirection', $(evt.target).val())
    }, this))
    // Enter Right Animation
    elements[7].on('change', _.bind(function (evt) {
      this.model.set('enterRightAnimation', $(evt.target).val())
    }, this))
    // Enter Right Direction
    elements[8].on('change', _.bind(function (evt) {
      this.model.set('enterRightDirection', $(evt.target).val())
    }, this))
    // Exit Left Animation
    elements[11].on('change', _.bind(function (evt) {
      this.model.set('exitLeftAnimation', $(evt.target).val())
    }, this))
    // Exit Left Direction
    elements[12].on('change', _.bind(function (evt) {
      this.model.set('exitLeftDirection', $(evt.target).val())
    }, this))
    // Exit Right Animation
    elements[14].on('change', _.bind(function (evt) {
      this.model.set('exitRightAnimation', $(evt.target).val())
    }, this))
    // Exit Right Direction
    elements[15].on('change', _.bind(function (evt) {
      this.model.set('exitRightDirection', $(evt.target).val())
    }, this))
  },

  collapseNode: function () {
    this.model.set('size', {
      width: 260,
      height: 240
    })
    this.$box.find('.toggle').unbind('click')
    this.$box.find('.toggle').on('click', _.bind(this.expandNode, this))
    this.$box.find('.toggle').html('+')
    this.$box.find('.collapseDelete').remove()
    this.$box.find('.background').remove()
    this.$box.find('.backgroundSelector').remove()
    this.$box.find('.enterLeftAnimation').remove()
    this.$box.find('.enterLeftDirection').remove()
    this.$box.find('.enterRightAnimation').remove()
    this.$box.find('.enterRightDirection').remove()
    this.$box.find('.exitLeftAnimation').remove()
    this.$box.find('.exitLeftDirection').remove()
    this.$box.find('.exitRightAnimation').remove()
    this.$box.find('.exitRightDirection').remove()
  }
})

joint.shapes.dialogue.Solution = joint.shapes.devs.Model.extend({
  defaults: joint.util.deepSupplement(
    {
      type: 'dialogue.Solution',
      size: { width: 200, height: 100 },
      inPorts: ['input'],
      outPorts: ['output0'],
      answers: [],
      scores: []
    },
    joint.shapes.dialogue.Base.prototype.defaults
  )
})
joint.shapes.dialogue.SolutionView = joint.shapes.dialogue.BaseView.extend({
  template: [
    '<div class="node">',
    '<span class="label"></span>',
    '<button class="delete">x</button>',
    '<button class="add">+</button>',
    '<button class="remove">-</button>',
    '</div>'
  ].join(''),

  initialize: function () {
    joint.shapes.dialogue.BaseView.prototype.initialize.apply(this, arguments)
    this.$box.find('.add').on('click', _.bind(this.addAnswer, this))
    this.$box.find('.remove').on('click', _.bind(this.removeAnswer, this))

    // Create blank answer if there are no answers
    let numberOfAnswers = this.model.get('answers').length
    if (numberOfAnswers === 0) {
      this.addAnswer()
    }
  },

  removeAnswer: function () {
    if (this.model.get('answers').length > 1) {
      var answers = this.model.get('answers').slice(0)
      answers.pop()
      this.model.set('answers', answers)
      this.updateSize()
    }
  },

  addAnswer: function () {
    var answers = this.model.get('answers').slice(0)
    answers.push(null)
    this.model.set('answers', answers)
    this.updateSize()
  },

  addAnswerField: function (index) {
    // Prevent paper from handling pointerdown.
    var answerField = $('<input type="text" class="answer" style="width:70%; float:left;" />')
    answerField.attr('placeholder', 'Answer ' + (index + 1).toString())
    answerField.attr('index', index)
    var scoreField = $('<input type="text" class="score" style="width:25%; float:right;" placeholder="Score" />')
    scoreField.attr('index', index)
    this.$box.append(answerField.add(scoreField))
    answerField.on('mousedown click', function (evt) {
      evt.stopPropagation()
    })
    scoreField.on('mousedown click', function (evt) {
      evt.stopPropagation()
    })

    // This is an example of reacting on the input change and storing the input data in the cell model.
    answerField.on(
      'change',
      _.bind(function (evt) {
        var answers = this.model.get('answers').slice(0)
        answers[$(evt.target).attr('index')] = $(evt.target).val()
        this.model.set('answers', answers)
      }, this)
    )
    scoreField.on(
      'change',
      _.bind(function (evt) {
        var scores = this.model.get('scores').slice(0)
        scores[$(evt.target).attr('index')] = $(evt.target).val()
        this.model.set('scores', scores)
      }, this)
    )
  },

  updateBox: function () {
    joint.shapes.dialogue.BaseView.prototype.updateBox.apply(this, arguments)
    var answers = this.model.get('answers')
    var scores = this.model.get('scores')
    var answerFields = this.$box.find('input.answer')
    var scoreFields = this.$box.find('input.score')

    // Add value fields if necessary
    for (var i = answerFields.length; i < answers.length; i++) {
      this.addAnswerField(i)
    }

    // Remove value fields if necessary
    for (var i = answers.length; i < answerFields.length; i++) {
      $(answerFields[i]).remove()
      $(scoreFields[i]).remove()
    }

    // Update value fields
    answerFields = this.$box.find('input.answer')
    for (let i = 0; i < answerFields.length; i++) {
      let field = $(answerFields[i])
      if (!field.is(':focus')) field.val(answers[i])
    }
    scoreFields = this.$box.find('input.score')
    for (let i = 0; i < scoreFields.length; i++) {
      let score = $(scoreFields[i])
      if (!score.is(':focus')) score.val(scores[i])
    }
  },

  updateSize: function () {
    var textField = $(this.$box.find('input.answer')[0])
    var height = textField.outerHeight(true)
    this.model.set('size', {
      width: 200,
      height:
        60 + Math.max(0, (this.model.get('answers').length - 1) * height)
    })
  }
})

joint.shapes.dialogue.Start = joint.shapes.devs.Model.extend({
  defaults: joint.util.deepSupplement(
    {
      type: 'dialogue.Start',
      outPorts: ['output'],
      actor: '',
      textarea: 'Start writing',
      attrs: {
        '.outPorts circle': { unlimitedConnections: ['dialogue.Choice'] }
      },
      size: { width: 180, height: 170 },
      expanded: false,
      gameName: '',
      gameTitle: '',
      leftCharacter: CharacterList[0],
      leftVoice: 'male',
      leftPitch: 0,
      leftYOffset: null,
      leftX: null,
      leftY: null,
      rightCharacter: CharacterList[0],
      rightVoice: 'female',
      rightPitch: 0,
      rightYOffset: null,
      rightX: null,
      rightY: null,
      background: BackgroundList[0][0],
      phraseCorrection: true
    },
    joint.shapes.dialogue.Base.prototype.defaults
  )
})
joint.shapes.dialogue.StartView = joint.shapes.dialogue.BaseView.extend({
  template: [
    '<div class="node">',
    '<span class="label"></span>',
    '<button class="delete">x</button>',
    '<p><span>Name of the Game</span>',
    '<input type="text" class="gameName" placeHolder="Name" /></p>',
    '<p><span>Game Title</span>',
    '<input type="text" class="gameTitle" placeHolder="Title" /></p>',
    viewTemplates.options,
    '</div>'
  ].join(''),

  initialize: function () {
    joint.shapes.dialogue.BaseView.prototype.initialize.apply(this, arguments)

    this.$box.find('.toggle').on('click', _.bind(this.expandNode, this))

    this.$box.find('input.gameName').on('change', _.bind(function (evt) { this.model.set('gameName', $(evt.target).val()) }, this))
    this.$box.find('input.gameTitle').on('change', _.bind(function (evt) { this.model.set('gameTitle', $(evt.target).val()) }, this))

    // Fill in data if imported
    this.$box.find('input.gameName').val(this.model.get('gameName'))
    this.$box.find('input.gameTitle').val(this.model.get('gameTitle'))

    // Expand and collapse to fix is the size if imported
    this.expandNode()
    this.collapseNode()
  },

  expandNode: function () {
    this.$box.find('.toggle').unbind('click')
    this.$box.find('.toggle').on('click', _.bind(this.collapseNode, this))
    this.$box.find('.toggle').html('-')

    var elements = [
      $('<div style="display:block">'),
      $('<hr class="collapseDelete">'),
      $('<p><span class="collapseDelete" style="pa">Left Character</span></p>'),
      $('<div class="collapseDelete" style="overflow:hidden"><span class="collapseDelete" style="width:50%; float:left;">Character:</span><select class="leftCharacter collapseDelete" style="width: 50%; float:right; clear:right;"></select></div>'),
      $('<div class="collapseDelete" style="overflow:hidden"><button class="testLeftVoice" style="background:none;float:left">' + viewTemplates.speaker + '</button><span class="collapseDelete" style="width:40%; float:left;">Voice:</span><select class="leftVoice collapseDelete" style="width: 50%; float:right; clear:right;"></select></div>'),
      $('<div class="collapseDelete" style="overflow:hidden"><span class="collapseDelete" style="width:50%; float:left;">Pitch:</span><input type="text" class="leftPitch collapseDelete" style="width:50%; float:right; clear:right;" placeHolder="0" /></div>'),
      $('<div class="collapseDelete" style="overflow:hidden"><span class="collapseDelete" style="width:50%; float:left;">Y Offset:</span><input type="text" class="leftYOffset collapseDelete" style="width:50%; float:right; clear:right;" placeHolder="0" /></div>'),
      $('<div class="collapseDelete" style="overflow:hidden"><span class="collapseDelete" style="width:66%; float:left; clear:right;">Callout x: <input type="text" class="leftX collapseDelete" style="width:38px" placeHolder="205"></span><span class="collapseDelete" style="width:33%; float:left; clear:right;">y: <input type="text" class="leftY collapseDelete" style="width:38px" placeHolder="350"></span></div>'),
      $('<hr class="collapseDelete">'),
      $('<p><span class="collapseDelete">Right Character</span></p>'),
      $('<div class="collapseDelete" style="overflow:hidden"><span class="collapseDelete" style="width:50%; float:left;">Character:</span><select class="rightCharacter collapseDelete" style="width: 50%; float:right; clear:right;"></select></div>'),
      $('<div class="collapseDelete" style="overflow:hidden"><button class="testRightVoice" style="background:none;float:left">' + viewTemplates.speaker + '</button><span class="collapseDelete" style="width:40%; float:left;">Voice:</span><select class="rightVoice collapseDelete" style="width: 50%; float:left; clear:right;"></select></div>'),
      $('<div class="collapseDelete" style="overflow:hidden"><span class="collapseDelete" style="width:50%; float:left;">Pitch:</span><input type="text" class="rightPitch collapseDelete" style="width:50%; float:right; clear:right;" placeHolder="0" /></div>'),
      $('<div class="collapseDelete" style="overflow:hidden"><span class="collapseDelete" style="width:50%; float:left;">Y Offset:</span><input type="text" class="rightYOffset collapseDelete" style="width:50%; float:right; clear:right;" placeHolder="0" /></div>'),
      $('<div class="collapseDelete" style="overflow:hidden"><span class="collapseDelete" style="width:66%; float:left; clear:right;">Callout x: <input type="text" class="rightX collapseDelete" style="width:38px" placeHolder="175"></span><span class="collapseDelete" style="width:33%; float:left; clear:right;">y: <input type="text" class="rightY collapseDelete" style="width:38px" placeHolder="340"></span></div>'),
      $('<hr class="collapseDelete">'),
      $('<div class="collapseDelete"><span class="collapseDelete">Phrase Corrections</span><input class="collapseDelete, phraseCorrections" type="checkbox" style="float:right; width:20px;"></div>'),
      $('<div class="collapseDelete" style="overflow:hidden, width:100%"><span class="collapseDelete" style="width:50%; float:left;">Background:</span>\n<select class="background collapseDelete" style="width:100%;"></select></div>'),
      $('</div>')
    ]
    let _this = this
    $(elements).each(function (index, element) {
      _this.$box.append(element)
    })
    this.$box.find('input,select').on('mousedown click', function (evt) { evt.stopPropagation() })

    // Populate character lists
    for (let i = 0; i < CharacterList.length; i++) {
      this.$box.find('select.leftCharacter').append($('<option>', {
        value: CharacterList[i],
        text: CharacterList[i]
      }))
      this.$box.find('select.rightCharacter').append($('<option>', {
        value: CharacterList[i],
        text: CharacterList[i]
      }))
    }

    // Populate backgrounds
    for (let i = 0; i < BackgroundList.length; i++) {
      this.$box.find('select.background').append($('<option>', {
        value: BackgroundList[i][0],
        text: BackgroundList[i][1]
      }))
    }

    // Populate voice lists
    this.$box.find('select.leftVoice').append($('<option>', {
      value: 'female',
      text: 'female'
    }))
    this.$box.find('select.leftVoice').append($('<option>', {
      value: 'male',
      text: 'male'
    }))
    this.$box.find('select.rightVoice').append($('<option>', {
      value: 'female',
      text: 'female'
    }))
    this.$box.find('select.rightVoice').append($('<option>', {
      value: 'male',
      text: 'male'
    }))

    // Fill in values
    this.$box.find('input.gameName').val(this.model.get('gameName'))
    this.$box.find('input.gameTitle').val(this.model.get('gameTitle'))
    this.$box.find('select.leftCharacter').val(this.model.get('leftCharacter'))
    this.$box.find('select.leftVoice').val(this.model.get('leftVoice'))
    this.$box.find('input.leftPitch').val(this.model.get('leftPitch'))
    this.$box.find('input.leftYOffset').val(this.model.get('leftYOffset'))
    this.$box.find('input.leftX').val(this.model.get('leftX'))
    this.$box.find('input.leftY').val(this.model.get('leftY'))
    this.$box.find('select.rightCharacter').val(this.model.get('rightCharacter'))
    this.$box.find('select.rightVoice').val(this.model.get('rightVoice'))
    this.$box.find('input.rightPitch').val(this.model.get('rightPitch'))
    this.$box.find('input.rightYOffset').val(this.model.get('rightYOffset'))
    this.$box.find('input.rightX').val(this.model.get('rightX'))
    this.$box.find('input.rightY').val(this.model.get('rightY'))
    this.$box.find('input.phraseCorrections').prop('checked', this.model.get('phraseCorrection'))

    // Bind fields to data
    this.$box.find('select.leftCharacter').on('change', _.bind(function (evt) { this.model.set('leftCharacter', $(evt.target).val()) }, this))
    this.$box.find('select.leftVoice').on('change', _.bind(function (evt) { this.model.set('leftVoice', $(evt.target).val()) }, this))
    this.$box.find('input.leftPitch').on('change', _.bind(function (evt) { this.model.set('leftPitch', $(evt.target).val()) }, this))
    this.$box.find('input.leftYOffset').on('change', _.bind(function (evt) { this.model.set('leftYOffset', $(evt.target).val()) }, this))
    this.$box.find('input.leftX').on('change', _.bind(function (evt) { this.model.set('leftX', $(evt.target).val()) }, this))
    this.$box.find('input.leftY').on('change', _.bind(function (evt) { this.model.set('leftY', $(evt.target).val()) }, this))
    this.$box.find('select.rightCharacter').on('change', _.bind(function (evt) { this.model.set('rightCharacter', $(evt.target).val()) }, this))
    this.$box.find('select.rightVoice').on('change', _.bind(function (evt) { this.model.set('rightVoice', $(evt.target).val()) }, this))
    this.$box.find('input.rightPitch').on('change', _.bind(function (evt) { this.model.set('rightPitch', $(evt.target).val()) }, this))
    this.$box.find('input.rightYOffset').on('change', _.bind(function (evt) { this.model.set('rightYOffset', $(evt.target).val()) }, this))
    this.$box.find('input.rightX').on('change', _.bind(function (evt) { this.model.set('rightX', $(evt.target).val()) }, this))
    this.$box.find('input.rightY').on('change', _.bind(function (evt) { this.model.set('rightY', $(evt.target).val()) }, this))
    this.$box.find('input.phraseCorrections').on('change', _.bind(function (evt) { this.model.set('phraseCorrection', $(evt.target).prop('checked')) }, this))
    this.$box.find('select.background').on('change', _.bind(function (evt) { this.model.set('background', $(evt.target).val()) }, this))

    // Buttons
    this.$box.find('.testLeftVoice').on('click', _.bind(function () { this.textToSpeech('This is the left character\'s voice', this.getVoiceFromGender(this.model.get('leftVoice')), this.model.get('leftPitch')) }, this))
    this.$box.find('.testRightVoice').on('click', _.bind(function () { this.textToSpeech('This is the right character\'s voice', this.getVoiceFromGender(this.model.get('rightVoice')), this.model.get('rightPitch')) }, this))

    this.model.set('expanded', true)

    this.model.set('size', { width: 180, height: 650 })
  },

  collapseNode: function () {
    this.$box.find('.toggle').unbind('click')
    this.$box.find('.toggle').on('click', _.bind(this.expandNode, this))
    this.$box.find('.toggle').html('+')

    this.$box.find('.collapseDelete').remove()

    this.model.set('expanded', false)

    this.model.set('size', { width: 180, height: 170 })
  },

  textToSpeech (text, voice, pitch) {
    if (voice) {
      try {
        if (speechSynthesis.speaking) {
          speechSynthesis.cancel()
          setTimeout(() => {
            this.textToSpeech(text, voice, pitch)
          }, 500)
        } else {
          var voicename = voiceList.filter(a => a.name.toLowerCase().includes(voice.toLowerCase())) 
          var msg = new SpeechSynthesisUtterance()
          msg.voice = voicename.length > 0 ? voicename[0] : voiceList[0]
          msg.default = false
          msg.voiceURI = 'native'
          msg.volume = 1
          msg.rate = 1
          msg.pitch = parseInt(pitch)
          msg.text = text
          msg.lang = 'en-US'
          speechSynthesis.speak(msg)
        }
      } catch (e) {
        console.log(e)
      }
    }
  },

  getVoiceFromGender (gender) {
    if (gender === 'male') {
      for (let i = 0; i < voiceList.length; i++) {
        if (voiceList[i].name.search('David') !== -1) return voiceList[i].name
      }
    } else {
      for (let i = 0; i < voiceList.length; i++) {
        if (voiceList[i].name.search('Zira') !== -1) return voiceList[i].name
      }
    }
  }
})

joint.shapes.dialogue.End = joint.shapes.devs.Model.extend({
  defaults: joint.util.deepSupplement(
    {
      type: 'dialogue.End',
      inPorts: ['input'],
      actor: '',
      textarea: 'Start writing',
      attrs: {
        '.outPorts circle': { unlimitedConnections: ['dialogue.Choice'] }
      },
      size: { width: 150, height: 50 }
    },
    joint.shapes.dialogue.Base.prototype.defaults
  )
})
joint.shapes.dialogue.EndView = joint.shapes.dialogue.BaseView.extend({
  template: [
    '<div class="node">',
    '<span class="label"></span>',
    '<button class="delete">x</button>',
    '</div>'
  ].join('')
})

function gameData () {
  var cells = graph.toJSON().cells
  var nodesByID = {}
  var cellsByID = {}
  var nodes = []
  for (var i = 0; i < cells.length; i++) {
    var cell = cells[i]
    if (cell.type !== 'link') {
      var node = {
        type: cell.type.slice('dialogue.'.length),
        id: cell.id,
        actor: cell.actor,
        title: cell.title
      }
      if (node.type === 'Branch') {
        node.variable = cell.name
        node.branches = {}
        for (var j = 0; j < cell.values.length; j++) {
          var branch = cell.values[j]
          node.branches[branch] = null
        }
      } else if (node.type === 'Set') {
        node.variable = cell.name
        node.value = cell.value
        node.next = null
      } else if (node.type === 'Choice') {
        node.name = cell.name
        node.title = cell.title
        node.next = null
      } else {
        node.actor = cell.actor
        node.name = cell.name
        node.next = null
      }
      nodes.push(node)
      nodesByID[cell.id] = node
      cellsByID[cell.id] = cell
    }
  }
  for (var i = 0; i < cells.length; i++) {
    var cell = cells[i]
    if (cell.type === 'link') {
      var source = nodesByID[cell.source.id]
      var target = cell.target ? nodesByID[cell.target.id] : null
      if (source) {
        if (source.type === 'Branch') {
          var portNumber = parseInt(cell.source.port.slice('output'.length))
          var value
          if (portNumber === 0) value = '_default'
          else {
            var sourceCell = cellsByID[source.id]
            value = sourceCell.values[portNumber - 1]
          }
          source.branches[value] = target ? target.id : null
        } else if (
          (source.type === 'Text' || source.type === 'Node') &&
          target &&
          target.type === 'Choice'
        ) {
          if (!source.choices) {
            source.choices = []
            delete source.next
          }
          source.choices.push(target.id)
        } else source.next = target ? target.id : null
      }
    }
  }
  return nodes
}

var filename = null
var defaultFilename = 'dialogue.json'

function flash (text) {
  var $flash = $('#flash')
  $flash.text(text)
  $flash.stop(true, true)
  $flash.show()
  $flash.css('opacity', 1.0)
  $flash.fadeOut({ duration: 1500 })
}

function offerDownload (name, data) {
  var a = $('<a>')
  a.attr('download', name)
  a.attr(
    'href',
    'data:application/json,' + encodeURIComponent(JSON.stringify(data))
  )
  a.attr('target', '_blank')
  a.hide()
  $('body').append(a)
  a[0].click()
  a.remove()
}

function promptFilename (callback) {
  if (fs) {
    filename = null
    window.frame.openDialog(
      {
        type: 'save'
      },
      function (err, files) {
        if (!err && files.length === 1) {
          filename = files[0]
          callback(filename)
        }
      }
    )
  } else {
    filename = prompt('Filename', defaultFilename)
    callback(filename)
  }
}

function applyTextFields () {
  $('input[type=text]').blur()
  $('input[type=choice]').blur()
  $('textarea').blur()
}

function save () {
  applyTextFields()
  if (!filename) promptFilename(doSave)
  else doSave()
}

function doSave () {
  if (filename) {
    if (fs) {
      fs.writeFileSync(filename, JSON.stringify(graph), 'utf8')
      fs.writeFileSync(
        gameFilenameFromNormalFilename(filename),
        JSON.stringify(gameData()),
        'utf8'
      )
    } else {
      if (!localStorage[filename]) addFileEntry(filename)
      localStorage[filename] = JSON.stringify(graph)
    }
    flash('Saved ' + filename)
  }
}

function load () {
  if (fs) {
    window.frame.openDialog(
      {
        type: 'open',
        multiSelect: false
      },
      function (err, files) {
        if (!err && files.length === 1) {
          graph.clear()
          filename = files[0]
          graph.fromJSON(JSON.parse(fs.readFileSync(filename, 'utf8')))
        }
      }
    )
  } else {
    $('#menu').show()
  }
}

function exportFile () {
  if (!fs) {
    applyTextFields()
    let errors = Validator.getGraphErrors(graph)
    if (errors.length === 0) {
      var gameState = convertToGameState(graph)
      offerDownload(filename || defaultFilename, gameState)
    } else {
      alert('Errors in project. Use the \'Validate\' option to find errors.')
    }
  }
}

function publish () {
  applyTextFields()
  let errors = Validator.getGraphErrors(graph)
  if (errors.length === 0) {
    var gameState = convertToGameState(graph)
    let name = getModuleName()
    dtml.dtml.publishDialog(name, gameState, function (result) {
      if (result) {
        if (result.ok) {
          alert('The dialog has been published')
        } else {
          alert('There was an error. Please try again')
        }
      } else {
        alert('Error publishing module')
      }
    })
  } else {
    alert('Errors in project. Use the \'Validate\' option to find errors.')
  }
}

function getModuleName () {
  for (let i = 0; i < graph.attributes.cells.models.length; i++) {
    let cell = graph.attributes.cells.models[i]
    if (cell.attributes.type === 'dialogue.Start') {
      return cell.attributes.gameName
    }
  }
}

function convertToGameState (graph) {
  var gameState = {
    Setup: {},
    StartAt: '',
    States: {},
    graphData: graph
  }

  // Get the setup information
  for (let i = 0; i < graph.attributes.cells.models.length; i++) {
    let cell = graph.attributes.cells.models[i]
    if (cell.attributes.type === 'dialogue.Start') {
      gameState.Setup.Name = cell.attributes.gameName
      gameState.Setup.Title = cell.attributes.gameTitle
      gameState.Setup.LeftCharacter = cell.attributes.leftCharacter
      gameState.Setup.LeftVoice = cell.attributes.leftVoice || voiceList[0].name
      gameState.Setup.LeftPitch = Number(cell.attributes.leftPitch) || 0
      gameState.Setup.LeftAddY = Number(cell.attributes.leftYOffset) || 0
      gameState.Setup.CallOutLeftX = Number(cell.attributes.leftX) || 205
      gameState.Setup.CallOutLeftY = Number(cell.attributes.leftY) || 350
      gameState.Setup.RightCharacter = cell.attributes.rightCharacter
      gameState.Setup.RightVoice = cell.attributes.rightVoice || voiceList[0].name
      gameState.Setup.RightPitch = Number(cell.attributes.rightPitch) || 0
      gameState.Setup.RightAddY = Number(cell.attributes.rightYOffset) || 0
      gameState.Setup.CallOutRightX = Number(cell.attributes.rightX) || 175
      gameState.Setup.CallOutRightY = Number(cell.attributes.rightY) || 340
      gameState.Setup.Backgrounds = [cell.attributes.background]
      gameState.Setup.StartingBackground = cell.attributes.background
      gameState.Setup.PhraseCorrection = cell.attributes.phraseCorrection
    }
  }

  // Get Starting State Name
  for (let i = 0; i < graph.attributes.cells.models.length; i++) {
    let link = graph.attributes.cells.models[i]
    if (link.attributes.type === 'link') {
      let source = graph.getCell(link.attributes.source.id)
      let target = graph.getCell(link.attributes.target.id)
      if (source.attributes.type === 'dialogue.Start') {
        gameState.StartAt = target.attributes.name
      }
    }
  }

  // Get all states
  for (let i = 0; i < graph.attributes.cells.models.length; i++) {
    let cell = graph.attributes.cells.models[i]
    if (cell.attributes.type === 'dialogue.Question') {
      let newState = {
        Type: 'Conversation',
        Question: cell.attributes.prompt,
        AnswerWords: cell.attributes.answerWords.split(', '),
        Solutions: {},
        OnStateEnter: {},
        OnStateExit: {}
      }
      if (cell.attributes.background && cell.attributes.background !== '-') {
        newState.OnStateEnter.Background = cell.attributes.background
        // Add it to the list of backgrounds to load
        gameState.Setup.Backgrounds.push(cell.attributes.background)
      }
      if (cell.attributes.enterLeftAnimation) {
        newState.OnStateEnter.Left = cell.attributes.enterLeftAnimation
      }
      if (cell.attributes.enterLeftDirection) {
        newState.OnStateEnter.LeftDo = cell.attributes.enterLeftDirection
      }
      if (cell.attributes.enterRightAnimation) {
        newState.OnStateEnter.Right = cell.attributes.enterRightAnimation
      }
      if (cell.attributes.enterRightDirection) {
        newState.OnStateEnter.RightDo = cell.attributes.enterRightDirection
      }
      if (cell.attributes.exitLeftAnimation) {
        newState.OnStateExit.Left = cell.attributes.exitLeftAnimation
      }
      if (cell.attributes.exitLeftDirection) {
        newState.OnStateExit.LeftDo = cell.attributes.exitLeftDirection
      }
      if (cell.attributes.exitRightAnimation) {
        newState.OnStateExit.Right = cell.attributes.exitRightAnimation
      }
      if (cell.attributes.exitRightDirection) {
        newState.OnStateExit.RightDo = cell.attributes.exitRightDirection
      }
      gameState.States[cell.attributes.name] = newState
    }
  }

  // Map of which solutions are in each state
  let solutionMap = {}
  // Add solutions to states
  for (let i = 0; i < graph.attributes.cells.models.length; i++) {
    let link = graph.attributes.cells.models[i]
    if (link.attributes.type === 'link') {
      let source = graph.getCell(link.attributes.source.id)
      let target = graph.getCell(link.attributes.target.id)
      if (source.attributes.type === 'dialogue.Question') {
        // Save which state the solution block is linked from
        solutionMap[target.attributes.id] = source
        // Add solutions to the state
        for (let j = 0; j < target.attributes.answers.length; j++) {
          let solution = target.attributes.answers[j].toLowerCase()
          let score = Number(target.attributes.scores[j])
          gameState.States[source.attributes.name].Solutions[solution] = {
            Score: score || 0,
            Next: ''
          }
        }
        gameState.States[source.attributes.name].Solutions['default'] = {
          Score: -50,
          Next: null
        }
      }
    }
  }
  // Set next state for each solution
  for (let i = 0; i < graph.attributes.cells.models.length; i++) {
    let link = graph.attributes.cells.models[i]
    if (link.attributes.type === 'link') {
      let source = graph.getCell(link.attributes.source.id)
      let target = graph.getCell(link.attributes.target.id)
      if (source.attributes.type === 'dialogue.Solution') {
        let sourceState = solutionMap[source.attributes.id]
        let targetStateName
        if (target.attributes.type === 'dialogue.Question') {
          targetStateName = target.attributes.name
        } else if (target.attributes.type === 'dialogue.End') {
          targetStateName = 'End'
        }
        // Set next state for each solution
        for (let j = 0; j < source.attributes.answers.length; j++) {
          let solution = source.attributes.answers[j].toLowerCase()
          gameState.States[sourceState.attributes.name].Solutions[solution].Next = targetStateName
        }
      }
    }
  }

  // Add end state
  gameState.States.End = {
    Type: 'End',
    Question: '',
    AnswerWords: [],
    Solutions: { }
  }

  return gameState
}

function gameFilenameFromNormalFilename (f) {
  return f.substring(0, f.length - 2) + 'on'
}

function exportGameFile () {
  if (!fs) {
    applyTextFields()
    offerDownload(
      gameFilenameFromNormalFilename(filename || defaultFilename),
      gameData()
    )
  }
}

function importFile () {
  if (!fs) $('#file').click()
}

function importRemoteFile (name, version) {
  getRemoteModule(name, version).then(function (data) {
    graph.clear()
    let fileData = JSON.parse(data)
    let graphData = JSON.stringify(fileData.graphData)
    graph.fromJSON(JSON.parse(graphData))
  }).catch(function (error) {
    console.log(error + ' - Could not load remote game module')
  })
}

function getRemoteModule (name, version) {
  return new Promise(function (resolve, reject) {
    let xmlHttp = new XMLHttpRequest()
    xmlHttp.onreadystatechange = function () {
      if (xmlHttp.readyState === 4) resolve(xmlHttp.responseText)
    }
    xmlHttp.addEventListener('error', function (evt) {
      reject(evt)
    })
    xmlHttp.open('Get', 'https://dtml.org/api/DialogService/Dialog?name=' + name + '&version=' + version + '&bypassCache=true')
    xmlHttp.send(null)
  })
}

function getModuleList () {
  return new Promise(function (resolve, reject) {
    let xmlHttp = new XMLHttpRequest()
    xmlHttp.onreadystatechange = function () {
      console.log(xmlHttp.responseText)
      if (xmlHttp.readyState === 4) resolve(xmlHttp.responseText)
    }
    xmlHttp.addEventListener('error', function (evt) {
      reject(evt)
    })
    xmlHttp.open('Get', 'https://dtml.org/api/DialogService/List')
    xmlHttp.send(null)
  })
}

function updateRemoteModuleList () {
  getModuleList().then(function (data) {
    remoteModules = JSON.parse(data)
    remoteModules = groupModuleVersions(remoteModules)
  }).catch(function (error) {
    console.log(error + ' - Could not load remote game modules')
  })
}

// Groups different versions of the same module into arrays
function groupModuleVersions (moduleList) {
  let groupedModules = {}
  // Group modules with the same name
  for (let i = 0; i < moduleList.length; i++) {
    let name = moduleList[i]['Name']
    if (!groupedModules[name]) {
      groupedModules[name] = []
    }
    groupedModules[name].push(moduleList[i])
  }
  // Sort groups by version number
  for (let i = 0; i < groupedModules.length; i++) {
    groupedModules[i].sort()
  }
  return groupedModules
}

function getStatusText (statusNumber) {
  switch (statusNumber) {
    case 3: return 'active'
    default: return 'draft'
  }
}

function add (constructor) {
  return function () {
    var position = $('.context-menu-root').position()
    var container = $('#container')[0]
    var element = new constructor({
      position: {
        x: position.left + container.scrollLeft,
        y: position.top + container.scrollTop
      }
    })
    graph.addCells([element])
  }
}

function clear () {
  if (confirm('Are you sure you want to clear the graph?')) {
    graph.clear()
    filename = null
  }
}

function openHelp () {
  window.open('https://docs.dtml.org/conversational-games/conversational-games-concept')
}

function previewGame () {
  applyTextFields()
  let errors = Validator.getGraphErrors(graph)
  if (errors.length === 0) {
    let gameState = convertToGameState(graph)
    // let url = 'http://localhost:3000/?test=true'
    let url = 'https://dtml.org/games/conversations/index.html?test=true'
    let previewWindow = window.open(url)
    setTimeout(function () {
      previewWindow.postMessage(JSON.stringify(gameState), '*')
    }, 1000)
  } else {
    alert('Errors in project. Use the \'Validate\' option to find errors.')
  }
}

var defaultLink = new joint.dia.Link({
  // toolMarkup: ['<g class="element-tools">',
  //   '<g class="element-tool-remove"><circle fill="red" r="11"/>',
  //   '<path transform="scale(.8) translate(-16, -16)" d="M24.778,21.419 19.276,15.917 24.777,10.415 21.949,7.585 16.447,13.087 10.945,7.585 8.117,10.415 13.618,15.917 8.116,21.419 10.946,24.248 16.447,18.746 21.948,24.248z"/>',
  //   '<title>Remove this element from the model</title>',
  //   '</g>',
  //   '</g>'].join('')
})
defaultLink.connector('smooth')

var paper = new joint.dia.Paper({
  el: $('#paper'),
  width: 16000,
  height: 8000,
  gridSize: 16,
  model: graph,
  validateMagnet: validateMagnet,
  snapLinks: { radius: 75 },
  defaultLink: defaultLink,
  // linkView: defaultLinkView,
  validateConnection: validateConnection,
  linkPinning: false
})

// paper.on('link:mouseenter', function (linkView) {
//   linkView.showTools()
// })

// paper.on('link:mouseleave', function (linkView) {
//   linkView.hideTools()
// })

var panning = false
var mousePosition = { x: 0, y: 0 }
paper.on('blank:pointerdown', function (e, x, y) {
  panning = true
  mousePosition.x = e.pageX
  mousePosition.y = e.pageY
  $('body').css('cursor', 'move')
  applyTextFields()
})
paper.on('cell:pointerdown', function (e, x, y) {
  applyTextFields()
})

$('#container').mousemove(function (e) {
  if (panning) {
    var $this = $(this)
    $this.scrollLeft($this.scrollLeft() + mousePosition.x - e.pageX)
    $this.scrollTop($this.scrollTop() + mousePosition.y - e.pageY)
    mousePosition.x = e.pageX
    mousePosition.y = e.pageY
  }
})

$('#container').mouseup(function (e) {
  panning = false
  $('body').css('cursor', 'default')
})

function handleFiles (files) {
  filename = files[0].name
  var fileReader = new FileReader()
  fileReader.onload = function (e) {
    graph.clear()
    let fileData = JSON.parse(e.target.result)
    fileData = convertStatesToQuestions(fileData)
    let graphData = JSON.stringify(fileData.graphData)
    graph.fromJSON(JSON.parse(graphData))
  }
  fileReader.readAsText(files[0])
}

// Converts any nodes from the old 'State' format to the new 'Question' format
function convertStatesToQuestions (graph) {
  for (let i = 0; i < graph.graphData.cells.length; i++) {
    let cell = graph.graphData.cells[i]
    if (cell.type === 'dialogue.State') {
      graph.graphData.cells[i].type = 'dialogue.Question'
    }
  }
  return graph
}

$('#file').on('change', function () {
  handleFiles(this.files)
})

$('body').on('dragenter', function (e) {
  e.stopPropagation()
  e.preventDefault()
})

$('body').on('dragexit', function (e) {
  e.stopPropagation()
  e.preventDefault()
})

$('body').on('dragover', function (e) {
  e.stopPropagation()
  e.preventDefault()
})

$('body').on('drop', function (e) {
  e.stopPropagation()
  e.preventDefault()
  handleFiles(e.originalEvent.dataTransfer.files)
})

$(window).on('keydown', function (event) {
  // Catch Ctrl-S or key code 19 on Mac (Cmd-S)
  if (
    ((event.ctrlKey || event.metaKey) &&
      String.fromCharCode(event.which).toLowerCase() === 's') ||
    event.which === 19
  ) {
    event.stopPropagation()
    event.preventDefault()
    save()
    return false
  } else if (
    (event.ctrlKey || event.metaKey) &&
    String.fromCharCode(event.which).toLowerCase() === 'o'
  ) {
    event.stopPropagation()
    event.preventDefault()
    load()
    return false
  } else if (
    (event.ctrlKey || event.metaKey) &&
    String.fromCharCode(event.which).toLowerCase() === 'e'
  ) {
    event.stopPropagation()
    event.preventDefault()
    exportFile()
    return false
  }
  return true
})

$(window).resize(function () {
  applyTextFields()
  var $window = $(window)
  var $container = $('#container')
  $container.height($window.innerHeight())
  $container.width($window.innerWidth())
  var $menu = $('#menu')
  $menu.css(
    'top',
    Math.max(0, ($window.height() - $menu.outerHeight()) / 2) + 'px'
  )
  $menu.css(
    'left',
    Math.max(0, ($window.width() - $menu.outerWidth()) / 2) + 'px'
  )
  return this
})

function addFileEntry (name) {
  var entry = $('<div>')
  entry.text(name)
  var deleteButton = $('<button class="delete">-</button>')
  entry.append(deleteButton)
  $('#menu').append(entry)

  deleteButton.on('click', function (event) {
    localStorage.removeItem(name)
    entry.remove()
    event.stopPropagation()
  })

  entry.on('click', function (event) {
    graph.clear()
    graph.fromJSON(JSON.parse(localStorage[name]))
    filename = name
    $('#menu').hide()
  })
}

;(function () {
  for (var i = 0; i < localStorage.length; i++) { addFileEntry(localStorage.key(i)) }
})()

$('#menu button.close').click(function () {
  $('#menu').hide()
  panning = false
})

$(window).trigger('resize')

$(function () {
  $.contextMenu({
    selector: '#paper',
    build: function ($triggerElement, e) {
      updateRemoteModuleList()
      let remoteModuleOptions = {}
      if (remoteModules) {
        if (remoteModules.length > 0) {
          for (let moduleGroup in remoteModules) {
            remoteModuleOptions[moduleGroup] = {
              'name': remoteModules[moduleGroup][0].Name,
              'items': {}
            }
            for (let i = 0; i < remoteModules[moduleGroup].length; i++) {
              remoteModuleOptions[moduleGroup]['items'][i] = {
                'name': 'Version ' + remoteModules[moduleGroup][i]['Version'] + ' (' + getStatusText(remoteModules[moduleGroup][i]['Status']) + ')',
                'callback': function () { importRemoteFile(remoteModules[moduleGroup][i].Name, remoteModules[moduleGroup][i].Version) }
              }
            }
          }
        } else {
          remoteModuleOptions[0] = {
            'name': 'No modules found'
          }
        }
      } else {
        remoteModuleOptions['Loading...'] = {
          'name': 'Loading...'
        }
      }

      return {
        items: {
          'question': { 'name': 'Question', 'callback': add(joint.shapes.dialogue.Question) },
          'solution': { 'name': 'Solution', 'callback': add(joint.shapes.dialogue.Solution) },
          'start': { 'name': 'Start', 'callback': add(joint.shapes.dialogue.Start) },
          'end': { 'name': 'End', 'callback': add(joint.shapes.dialogue.End) },
          'split': '-----',
          'import': {
            'name': 'Import',
            'items': {
              'local': { 'name': 'Local File', 'callback': importFile },
              'remote': {
                'name': 'Remote File',
                'items': remoteModuleOptions
              }
            }
          },
          'export': { 'name': 'Export', 'callback': exportFile },
          'publish': { 'name': 'Publish', 'callback': publish },
          'clear': { 'name': 'Clear', 'callback': clear },
          'validate': {
            'name': 'Validate',
            'callback': function () {
              Validator.validateGraph(graph)
            }
          },
          'preview': { 'name': 'Preview', 'callback': previewGame },
          'help': { 'name': 'Help', 'callback': openHelp }
        }
      }
    }
  })
})

/// AUTOLOAD IF URL HAS ? WILDCARD
if (loadOnStart != null) {
  loadOnStart += '.json'
  console.log(loadOnStart)
  graph.clear()
  filename = loadOnStart
  graph.fromJSON(JSON.parse(localStorage[loadOnStart]))
}
