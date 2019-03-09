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

addEventListener('app-ready', function (e) {
  fs = require('fs')
  $('#import').hide()
  $('#export').hide()
  $('#export-game').hide()
})

var graph = new joint.dia.Graph()

var defaultLink = new joint.dia.Link({
  attrs: {
    '.marker-target': { d: 'M 10 0 L 0 5 L 10 10 z' },
    '.link-tools .tool-remove circle, .marker-vertex': { r: 8 }
  }
})

defaultLink.set('smooth', true)

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
  ['dialogue.State', 'dialogue.Solution'],
  ['dialogue.Solution', 'dialogue.State'],
  ['dialogue.Start', 'dialogue.State'],
  ['dialogue.Solution', 'dialogue.End']
]

var voiceList = window.speechSynthesis.getVoices()
if (window.speechSynthesis.onvoiceschanged !== undefined) {
  window.speechSynthesis.onvoiceschanged = function () {
    voiceList = window.speechSynthesis.getVoices()
  }
}

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
  if (magnetT.attributes.magnet.nodeValue !== 'passive') return false

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
  var unlimitedConnections = magnet.getAttribute('unlimitedConnections')
  var links = graph.getConnectedLinks(cellView.model)
  for (var i = 0; i < links.length; i++) {
    var link = links[i]
    if (
      link.attributes.source.id === cellView.model.id &&
      link.attributes.source.port === magnet.attributes.port.nodeValue
    ) {
      // This port already has a connection
      if (unlimitedConnections && link.attributes.target.id) {
        var targetCell = graph.getCell(link.attributes.target.id)
        if (unlimitedConnections.indexOf(targetCell.attributes.type) !== -1) {
        // It's okay because this target type has unlimited connections
          return true
        }
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
joint.shapes.dialogue.BaseView = joint.shapes.devs.ModelView.extend({
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
    joint.shapes.devs.ModelView.prototype.initialize.apply(this, arguments)

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
    joint.shapes.devs.ModelView.prototype.render.apply(this, arguments)
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

joint.shapes.dialogue.ChoiceView = joint.shapes.devs.ModelView.extend({
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
    joint.shapes.devs.ModelView.prototype.initialize.apply(this, arguments)

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
    joint.shapes.devs.ModelView.prototype.render.apply(this, arguments)
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

joint.shapes.dialogue.State = joint.shapes.devs.Model.extend({
  defaults: joint.util.deepSupplement(
    {
      size: { width: 250, height: 240 },
      type: 'dialogue.State',
      inPorts: ['input'],
      outPorts: ['output'],
      attrs: {
        '.outPorts circle': { unlimitedConnections: ['dialogue.Solution'] }
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
joint.shapes.dialogue.StateView = joint.shapes.dialogue.BaseView.extend({
  template: [
    '<div class="node">',
    '<span class="label"> </span>',
    '<button class="delete">x</button>',
    '<input type="choice" class="name" placeholder="State Name" />',
    '<p> <textarea type="text" class="prompt" rows="3" cols="27" placeholder="Prompt"></textarea></p>',
    '<span>Answer Words:</span>',
    '<p> <textarea type="text" class="answerWords" rows="2" cols="27" placeholder="hello, thanks, etc..."></textarea></p>',
    '<button class="toggle" style="float:left;">+</button> <span>Options</span>',
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
      width: 250,
      height: 405
    })
    this.$box.find('.toggle').unbind('click')
    this.$box.find('.toggle').on('click', _.bind(this.collapseNode, this))
    this.$box.find('.toggle').html('-')
    var elements = [
      $('<input type="text" class="backgroundSelector" placeHolder="Background" />'),
      $('<span class="collapseDelete" style="font-weight:bold">On State Enter</span><br class="collapseDelete" />'),
      $('<span class="collapseDelete" style="width:50px">Left Character: </span>'),
      $('<input type="text" class="enterLeftAnimation" style="width:65px" placeHolder="Animation" />'),
      $('<input type="text" class="enterLeftDirection" style="width:65px; margin-left:5px" placeHolder="in or out" /><br class="collapseDelete" />'),
      $('<span class="collapseDelete" style="width:50px">Right Character: </span>'),
      $('<input type="text" class="enterRightAnimation" style="width:64px" placeHolder="Animation" />'),
      $('<input type="text" class="enterRightDirection" style="width:64px; margin-left:5px" placeHolder="in or out" /><br class="collapseDelete" />'),
      $('<hr class="collapseDelete" />'),
      $('<span class="collapseDelete" style="font-weight:bold">On State Exit</span><br class="collapseDelete" />'),
      $('<span class="collapseDelete" style="width:50px">Left Character: </span>'),
      $('<input type="text" class="exitLeftAnimation" style="width:65px" placeHolder="Animation" />'),
      $('<input type="text" class="exitLeftDirection" style="width:65px; margin-left:5px" placeHolder="in or out" /><br class="collapseDelete" />'),
      $('<span class="collapseDelete" style="width:50px">Right Character: </span>'),
      $('<input type="text" class="exitRightAnimation" style="width:64px" placeHolder="Animation" />'),
      $('<input type="text" class="exitRightDirection" style="width:64px; margin-left:5px" placeHolder="in or out" /><br class="collapseDelete" />')
    ]
    let _this = this
    $(elements).each(function (index, element) {
      _this.$box.append(element)
      if (element.is('input')) {
        element.on('click', function () { element.focus() })
      }
    })

    // Fill in values
    if (this.model.get('background')) { elements[0].val(this.model.get('background')) }
    if (this.model.get('enterLeftAnimation')) { elements[3].val(this.model.get('enterLeftAnimation')) }
    if (this.model.get('enterLeftDirection')) { elements[4].val(this.model.get('enterLeftDirection')) }
    if (this.model.get('enterRightAnimation')) { elements[6].val(this.model.get('enterRightAnimation')) }
    if (this.model.get('enterRightDirection')) { elements[7].val(this.model.get('enterRightDirection')) }
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
    elements[3].on('change', _.bind(function (evt) {
      this.model.set('enterLeftAnimation', $(evt.target).val())
    }, this))
    // Enter Left Direction
    elements[4].on('change', _.bind(function (evt) {
      this.model.set('enterLeftDirection', $(evt.target).val())
    }, this))
    // Enter Right Animation
    elements[6].on('change', _.bind(function (evt) {
      this.model.set('enterRightAnimation', $(evt.target).val())
    }, this))
    // Enter Right Direction
    elements[7].on('change', _.bind(function (evt) {
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
      width: 250,
      height: 240
    })
    this.$box.find('.toggle').unbind('click')
    this.$box.find('.toggle').on('click', _.bind(this.expandNode, this))
    this.$box.find('.toggle').html('+')
    this.$box.find('.collapseDelete').remove()
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
      leftCharacter: null,
      leftVoice: null,
      leftPitch: null,
      leftYOffset: null,
      leftX: null,
      leftY: null,
      rightCharacter: null,
      rightVoice: null,
      rightPitch: null,
      rightYOffset: null,
      rightX: null,
      rightY: null,
      backgrounds: [null]
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
    '<button class="toggle" style="float:left;">+</button> <span>Options</span>',
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
      $('<hr class="collapseDelete">'),
      $('<span class="collapseDelete">Left Character</span>'),
      $('<div class="collapseDelete" style="overflow:hidden"><span class="collapseDelete" style="width:50%; float:left;">Character:</span><input type="text" class="leftCharacter collapseDelete" style="width:50%; float:right; clear:right;" /></div>'),
      $('<div class="collapseDelete" style="overflow:hidden"><span class="collapseDelete" style="width:40%; float:left;">Voice:</span><select class="leftVoice collapseDelete" style="width: 50%; float:right; clear:right;"></select></div>'),
      $('<div class="collapseDelete" style="overflow:hidden"><span class="collapseDelete" style="width:50%; float:left;">Pitch:</span><input type="text" class="leftPitch collapseDelete" style="width:50%; float:right; clear:right;" placeHolder="0" /></div>'),
      $('<div class="collapseDelete" style="overflow:hidden"><span class="collapseDelete" style="width:50%; float:left;">Y Offset:</span><input type="text" class="leftYOffset collapseDelete" style="width:50%; float:right; clear:right;" placeHolder="0" /></div>'),
      $('<div class="collapseDelete" style="overflow:hidden"><span class="collapseDelete" style="width:66%; float:left; clear:right;">Callout x: <input type="text" class="leftX collapseDelete" style="width:38px" placeHolder="205"></span><span class="collapseDelete" style="width:33%; float:left; clear:right;">y: <input type="text" class="leftY collapseDelete" style="width:38px" placeHolder="350"></span></div>'),
      $('<hr class="collapseDelete">'),
      $('<span class="collapseDelete">Right Character</span>'),
      $('<div class="collapseDelete" style="overflow:hidden"><span class="collapseDelete" style="width:50%; float:left;">Character:</span><input type="text" class="rightCharacter collapseDelete" style="width:50%; float:right; clear:right;" /></div>'),
      $('<div class="collapseDelete" style="overflow:hidden"><span class="collapseDelete" style="width:50%; float:left;">Voice:</span><select class="rightVoice collapseDelete" style="width: 50%; float:right; clear:right;"></select></div>'),
      $('<div class="collapseDelete" style="overflow:hidden"><span class="collapseDelete" style="width:50%; float:left;">Pitch:</span><input type="text" class="rightPitch collapseDelete" style="width:50%; float:right; clear:right;" placeHolder="0" /></div>'),
      $('<div class="collapseDelete" style="overflow:hidden"><span class="collapseDelete" style="width:50%; float:left;">Y Offset:</span><input type="text" class="rightYOffset collapseDelete" style="width:50%; float:right; clear:right;" placeHolder="0" /></div>'),
      $('<div class="collapseDelete" style="overflow:hidden"><span class="collapseDelete" style="width:66%; float:left; clear:right;">Callout x: <input type="text" class="rightX collapseDelete" style="width:38px" placeHolder="175"></span><span class="collapseDelete" style="width:33%; float:left; clear:right;">y: <input type="text" class="rightY collapseDelete" style="width:38px" placeHolder="340"></span></div>'),
      $('<hr class="collapseDelete">'),
      $('<span class="collapseDelete">Backgrounds</span> <button class="removeBackground collapseDelete">-</button> <button class="addBackground collapseDelete">+</button>'),
    ]
    let _this = this
    $(elements).each(function (index, element) {
      _this.$box.append(element)
    })
    this.$box.find('input,select').on('mousedown click', function (evt) { evt.stopPropagation() })

    // Populate voice list
    for (let i = 0; i < voiceList.length; i++) {
      let voice = voiceList[i]
      this.$box.find('select.leftVoice').append($('<option>', {
        value: voice.name,
        text: voice.name
      }))
      this.$box.find('select.rightVoice').append($('<option>', {
        value: voice.name,
        text: voice.name
      }))
    }

    // Fill in values
    this.$box.find('input.gameName').val(this.model.get('gameName'))
    this.$box.find('input.gameTitle').val(this.model.get('gameTitle'))
    this.$box.find('input.leftCharacter').val(this.model.get('leftCharacter'))
    this.$box.find('select.leftVoice').val(this.model.get('leftVoice'))
    this.$box.find('input.leftPitch').val(this.model.get('leftPitch'))
    this.$box.find('input.leftYOffset').val(this.model.get('leftYOffset'))
    this.$box.find('input.leftX').val(this.model.get('leftX'))
    this.$box.find('input.leftY').val(this.model.get('leftY'))
    this.$box.find('input.rightCharacter').val(this.model.get('rightCharacter'))
    this.$box.find('select.rightVoice').val(this.model.get('rightVoice'))
    this.$box.find('input.rightPitch').val(this.model.get('rightPitch'))
    this.$box.find('input.rightYOffset').val(this.model.get('rightYOffset'))
    this.$box.find('input.rightX').val(this.model.get('rightX'))
    this.$box.find('input.rightY').val(this.model.get('rightY'))

    // Bind fields to data
    this.$box.find('input.leftCharacter').on('change', _.bind(function (evt) { this.model.set('leftCharacter', $(evt.target).val()) }, this))
    this.$box.find('select.leftVoice').on('change', _.bind(function (evt) { this.model.set('leftVoice', $(evt.target).val()) }, this))
    this.$box.find('input.leftPitch').on('change', _.bind(function (evt) { this.model.set('leftPitch', $(evt.target).val()) }, this))
    this.$box.find('input.leftYOffset').on('change', _.bind(function (evt) { this.model.set('leftYOffset', $(evt.target).val()) }, this))
    this.$box.find('input.leftX').on('change', _.bind(function (evt) { this.model.set('leftX', $(evt.target).val()) }, this))
    this.$box.find('input.leftY').on('change', _.bind(function (evt) { this.model.set('leftY', $(evt.target).val()) }, this))
    this.$box.find('input.rightCharacter').on('change', _.bind(function (evt) { this.model.set('rightCharacter', $(evt.target).val()) }, this))
    this.$box.find('select.rightVoice').on('change', _.bind(function (evt) { this.model.set('rightVoice', $(evt.target).val()) }, this))
    this.$box.find('input.rightPitch').on('change', _.bind(function (evt) { this.model.set('rightPitch', $(evt.target).val()) }, this))
    this.$box.find('input.rightYOffset').on('change', _.bind(function (evt) { this.model.set('rightYOffset', $(evt.target).val()) }, this))
    this.$box.find('input.rightX').on('change', _.bind(function (evt) { this.model.set('rightX', $(evt.target).val()) }, this))
    this.$box.find('input.rightY').on('change', _.bind(function (evt) { this.model.set('rightY', $(evt.target).val()) }, this))
    this.$box.find('input.background').on('change', _.bind(function (evt) {
      let backgrounds = this.model.get('backgrounds').slice(0)
      backgrounds[0] = $(evt.target).val()
      this.model.set('backgrounds', backgrounds)
    }, this))

    this.$box.find('.addBackground').on('click', _.bind(this.addBackground, this))
    this.$box.find('.removeBackground').on('click', _.bind(this.removeBackground, this))

    this.model.set('expanded', true)
  },

  collapseNode: function () {
    this.$box.find('.toggle').unbind('click')
    this.$box.find('.toggle').on('click', _.bind(this.expandNode, this))
    this.$box.find('.toggle').html('+')

    this.$box.find('.collapseDelete').remove()

    this.model.set('expanded', false)

    this.model.set('size', { width: 180, height: 170 })
  },

  addBackground: function () {
    var backgrounds = this.model.get('backgrounds').slice(0)
    backgrounds.push(null)
    this.model.set('backgrounds', backgrounds)
  },

  removeBackground: function () {
    if (this.model.get('backgrounds').length > 1) {
      var backgrounds = this.model.get('backgrounds').slice(0)
      backgrounds.pop()
      this.model.set('backgrounds', backgrounds)
    }
  },

  addBackgroundField (index) {
    var backgroundInput = $('<input type="text" class="background collapseDelete" />')
    let placeHolder = index === 0 ? 'Starting Background' : 'Background ' + (index + 1)
    backgroundInput.attr('placeHolder', placeHolder)
    backgroundInput.attr('index', index)
    backgroundInput.on('change', _.bind(function (evt) {
      let backgrounds = this.model.get('backgrounds').slice(0)
      backgrounds[$(evt.target).attr('index')] = $(evt.target).val()
      this.model.set('backgrounds', backgrounds)
    }, this))
    this.$box.append(backgroundInput)
    if (backgroundInput.is('input')) {
      backgroundInput.on('click', function () { backgroundInput.focus() })
    }
    this.updateSize()
  },

  updateBox: function () {
    joint.shapes.dialogue.BaseView.prototype.updateBox.apply(this, arguments)
    var backgrounds = this.model.get('backgrounds')
    var backgroundFields = this.$box.find('input.background')

    // Add value fields if necessary
    if (this.model.get('expanded') === true) {
      for (let i = backgroundFields.length; i < backgrounds.length; i++) {
        this.addBackgroundField(i)
      }
    }

    // Remove value fields if necessary
    for (let i = backgrounds.length; i < backgroundFields.length; i++) {
      $(backgroundFields[i]).remove()
      this.updateSize()
    }

    // Update value fields
    for (let i = 0; i < backgroundFields.length; i++) {
      let field = $(backgroundFields[i])
      if (!field.is(':focus')) field.val(backgrounds[i])
    }
  },

  updateSize: function () {
    var textField = $(this.$box.find('input.background')[0])
    var height = textField.outerHeight(true)
    this.model.set('size', {
      width: 180,
      height:
        550 + Math.max(0, (this.model.get('backgrounds').length - 1) * height)
    })
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
    var gameState = convertToGameState(graph)
    offerDownload(filename || defaultFilename, gameState)
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
      gameState.Setup.Backgrounds = cell.attributes.backgrounds
      break
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
    if (cell.attributes.type === 'dialogue.State') {
      let newState = {
        Type: 'Conversation',
        Question: cell.attributes.prompt,
        AnswerWords: cell.attributes.answerWords.split(', '),
        Solutions: {},
        OnStateEnter: {},
        OnStateExit: {}
      }
      if (cell.attributes.background) {
        newState.OnStateEnter.Background = cell.attributes.background
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
      if (source.attributes.type === 'dialogue.State') {
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
        if (target.attributes.type === 'dialogue.State') {
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

function add (constructor) {
  return function () {
    var position = $('#cmroot').position()
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

var paper = new joint.dia.Paper({
  el: $('#paper'),
  width: 16000,
  height: 8000,
  model: graph,
  gridSize: 16,
  defaultLink: defaultLink,
  validateConnection: validateConnection,
  validateMagnet: validateMagnet,
  snapLinks: { radius: 75 }
})

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
    let graphData = JSON.stringify(fileData.graphData)
    graph.fromJSON(JSON.parse(graphData))
  }
  fileReader.readAsText(files[0])
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

$('#paper').contextmenu({
  width: 150,
  items: [
    // { text: 'Text', alias: '1-1', action: add(joint.shapes.dialogue.Text) },
    // { text: 'Choice', alias: '1-2', action: add(joint.shapes.dialogue.Choice) },
    // { text: 'Branch', alias: '1-3', action: add(joint.shapes.dialogue.Branch) },
    // { text: 'Set', alias: '1-4', action: add(joint.shapes.dialogue.Set) },
    // { text: 'Node', alias: '1-5', action: add(joint.shapes.dialogue.Node) },
    { text: 'State', alias: '1-1', action: add(joint.shapes.dialogue.State) },
    { text: 'Solution', alias: '1-2', action: add(joint.shapes.dialogue.Solution) },
    { text: 'Start', alias: '1-3', action: add(joint.shapes.dialogue.Start) },
    { text: 'End', alias: '1-4', action: add(joint.shapes.dialogue.End) },
    { type: 'splitLine' },
    // { text: 'Save', alias: '2-1', action: save },
    // { text: 'Load', alias: '2-2', action: load },
    { text: 'Import', id: 'import', alias: '2-1', action: importFile },
    { text: 'Export', id: 'export', alias: '2-2', action: exportFile },
    { text: 'New', alias: '2-3', action: clear }
    // {
    //   text: 'Export game file',
    //   id: 'export-game',
    //   alias: '2-6',
    //   action: exportGameFile
    // }
  ]
})

/// AUTOLOAD IF URL HAS ? WILDCARD
if (loadOnStart != null) {
  loadOnStart += '.json'
  console.log(loadOnStart)
  graph.clear()
  filename = loadOnStart
  graph.fromJSON(JSON.parse(localStorage[loadOnStart]))
}
