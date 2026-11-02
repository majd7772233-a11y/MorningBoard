/* a Pen by Diaco m.lotfollahi  : https://diacodesign.com */

var 
p1=document.getElementById("path") , 
p2=document.getElementById("path2") ,
np=20 , M='M' , ptdata=[] ;
document.addEventListener('mousemove',function(){move(event)} );
document.addEventListener('touchmove',function(){ event.preventDefault(); move(event.targetTouches[0])});
function move(e){ 
	ptdata.push([e.pageX,e.pageY]);
	if(ptdata.length>np){removeD()};
	pUpdate();
};
var ticker = new com.greensock.Ticker(45);
ticker.addEventListener("tick", removeD);
function removeD(){ if(ptdata.length>1){ ptdata.shift(); pUpdate(); } };
function pUpdate(){
	p2.setAttribute("stroke-width",ptdata.length/np*4.5);
	var pathD = M+ptdata.join(" ");
	p1.setAttribute("d", pathD);	p2.setAttribute("d", pathD);
}
function setLLenght(X){ np=X.value };
/* a Pen by Diaco m.lotfollahi  : https://diacodesign.com */
