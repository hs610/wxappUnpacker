const wu=require("./wuLib.js");
const wuJs=require("./wuJs.js");
const wuCfg=require("./wuConfig.js");
const wuMl=require("./wuWxml.js");
const wuSs=require("./wuWxss.js");
const path=require("path");
const fs=require("fs");
const assert=require("assert");
function header(buf){
	console.log("\nHeader info:");
	let firstMark=buf.readUInt8(0);
	console.log("  firstMark: 0x%s",firstMark.toString(16));
	let unknownInfo=buf.readUInt32BE(1);
	console.log("  unknownInfo: ",unknownInfo);
	let infoListLength=buf.readUInt32BE(5);
	console.log("  infoListLength: ",infoListLength);
	let dataLength=buf.readUInt32BE(9);
	console.log("  dataLength: ",dataLength);
	let lastMark=buf.readUInt8(13);
	console.log("  lastMark: 0x%s",lastMark.toString(16));
	assert(firstMark==0xbe&&lastMark==0xed,"Magic number is not correct!");
	return [infoListLength,dataLength];
}
function genList(buf){
	console.log("\nFile list info:");
	let fileCount=buf.readUInt32BE(0);
	console.log("  fileCount: ",fileCount);
	let fileInfo=[],off=4;
	for(let i=0;i<fileCount;i++){
		let info={};
		let nameLen=buf.readUInt32BE(off);
		off+=4;
		info.name=buf.toString('utf8',off,off+nameLen);
		off+=nameLen;
		info.off=buf.readUInt32BE(off);
		off+=4;
		info.size=buf.readUInt32BE(off);
		off+=4;
		fileInfo.push(info);
		console.log(info);
	}
	return fileInfo;
}
function saveFile(dir,buf,list){
	console.log("Saving files...");
	for(let info of list)
		wu.save(path.resolve(dir,(info.name.startsWith("/")?".":"")+info.name),buf.slice(info.off,info.off+info.size));
}
const newGameProj=`{
	"description": "unpackWeGame",
	"setting": {
		"urlCheck": false,
		"es6": false,
		"postcss": true,
		"minified": false,
		"newFeature": true
	},
	"compileType": "game",
	"libVersion": "game",
	"appid": "touristappid",
	"projectname": "unpackWeGame",
	"isGameTourist": true,
	"condition": {
		"search": {
			"current": -1,
			"list": []
		},
		"conversation": {
			"current": -1,
			"list": []
		},
		"game": {
			"currentL": -1,
			"list": []
		},
		"miniprogram": {
			"current": -1,
			"list": []
		}
	}
}`;
function packDone(dir,cb,order){
	console.log("Unpack done.");
	//This will be the only func running this time, so async is needless.
	if(fs.existsSync(path.resolve(dir,"app-service.js"))){//weapp
		console.log("Split app-service.js and make up configs & wxss & wxml & wxs...");
		let weappEvent=new wu.CntEvent,needDelete={};
		weappEvent.encount(4);
		weappEvent.add(()=>{
			wu.addIO(()=>{
				console.log("Split and make up done.");
				if(!order.includes("d")){
					console.log("Delete files...");
					wu.addIO(()=>console.log("Deleted.\n\nTotally done."));
					for(let name in needDelete)if(needDelete[name]>=8)wu.del(name);
				}
				cb();
			});
		});
		function doBack(deletable){
			for(let key in deletable){
				if(!needDelete[key])needDelete[key]=0;
				needDelete[key]+=deletable[key];//all file have score bigger than 8 will be delete.
			}
			weappEvent.decount();
		}
		wuCfg.doConfig(path.resolve(dir,"app-config.json"),doBack);
		wuJs.splitJs(path.resolve(dir,"app-service.js"),doBack);
		if(fs.existsSync(path.resolve(dir,"page-frame.html")))
			wuMl.doFrame(path.resolve(dir,"page-frame.html"),doBack);
		else if(fs.existsSync(path.resolve(dir,"app-wxss.js"))) {
			wuMl.doFrame(path.resolve(dir,"app-wxss.js"),doBack);
			needDelete[path.resolve(dir,"page-frame.js")]=8;
		} else throw Error("page-frame-like file is not found in the package by auto.");
		wuSs.doWxss(dir,doBack);//Force it run at last, becuase lots of error occured in this part
	}else if(fs.existsSync(path.resolve(dir,"./game.js"))){//wegame
		console.log("Patch game.json and project.config.json file for running and split game.js...");
		wu.save(path.resolve(dir,"./game.json"),JSON.stringify({"deviceOrientation":"portrait"}));
		wu.save(path.resolve(dir,"./project.config.json"),newGameProj);
		wuJs.splitJs(path.resolve(dir,"./game.js"),()=>{
			wu.addIO(()=>{
				console.log("Patch and split done.");
				cb();
			});
		});
	}else throw Error("This Package is unrecognizable, please decrypted every type of file by hand.")
}
function doFile(name,cb,order){
	console.log("Unpack file "+name+"...");
	let dir=path.resolve(name,"..",path.basename(name,".wxapkg"));
	wu.get(name,buf=>{
		let [infoListLength,dataLength]=header(buf.slice(0,14));
		wu.addIO(packDone,dir,cb,order);
		saveFile(dir,buf,genList(buf.slice(14,infoListLength+14)));
	},{});
}
module.exports={doFile:doFile};
if(require.main===module){
    wu.commandExecute(doFile,"Unpack a wxapkg file.\n\n[-d] <files...>\n\n-d Do not delete transformed unpacked files.\n<files...> wxapkg files to unpack");
}
