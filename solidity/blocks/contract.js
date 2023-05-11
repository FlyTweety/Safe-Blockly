//在这里定义块

'use strict';

goog.provide('Blockly.Solidity.contract');

Blockly.Extensions.register(
  'declare_typed_variable',
  function() {
    var block = this;

    if (!this.getVariableNameField) {
      throw 'missing getVariableNameField method';
    }

    if (!this.getVariableType) {
      throw 'missing getVariableType method';
    }

    if (!this.getVariableGroup) {
      throw 'missing getVariableGroup method';
    }

    if (!this.getVariableScope) {
      throw 'missing getVariableScope method';
    }

    this.declareOrUpdateVariable = function(name, force = false) {
      var oldName = this.getVariableNameField().getValue();

      if (!this.getParent()) {
        return oldName;
      }

      if (!force && (!this.getParent() || oldName == name)) {
        return oldName;
      }

      var group = this.getVariableGroup();
      var scope = this.getVariableScope();
      var type = this.getVariableType();

      if (!Blockly.Solidity.getVariableByNameAndScope(name, scope, group)) {
        newName = name;
      } else {
        var count = 2;
        var newName = name + count;
        while (Blockly.Solidity.getVariableByNameAndScope(newName, scope, group)) {
          count++;
          newName = name + count;
        }
      }

      var variable = Blockly.Solidity.getVariableById(this.workspace, this.id);
      if (!variable) {
        Blockly.Solidity.createVariable(this.workspace, group, type, newName, scope, this.id);
      } else {
        variable.name = newName;
      }

      if (force) {
        this.getVariableNameField().setText(newName);
      }

      Blockly.Solidity.updateWorkspaceNameFields(this.workspace);

      return newName;
    };

    this.getVariableNameField().setValidator(function(name) {
      return block.declareOrUpdateVariable(name);
    });

    var onchange = null;
    if (goog.isFunction(this.onchange)) {
      onchange = this.onchange;
    }

    this.setOnChange(function(event) {
      Blockly.Solidity.updateWorkspaceNameFields(this.workspace);
      Blockly.Solidity.updateWorkspaceStateTypes(this.workspace);
      Blockly.Solidity.updateWorkspaceParameterTypes(this.workspace);

      if (event.blockId != this.id) {
        return;
      }

      if (event.type == "move" && !!event.oldParentId) {
        if (!!Blockly.Solidity.getVariableById(this.workspace, this.id)) {
          Blockly.Solidity.deleteVariableById(this.workspace, this.id);
        }
      }
      if (event.type == "move" && !!event.newParentId) {
        if (!this.workspace.getVariableById(this.id)) {
          this.declareOrUpdateVariable(this.getVariableNameField().getValue(), true);
        }
      }
      if (event.element == "field" && event.name == "TYPE") {
        var variable = this.workspace.getVariableById(this.id);

        variable.type = this.getVariableType();
        Blockly.Solidity.updateWorkspaceStateTypes(this.workspace);
      }

      if (!!onchange) {
        onchange.call(block, event);
      }
    });
  }
);

//这里定义了初始的合约块
Blockly.defineBlocksWithJsonArray([
  {
    "type": "contract",
    "message0": 'smart contract %1',
    "args0": [
      {
        "type": "field_input",
        "name": "NAME",
        "check": "String",
        "text": "MyContract",
      }
    ],
    "message1": "states %1",
    "args1": [
      {
        "type": "input_statement",
        "name": "STATES",
        "check": ["contract_state"],
        "align": "RIGHT"
      }
    ],
    "message2": "constructor %1",
    "args2": [
      {
        "type": "input_statement",
        "name": "CTOR",
        "check": ["contract_ctor"],
        "align": "RIGHT"
      }
    ],
    "message3": "methods %1",
    "args3": [
      {
        "type": "input_statement",
        "name": "METHODS",
        "check": ["contract_method"],
        "align": "RIGHT"
      }
    ],
    "colour": 160,
    "tooltip": "Declares a new smart contract."
  }
]);

//工具箱第一块
Blockly.Blocks['contract_state'] = {
  init: function() {
    var nameField = new Blockly.FieldTextInput('s');
    var valueField = new Blockly.FieldTextInput('default');
    this.appendDummyInput()
        .appendField('let')
        .appendField(new Blockly.FieldDropdown([
            [ "bool", "TYPE_BOOL" ],
            [ "int",  "TYPE_INT" ],
            [ "uint", "TYPE_UINT" ],
            ["address","TYPE_ADDR"],
            ["mapping(address=>uint)","TYPE_MAPPING"]
          ]),
          'TYPE'
        )
        .appendField(nameField, 'NAME')
        // .appendField('=').appendField(valueField,'VALUE');
    this.setPreviousStatement(true, 'contract_state');
    this.setNextStatement(true, 'contract_state');
    this.setColour(195);
    this.contextMenu = false;

    this._stateNameInitialized = false;

    this.getBlockName = function() { return "!"; }

    this.getVariableNameField = function() { return nameField; }
    this.getVariableType = function() { return this.getFieldValue('TYPE') };
    this.getVariableGroup = function() { return Blockly.Solidity.LABEL_GROUP_STATE };
    this.getVariableScope = function() {
      var scope = this.getParent();
      while (!!scope && scope.type != 'contract') {
        scope = scope.getParent();
      }
      return scope;
    };

    Blockly.Extensions.apply('declare_typed_variable', this, false);
  },
};


Blockly.Blocks['contract_state_get'] = {
  init: function() {
    this.appendDummyInput()
      .appendField(
        new Blockly.FieldDropdown([
          ["select state...", Blockly.Solidity.UNDEFINED_NAME],
        ]),
        "STATE_NAME"
      );
    this.setOutput(true, null);
    this.setColour(195);

    this.getVariableNameSelectField = function() { return this.getField('STATE_NAME'); };
    this.getVariableLabelGroup = function() { return Blockly.Solidity.LABEL_GROUP_STATE };
  }
};

Blockly.Blocks['set_state_to_msg'] = {
  init: function() {
    this.appendValueInput('STATE_VALUE')
      .appendField("set")
      .appendField(
        new Blockly.FieldDropdown(
          [["select state...", Blockly.Solidity.UNDEFINED_NAME]],
          this.validate
        ),
        "STATE_NAME"
      ).appendField('to msg.').appendField(new Blockly.FieldDropdown(
        [
          ['sender','MSG_SENDER'],['value','MSG_VALUE']
        ]
        ),'MSG_MEM');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(195);

    this.getVariableNameSelectField = function() { return this.getField('STATE_NAME'); };
    this.getVariableLabelGroup = function() { return Blockly.Solidity.LABEL_GROUP_STATE };
  },

  validate: function(stateNameVariableId) {
    var workspace = this.sourceBlock_.workspace;
    // FIXME: dirty hack to make sure updateWorkspaceStateTypes is called right after validate
    setTimeout(
      function() { Blockly.Solidity.updateWorkspaceStateTypes(workspace) },
      1
    );
    return stateNameVariableId;
  }
};

//这个是工具箱里的set块
Blockly.Blocks['contract_state_set'] = {
  init: function() {
    this.appendValueInput('STATE_VALUE')
      .appendField("set")
      .appendField(
        new Blockly.FieldDropdown(
          [["select state...", Blockly.Solidity.UNDEFINED_NAME]],
          this.validate
        ),
        "STATE_NAME"
      )
      .appendField("to");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(195);

    this.getVariableNameSelectField = function() { return this.getField('STATE_NAME'); };
    this.getVariableLabelGroup = function() { return Blockly.Solidity.LABEL_GROUP_STATE };
  },

  validate: function(stateNameVariableId) {
    var workspace = this.sourceBlock_.workspace;
    // FIXME: dirty hack to make sure updateWorkspaceStateTypes is called right after validate
    setTimeout(
      function() { Blockly.Solidity.updateWorkspaceStateTypes(workspace) },
      1
    );
    return stateNameVariableId;
  }
};

Blockly.Blocks['contract_method_parameter'] = {
  init: function() {
    var nameField = new Blockly.FieldTextInput('p');
    this.appendDummyInput()
        .appendField('let')
        .appendField(new Blockly.FieldDropdown([
            [ "bool", "TYPE_BOOL" ],
            [ "int",  "TYPE_INT" ],
            [ "uint", "TYPE_UINT" ],
            ["address","TYPE_ADDR"]
          ]),
          'TYPE'
        )
        .appendField(nameField, 'NAME');
    this.setPreviousStatement(true, 'contract_method_parameter');
    this.setNextStatement(true, 'contract_method_parameter');
    this.setColour(320);
    this.contextMenu = false;

    this.getVariableNameField = function() { return nameField };
    this.getVariableType = function() { return this.getFieldValue('TYPE') };
    this.getVariableGroup = function() { return Blockly.Solidity.LABEL_GROUP_PARAMETER };
    this.getVariableScope = function() {
      var scope = this.getParent();
      while (!!scope && (scope.type != 'contract_method' && scope.type != 'contract_ctor')) {
        scope = scope.getParent();
      }
      return scope;
    };

    Blockly.Extensions.apply('declare_typed_variable', this, false);
  },
};

Blockly.Blocks['contract_method_parameter_get'] = {
  init: function() {
    this.appendDummyInput()
      .appendField(
        new Blockly.FieldDropdown([
          ["select param...", Blockly.Solidity.UNDEFINED_NAME],
        ]),
        "PARAM_NAME"
      );
    this.setOutput(true, null);
    this.setColour(320);

    this.getVariableNameSelectField = function() { return this.getField('PARAM_NAME'); };
    this.getVariableLabelGroup = function() { return Blockly.Solidity.LABEL_GROUP_PARAMETER };
  }
};

Blockly.Blocks['contract_method'] = {
  init: function() {
    this.jsonInit({
      "message0": "method %1",
      "args0": [
        {
          "type": "field_input",
          "name": "NAME",
          "text": "myMethod"
        },
      ],
      "message1": "parameters %1",
      "args1": [
        {
          "type": "input_statement",
          "name": "PARAMS",
          "check": ["contract_method_parameter"],
          "align": "RIGHT"
        },
      ],
      "message2": "code %1",
      "args2": [
        {
          "type": "input_statement",
          "name": "STACK",
          "align": "RIGHT"
        }
      ],
      "previousStatement": "contract_method",
      "nextStatement": "contract_method",
      "colour": 290,
      "tooltip": "",
      "helpUrl": ""
    });

    this.getVariableNameField = function() { return this.getField('NAME') };
    this.getVariableType = function() { return 'void' };
    this.getVariableGroup = function() { return Blockly.Solidity.LABEL_GROUP_METHOD };
    this.getVariableScope = function() {
      var scope = this.getParent();
      while (!!scope && scope.type != 'contract') {
        scope = scope.getParent();
      }
      return scope;
    };

    Blockly.Extensions.apply('declare_typed_variable', this, false);
  },
};
Blockly.Blocks['contract_event'] = {
  init: function() {
    this.jsonInit({
      "message0": "event %1",
      "args0": [
        {
          "type": "field_input",
          "name": "NAME",
          "text": "myEvent"
        },
      ],
      "message1": "parameters %1",
      "args1": [
        {
          "type": "input_statement",
          "name": "PARAMS",
          "check": ["contract_event_parameter"],
          "align": "RIGHT"
        },
      ],
      "previousStatement": "null",
      "nextStatement": "null",
      "colour": 290,
      "tooltip": "",
      "helpUrl": ""
    });

    this.getVariableNameField = function() { return this.getField('NAME') };
    this.getVariableType = function() { return 'void' };
    this.getVariableGroup = function() { return Blockly.Solidity.LABEL_GROUP_METHOD };
    this.getVariableScope = function() {
      var scope = this.getParent();
      while (!!scope && scope.type != 'contract') {
        scope = scope.getParent();
      }
      return scope;
    };

    Blockly.Extensions.apply('declare_typed_variable', this, false);
  },
};

Blockly.Blocks['transfer'] = {
  init: function() {
    this.jsonInit({
      "message0": "transfer %1",
      "args0": [
        {
          "type": "field_input",
          "name": "NAME",
          "text": "transfer"
        },
      ],
      "message1": "amount %1",
      "args1": [
        {
          "type": "input_value",
          "name": "FROM",
          // "check": ["contract_state_get"],
          "align": "RIGHT"
        },
      ],
      "message2": "address %1",
      "args2": [
        {
          "type": "input_value",
          "name": "TO",
          
          "align": "RIGHT"
        },
      ]
      ,
      "previousStatement": "null",
      "nextStatement": "null",
      "colour": 290,
      "tooltip": "",
      "helpUrl": ""
    });    
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.getVariableNameField = function() { return this.getField('NAME') };
    this.getVariableType = function() { return 'void' };
    this.getVariableGroup = function() { return Blockly.Solidity.LABEL_GROUP_METHOD };
    this.getVariableScope = function() {
      var scope = this.getParent();
      while (!!scope && scope.type != 'contract') {
        scope = scope.getParent();
      }
      return scope;
    };

    Blockly.Extensions.apply('declare_typed_variable', this, false);
  },
};

Blockly.Blocks['contract_method_call'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('call method')
      .appendField(
        new Blockly.FieldDropdown([
          ["select method...", Blockly.Solidity.UNDEFINED_NAME],
        ]),
        "METHOD_NAME"
      );
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    // this.setOutput(true, null);
    this.setColour(320);

    this.getVariableNameSelectField = function() { return this.getField('METHOD_NAME'); };
    this.getVariableLabelGroup = function() { return Blockly.Solidity.LABEL_GROUP_METHOD };

    this.setOnChange(function(event) {
      if (event.blockId != this.id) {
        return;
      }

      if (event.element == 'field' && event.name == 'METHOD_NAME') {
        var methodId = this.getFieldValue('METHOD_NAME');
        var methodBlock = this.workspace.getBlockById(methodId);
        var params = [];

        var block = methodBlock;
        do {
          block = block.getChildren()
            .filter(function(c) { return c.type == 'contract_method_parameter' })[0];

          if (block) {
            params.push(block);
          }
        } while (block)

        console.log(params);
        // FIXME: add/remove inputs according to the method params
      }
    });
  }
};

Blockly.Blocks['contract_event_emit'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('emit event')
      .appendField(
        new Blockly.FieldDropdown([
          ["select event...", Blockly.Solidity.UNDEFINED_NAME],
        ]),
        "METHOD_NAME"
      );
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    // this.setOutput(true, null);
    this.setColour(320);

    this.getVariableNameSelectField = function() { return this.getField('METHOD_NAME'); };
    this.getVariableLabelGroup = function() { return Blockly.Solidity.LABEL_GROUP_METHOD };

    this.setOnChange(function(event) {
      if (event.blockId != this.id) {
        return;
      }

      if (event.element == 'field' && event.name == 'EVENT_NAME') {
        var methodId = this.getFieldValue('EVENT_NAME');
        var methodBlock = this.workspace.getBlockById(methodId);
        var params = [];

        var block = methodBlock;
        do {
          block = block.getChildren()
            .filter(function(c) { return c.type == 'contract_event_parameter' })[0];

          if (block) {
            params.push(block);
          }
        } while (block)

        console.log(params);
        // FIXME: add/remove inputs according to the method params
      }
    });
  }
};

Blockly.defineBlocksWithJsonArray([
  {
    "type": "contract_ctor",
    "message0": "constructor",
    "message1": "parameters %1",
    "args1": [
      {
        "type": "input_statement",
        "name": "PARAMS",
        "check": "contract_method_parameter",
        "align": "RIGHT"
      },
    ],
    "message2": "code %1",
    "args2": [
      {
        "type": "input_statement",
        "name": "STACK",
        "align": "RIGHT"
      }
    ],
    "previousStatement": ["contract_ctor"],
    "colour": 290,
    "tooltip": "",
    "helpUrl": ""
  }
]);

Blockly.defineBlocksWithJsonArray([
  {
    "type": "contract_intrinsic_sha3",
    "message0": "sha3 %1",
    "args0": [
      {
        "type": "input_value",
        "name": "VALUE",
      },
    ],
    "output": null,
    "colour": 60,
    "tooltip": "",
    "helpUrl": ""
  }
]);

Blockly.Blocks['controls_for'] = {
  init: function() {
    this.jsonInit(
      {
        "message0": "%{BKY_CONTROLS_FOR_TITLE}",
        "args0": [
          {
            "type": "field_input",
            "name": "VAR",
            "text": "i",
          },
          {
            "type": "input_value",
            "name": "FROM",
            "check": "Number",
            "align": "RIGHT"
          },
          {
            "type": "input_value",
            "name": "TO",
            "check": "Number",
            "align": "RIGHT"
          },
          {
            "type": "input_value",
            "name": "BY",
            "check": "Number",
            "align": "RIGHT"
          }
        ],
        "message1": "%{BKY_CONTROLS_REPEAT_INPUT_DO} %1",
        "args1": [{
          "type": "input_statement",
          "name": "DO"
        }],
        "inputsInline": true,
        "previousStatement": null,
        "nextStatement": null,
        "colour": "%{BKY_LOOPS_HUE}",
        "helpUrl": "%{BKY_CONTROLS_FOR_HELPURL}",
      }
    );

    this.getVariableNameField = function() { return this.getField('VAR'); };
    this.getVariableType = function() { return 'TYPE_UINT'; };
    this.getVariableGroup = function() { return Blockly.Solidity.LABEL_GROUP_VARIABLE };
    this.getVariableScope = function() { return this };

    Blockly.Extensions.apply('declare_typed_variable', this, false);
  },
};

Blockly.Blocks['require'] = {
  init: function() {
    this.jsonInit({
      "message0": "require %1",
      "args0": [
        {
          "type": "field_input",
          "name": "NAME",
          "text": "transfer"
        },
      ],
      "message1": "amount %1",
      "args1": [
        {
          "type": "input_value",
          "name": "BOOL_EXPRESS",
          // "check": ["contract_state_get"],
          "align": "RIGHT"
        },
      ],
      "message2": "address %1",
      "args2": [
        {
          "type": "field_input",
          "name": "MESSAGE",
          
          "align": "RIGHT"
        },
      ]
      ,
      "previousStatement": "null",
      "nextStatement": "null",
      "colour": 290,
      "tooltip": "",
      "helpUrl": ""
    });    
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.getVariableNameField = function() { return this.getField('NAME') };
    this.getVariableType = function() { return 'void' };
    this.getVariableGroup = function() { return Blockly.Solidity.LABEL_GROUP_METHOD };
    this.getVariableScope = function() {
      var scope = this.getParent();
      while (!!scope && scope.type != 'contract') {
        scope = scope.getParent();
      }
      return scope;
    };

    Blockly.Extensions.apply('declare_typed_variable', this, false);
  },
};

Blockly.Blocks['map'] = {
  init: function() {
    this.jsonInit({
      "message0": "map_id %1",
      "args0": [
        {
          "type": "field_input",
          "name": "NAME",
          "text": "transfer"
        },
      ],
      "message1": "mapping %1",
      "args1": [
        {
          "type": "input_value",
          "name": "mapping",
          // "check": ["contract_state_get"],
          "align": "RIGHT"
        },
      ],
      "message2": "address = address op value %1",
      "args2": [
        {
          "type": "field_input",
          "name": "OP",
          
          "align": "RIGHT"
        },
      ]
      ,
      "previousStatement": "null",
      "nextStatement": "null",
      "colour": 290,
      "tooltip": "",
      "helpUrl": ""
    });    
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.getVariableNameField = function() { return this.getField('NAME') };
    this.getVariableType = function() { return 'void' };
    this.getVariableGroup = function() { return Blockly.Solidity.LABEL_GROUP_METHOD };
    this.getVariableScope = function() {
      var scope = this.getParent();
      while (!!scope && scope.type != 'contract') {
        scope = scope.getParent();
      }
      return scope;
    };

    Blockly.Extensions.apply('declare_typed_variable', this, false);
  },
};
