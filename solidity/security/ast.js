//存储语法树信息的全局变量

var QQQ = "5";

class struct_AST{

    constructor() {
        this._contractName = "null"; //合约的大名字
        this._lines = []; //每一行语句
        this._createdVariables = []; //创建的变量
        this._variablesType = []; //创建的变量的类型
        this._variablesUsedCount = []; //每个变量使用的次数
        //先把未使用的变量给找出来



      }
}

aNewAST = function() {
  return new struct_AST();
}

//用于输出security检查的信息
function outputCheckInfoFunction() {
  document.getElementById('checkInfoArea').value = ASTInfos._createdVariables + "\n" + ASTInfos._variablesUsedCount + "\n" + ASTInfos._lines;
}

//检查未使用的变量
function checkUnusedVariablesFunction(ASTInfos){
  alert_str = "Alert:\n";
  for(var i = 0; i < ASTInfos._variablesUsedCount.length; i++){
    if(ASTInfos._variablesUsedCount[i] == 0){
      alert_str = alert_str + " Variable " + ASTInfos._createdVariables[i] + " never been used\n"
    }
  }
  if(alert_str == "Alert:\n"){
    alert_str = "No unused variables"
  }
  alert(alert_str);
}

//检查编译器版本问题
function checkComplierVersionFunction(ASTInfos){
  var versionReg = new RegExp(' (.?[0-9]\.[0-9]\.[0-9]);\n\n');
  var version = ASTInfos._lines.match(versionReg);
  alert_str = "required version = " + version[1] + "\n";
  if(version[1].test("\^") == true){
    alert_str = alert_str + "recommand to use stable version\n"
  }
  if(version[1].test("0.4.[0-9]") == false){
    alert_str = alert_str + "recommand to use version higher than 0.4.0\n"
  }
  alert(alert_str);
}