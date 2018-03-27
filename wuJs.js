const wu=require("./wuLib.js");
const path=require("path");
const UglifyJS=require("uglify-es");
const {VM}=require('vm2');
function jsBeautify(code){
	return UglifyJS.minify(code,{mangle:false,compress:false,output:{beautify:true,comments:true}}).code;
}
function splitJs(name,cb){
	let dir=path.dirname(name);
	wu.get(name,code=>{
		let vm=new VM({sandbox:{
			require(){},
			define(name,func){
				code=func.toString();
				wu.save(path.resolve(dir,name),jsBeautify(code.slice(code.indexOf('"use strict";')+'"use strict";'.length,code.lastIndexOf("\n"))));
			}
		}});
		vm.run(code.slice(code.indexOf("define(")));
		cb({[name]:8});
	});
}
module.exports={jsBeautify:jsBeautify,splitJs:splitJs};
if(require.main===module){
    wu.commandExecute(splitJs,"Split and beautify weapp js file.\n\n<files...>\n\n<files...> js files to split and beautify.");
}
