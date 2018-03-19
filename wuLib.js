const fs=require("fs");
const path=require("path");
class CntEvent{
	constructor(){
		this.cnt=0;
		this.emptyEvent=[];
		this.encount=this.encount.bind(this);
		this.decount=this.decount.bind(this);
		this.add=this.add.bind(this);
	}
	encount(delta=1){
		this.cnt+=delta;
	}
	decount(){
		if(this.cnt>0)--this.cnt;
		if(this.cnt==0){
			for(let info of this.emptyEvent)info[0](...info[1]);
			this.emptyEvent=[];
		}
	}
	add(cb,...attach){
		this.emptyEvent.push([cb,attach]);
	}
}
let ioEvent=new CntEvent;
function mkdirs(dir,cb){
	fs.stat(dir,(err,stats)=>{
		if(err)mkdirs(path.dirname(dir),()=>fs.mkdir(dir,cb));
		else if(stats.isFile())throw Error(dir+" was created as a file, so we cannot put file into it.");
		else cb();
	});
}
function save(name,content){
	ioEvent.encount();
	mkdirs(path.dirname(name),()=>fs.writeFile(name,content,err=>{
		if(err)throw Error("Save file error: "+err);
		ioEvent.decount();
	}));
}
function get(name,cb,opt={encoding:'utf8'}){
	ioEvent.encount();
	fs.readFile(name,opt,(err,data)=>{
		if(err)throw Error("Read file error: "+err);
		else cb(data);
		ioEvent.decount();
	});
}
function del(name){
	ioEvent.encount();
	fs.unlink(name,ioEvent.decount);
}
function changeExt(name,ext=""){
	return name.slice(0,name.lastIndexOf("."))+ext;
}
function scanDirByExt(dir,ext,cb){
	let result=[],scanEvent=new CntEvent;
	function helper(dir){
		scanEvent.encount();
		fs.readdir(dir,(err,files)=>{
			if(err)throw Error("Scan dir error: "+err);
			for(let file of files){
				scanEvent.encount();
				let name=path.resolve(dir,file);
				fs.stat(name,(err,stats)=>{
					if(err)throw Error("Scan dir error: "+err);
					if(stats.isDirectory())helper(name);
					else if(stats.isFile()&&name.endsWith(ext))result.push(name);
					scanEvent.decount();
				});
			}
			scanEvent.decount();
		});
	}
	scanEvent.add(cb,result);
	helper(dir,ext,scanEvent);
}
function toDir(to,from){//get relative path without posix/win32 problem
	if(from[0]==".")from=from.slice(1);
	if(to[0]==".")to=to.slice(1);
	from=from.replace(/\\/g,'/');to=to.replace(/\\/g,'/');
	let a=Math.min(to.length,from.length);
	for(let i=1,m=Math.min(to.length,from.length);i<=m;i++)if(!to.startsWith(from.slice(0,i))){a=i-1;break;}
	let pub=from.slice(0,a);
	let len=pub.lastIndexOf("/")+1;
	let k=from.slice(len);
	let ret="";
	for(let i=0;i<k.length;i++)if(k[i]=='/')ret+='../';
	return ret+to.slice(len);
}
function commandExecute(cb,helper){
	let orders=[];
	for(let order of process.argv)if(order.startsWith("-"))orders.push(order.slice(1));
	let iter=process.argv[Symbol.iterator](),nxt=iter.next(),called;
	function doNext(){
		nxt=iter.next();
		while(!nxt.done&&nxt.value.startsWith("-"))nxt=iter.next();
		if(nxt.done){
			if(!called)console.log("Command Line Helper:\n\n"+helper);
		}else called=true,cb(nxt.value,doNext,orders);
	}
	while(!nxt.done&&!nxt.value.endsWith(".js"))nxt=iter.next();
	doNext();
}
module.exports={mkdirs:mkdirs,get:get,save:save,toDir:toDir,del:del,commandExecute:commandExecute,
	addIO:ioEvent.add,changeExt:changeExt,CntEvent:CntEvent,scanDirByExt:scanDirByExt};
