//contract框架有关的块的函数，也就是代码生成时各个块会执行的函数

/**
 * @fileoverview Helper functions for generating Solidity for blocks.
 * @author jeanmarc.leroux@google.com (Jean-Marc Le Roux)
 */
'use strict';

goog.require('Blockly.Solidity');

//这是初始的合约块
Blockly.Solidity['contract'] = function(block) {

  //statementToCode@https://blocklycodelabs.dev/codelabs/custom-generator/index.html?index=..%2F..index#7
  var states = Blockly.Solidity.statementToCode(block, 'STATES');
  var ctor = Blockly.Solidity.statementToCode(block, 'CTOR');
  var methods = Blockly.Solidity.statementToCode(block, 'METHODS');
  var code = 'pragma solidity ^0.4.2;\n\n'
    + 'contract ' + block.getFieldValue('NAME') + ' {\n'
    + states
    + "  function () { throw; }\n"
    + ctor
    + methods
    + '}\n';

  //记录到AST
  ASTInfos._contractName = block.getFieldValue('NAME');
  ASTInfos._lines = code;
  
  return code;
};

//这是工具箱里第一个块
Blockly.Solidity['contract_state'] = function(block) {
  var name = block.getFieldValue('NAME');
  var value = Blockly.Solidity.valueToCode(block, 'VALUE', Blockly.Solidity.ORDER_ASSIGNMENT);
  var type = block.getFieldValue('TYPE');
  var types = {
    'TYPE_BOOL': 'bool',
    'TYPE_INT': 'int',
    'TYPE_UINT': 'uint',
    'TYPE_ADDR':'address',
    'TYPE_MAPPING':"mapping(address->uint)"
  };
  var defaultValue = {
    'TYPE_BOOL': 'false',
    'TYPE_INT': '0',
    'TYPE_UINT': '0',
    'TYPE_ADDR':'0',
    "TYPE_MAPPING":'0'
  };

  //如果用户没输入值就选默认值 ##这是一个安全tip
  if (value === '') {
    value = defaultValue[type];
  }

  //记录到AST
  ASTInfos._createdVariables.push(block.getFieldValue('NAME'));
  ASTInfos._variablesType.push(block.getFieldValue('TYPE'));
  ASTInfos._variablesUsedCount.push(0);
  
  return types[type] + ' ' + name + ' = ' + value + ';\n';
};

Blockly.Solidity['transfer'] = function(block){
  var name = block.getFieldValue('NAME');
  return this.getFieldValue('ADDR')+'.transfer( '+this.getFieldValue('AMOUNT') + " );";
}

Blockly.Solidity['set_state_to_msg'] = function(block) {
  var name = block.getFieldValue('NAME');
  var value = Blockly.Solidity.valueToCode(block, 'VALUE', Blockly.Solidity.ORDER_ASSIGNMENT);
  var type = block.getFieldValue('MSG_MEM');  
  var variableId = block.getFieldValue('STATE_NAME');
  var variable = block.workspace.getVariableById(variableId);
  var types = {
    'MSG_SENDER':'sender',
    'MSG_VALUE':'value'
  };
  var defaultValue = {
    'MSG_SENDER': '0',
    'MSG_VALUE':'0'

  };

  if (value === '') {
    value = types[type];
  }

  return Blockly.Solidity.getVariableName(variable) + ' = msg.' + value+ ';\n';
};

Blockly.Solidity['require'] = function(block) {
  var name = block.getFieldValue('NAME');
  var value = Blockly.Solidity.valueToCode(block, 'VALUE', Blockly.Solidity.ORDER_ASSIGNMENT);
  var type = block.getFieldValue('TYPE');
  var types = {
    'TYPE_BOOL': 'bool',
    'TYPE_INT': 'int',
    'TYPE_UINT': 'uint',
    'TYPE_ADDR':'address',
    'TYPE_MAPPING':"mapping(address->uint)"


  };
  var defaultValue = {
    'TYPE_BOOL': 'false',
    'TYPE_INT': '0',
    'TYPE_UINT': '0',
    'TYPE_ADDR':'0',
    "TYPE_MAPPING":'0'

  };

  if (value === '') {
    value = defaultValue[type];
  }

  return 'require' + ' (' + block.Solidity.statementToCode('BOOL_EXPRESS') + ' ,\n ' + this.getFieldValue('MESSAGE') + ');\n';
};

Blockly.Solidity['contract_state_get'] = function(block) {
  var variableId = block.getFieldValue('STATE_NAME');
  var variable = block.workspace.getVariableById(variableId);

  if (!variable) {
    return '';
  }

  return ['this.' + Blockly.Solidity.getVariableName(variable), Blockly.Solidity.ORDER_ATOMIC];
};

//set块
Blockly.Solidity['contract_state_set'] = function(block) {
  // Variable setter.
  var argument0 = Blockly.Solidity.valueToCode(block, 'STATE_VALUE',
      Blockly.Solidity.ORDER_ASSIGNMENT) || '0';
  var variableId = block.getFieldValue('STATE_NAME');
  var variable = block.workspace.getVariableById(variableId);

  if (!variable) {
    return '';
  }

  //记录到AST
  //遍历变量数组，修改对应变量的usedCount
  var thisVariable = Blockly.Solidity.getVariableName(variable);
  for(var i = 0; i < ASTInfos._createdVariables.length; i++){
    if(ASTInfos._createdVariables[i] == thisVariable){
      ASTInfos._variablesUsedCount[i] = ASTInfos._variablesUsedCount[i] + 1;
    }
  }
  
  return 'this.' + Blockly.Solidity.getVariableName(variable) + ' = ' + argument0 + ';\n';
};

Blockly.Solidity['transfer'] = function(block){
  // return '123';
  return Blockly.Solidity.statementToCode('TO')+'123';
}
Blockly.Solidity['map'] = function(block){
  // return '123';
  return '';
}
Blockly.Solidity['transfer'] = function(block){
  // return '123';
  return '';
}
Blockly.Solidity['require'] = function(block){
  // return '123';
  return '';
}
Blockly.Solidity['contract_event_emit'] = function(block){
  // return '123';
  return '';
}
Blockly.Solidity['contract_event'] = function(block){
  // return '123';
  return '';
}


