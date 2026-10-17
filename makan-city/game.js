
(()=>{'use strict';
const $=id=>document.getElementById(id),canvas=$('game'),ctx=canvas.getContext('2d');
const environment=window.MakanEnvironment.create(ctx);let cameraDistance=0,ambientTime=0,projectResume=false;
// The interior is a real bundled panorama, with a geometric loading fallback.
const tunnelImage=window.Image?new window.Image():null;let tunnelTexture=null;
if(tunnelImage){tunnelImage.decoding='async';tunnelImage.src=window.MAKAN_ART?.tunnel||new URL('assets/tunnel-gallery.png',document.currentScript?.src||document.baseURI).href;}
function drawTunnelArt(left,right,roof){
 if(!tunnelImage?.complete||!tunnelImage.naturalWidth){canvas.dataset.tunnelArt='loading';return false}
 if(!tunnelTexture){const im=tunnelImage,overlap=Math.round(im.naturalWidth*.06),cv=document.createElement('canvas');cv.width=im.naturalWidth-overlap;cv.height=im.naturalHeight;const c=cv.getContext('2d');c.drawImage(im,-overlap,0);const edge=document.createElement('canvas');edge.width=overlap;edge.height=cv.height;const e=edge.getContext('2d');e.drawImage(im,0,0);e.globalCompositeOperation='destination-in';const g=e.createLinearGradient(0,0,overlap,0);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,1)');e.fillStyle=g;e.fillRect(0,0,overlap,cv.height);c.drawImage(edge,cv.width-overlap,0);tunnelTexture=cv;}
 const height=(floor+270-roof)/.93,w=tunnelTexture.width/tunnelTexture.height*height,offset=travel-PX,first=Math.floor((offset+left)/w)-1;
 ctx.save();ctx.filter='brightness(.38) saturate(.7)';for(let i=first;i<Math.ceil((offset+right)/w)+1;i++)ctx.drawImage(tunnelTexture,i*w-offset,roof,w,height);ctx.restore();
 const base=floor+270;ctx.save();ctx.globalAlpha=.85;
 for(let world=Math.floor((travel-PX+left)/310)*310;world<travel-PX+right+310;world+=310){const x=streetX(world);line(x+16,roof+24,x+220,roof+24,'#8fe8ed',3);line(x+25,base-17,x+180,base-17,'#54c8cf',1.5);
  ctx.fillStyle='rgba(12,48,64,.82)';ctx.fillRect(x+30,roof+100,88,43);ctx.strokeStyle='#69becb';ctx.lineWidth=.7;ctx.strokeRect(x+30,roof+100,88,43);ctx.fillStyle='#b5e7e9';ctx.font='7px monospace';ctx.textAlign='left';ctx.fillText('MAKAN / MOBILITY',x+37,roof+111);for(let j=0;j<4;j++)line(x+38,roof+119+j*5,x+65+(j%2)*32,roof+119+j*5,'#5ca4b4',1);
 }ctx.restore();
 canvas.dataset.tunnelArt='ready';return true;
}
const streetImage=window.Image?new window.Image():null;let streetTexture=null;
if(streetImage){streetImage.decoding='async';streetImage.src=window.MAKAN_ART?.street||new URL('assets/street-bridge-integrated.png',document.currentScript?.src||document.baseURI).href;}
// All architecture bordering the playable promenade shares this exact transform.
function streetX(worldX){return PX+worldX-travel}
function streetArchitecture(){
 if(!streetImage?.complete||!streetImage.naturalWidth)return;
 if(!streetTexture){const cv=document.createElement('canvas');cv.width=streetImage.naturalWidth;cv.height=streetImage.naturalHeight;cv.getContext('2d').drawImage(streetImage,0,0);streetTexture=cv;}
 const h=H*.8,w=streetImage.naturalWidth/streetImage.naturalHeight*h,y=floor-h*.89;
 const cycle=Math.floor(travel/22000);
 for(let c=cycle-1;c<=cycle+1;c++)for(const [anchor,side] of [[2600,'both']]){const joint=streetX(c*22000+anchor);
  if(side!=='right'&&joint>0&&joint-w<W)ctx.drawImage(streetTexture,joint-w,y,w,h);
  if(side!=='left'&&joint+w>0&&joint<W){ctx.save();ctx.translate(joint+w,0);ctx.scale(-1,1);ctx.drawImage(streetTexture,0,y,w,h);ctx.restore()}
 }
 canvas.dataset.streetArt='ready';
}
let W=1200;const H=675,floor=610,PX=140,bodyHeight=61;
const districts=[{name:'CIVIC COMMONS',accent:'#548d8a',glass:'#e2eeee',side:'#cbdedc',type:0},{name:'CLIMATE GARDENS',accent:'#608f72',glass:'#dcebe3',side:'#bfd6c8',type:1},{name:'CONNECTED NEIGHBOURHOOD',accent:'#3f8da9',glass:'#d9eaf2',side:'#b8d3e1',type:2},{name:'ADAPTIVE SKYLINE',accent:'#7d84af',glass:'#e5e7f5',side:'#c9cce5',type:3}];
let state='ready',last=0,time=0,travel=0,score=0,bonus=0,best=0,spawn=2.6,nextNode=2.2,objects=[],models=[],player={y:floor-bodyHeight,vy:0,jumps:0,dropping:false,dropPose:0,landing:0},jumpBuffer=0,zoneSeen=0,chunk=0,bus=null,nextBus=9,coverGrace=0,themeActive=false;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),seed=n=>{const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x)};
try{best=Math.max(0,Number(localStorage.getItem('azab-city-best-v2'))||0)}catch{}$('best').textContent=String(best).padStart(4,'0');
function resize(){W=window.innerWidth<650?760:1200;const ratio=Math.min(window.devicePixelRatio||1,2);canvas.width=W*ratio;canvas.height=H*ratio;ctx.setTransform(ratio,0,0,ratio,0,0)}resize();window.addEventListener('resize',resize);
function cameraView(){
 const surface=1,depth=routeDepth();
 return{zoom:surface*(1-depth)+2.35*depth,x:PX+14,y:floor+terrainOffset(PX)*.05,vertical:terrainOffset(PX)*.95};
}
function scenePoint(x,y){const v=cameraView();return{x:v.x+(x-v.x)/v.zoom,y:v.y+(y-v.y)/v.zoom+v.vertical}}
function currentZone(){return Math.floor(travel/6500)%districts.length}
function tunnelRoute(at=travel){const p=((at%22000)+22000)%22000;return{p,entry:PX+5200-p,exit:PX+10800-p,ahead:5200-p,inside:p>=5200&&p<10800}}
function routeDepth(at=travel){const {p}=tunnelRoute(at),ease=t=>t*t*(3-2*t);return p<5200?0:p<5650?ease((p-5200)/450):p<10800?1:p<11250?1-ease((p-10800)/450):0}

function setTheme(dark){if(dark===themeActive)return;themeActive=dark;document.documentElement.classList.toggle('underground',dark);document.querySelector('meta[name="theme-color"]').setAttribute('content',dark?'#101c2b':'#ffffff')}
function hud(){$('speed').textContent=(runningSpeed()/250).toFixed(2)+'×';score=Math.floor(travel/10)+bonus;$('score').textContent=String(score).padStart(4,'0');$('distance').textContent=String(Math.floor(travel/10)).padStart(4,'0')+' m';$('jumps').textContent=(2-player.jumps)+' / 2';const z=currentZone();$('phase').textContent=routeDepth()>.10?'UNDERGROUND / TRANSIT PASSAGE':String(z+1).padStart(2,'0')+' / '+districts[z].name;setTheme(routeDepth()>.10)}

function panel(title,message,label){$('title').textContent=title;$('message').textContent=message;$('start').textContent=label;$('overlay').hidden=false}
function reset(){cameraDistance=0;time=0;travel=0;score=0;bonus=0;spawn=2.6;nextNode=2.2;objects=[];models=[];jumpBuffer=0;zoneSeen=0;chunk=0;bus=null;nextBus=9;coverGrace=0;setTheme(false);player={y:floor-bodyHeight,vy:0,jumps:0,dropping:false,dropPose:0,landing:0};state='running';hud();$('overlay').hidden=true;$('pause').disabled=false;$('pause').textContent='Pause';$('announcement').textContent='Jump twice to reach higher. Down / Drop descends quickly.';last=performance.now();canvas.focus()}
function jump(){if(state!=='running')return;if(player.jumps<2){player.vy=player.jumps===0?-660:-610;player.jumps++;player.dropping=false;player.landing=0;jumpBuffer=0;$('jumps').textContent=(2-player.jumps)+' / 2'}else jumpBuffer=.10}
function drop(){if(state==='running'&&player.y<floor-bodyHeight-.1){player.vy=Math.max(980,player.vy);player.dropping=true;jumpBuffer=0}}

function pause(){if(state==='running'){state='paused';panel('Exploration paused.','Resume from your current position.','Resume');$('pause').textContent='Resume'}else if(state==='paused'){state='running';$('overlay').hidden=true;$('pause').textContent='Pause';last=performance.now();canvas.focus()}}
function end(){hud();state='over';best=Math.max(best,score);try{localStorage.setItem('azab-city-best-v2',best)}catch{}$('best').textContent=String(best).padStart(4,'0');$('pause').disabled=true;panel('Exploration complete.',Math.floor(travel/10)+' m travelled · '+score+' points · '+districts[currentZone()].name,'Explore again');$('announcement').textContent='Run complete. Final score: '+score+'.'}
$('start').onclick=()=>state==='paused'?pause():reset();$('jump').onclick=()=>{jump();canvas.focus()};$('pause').onclick=pause;$('drop').onclick=()=>{drop();canvas.focus()};
canvas.addEventListener('pointerdown',e=>{e.preventDefault();const box=canvas.getBoundingClientRect(),x=(e.clientX-box.left)*W/box.width,y=(e.clientY-box.top)*H/box.height;const route=tunnelRoute(),outside=scenePoint(x,y).x<route.entry||scenePoint(x,y).x>route.exit;const point=scenePoint(x,y),hit=outside?environment.hitTest(point.x,point.y):null;if(hit){openProject(hit.id);return}canvas.focus();jump()});
canvas.addEventListener('pointermove',e=>{const box=canvas.getBoundingClientRect(),x=(e.clientX-box.left)*W/box.width,y=(e.clientY-box.top)*H/box.height;const point=scenePoint(x,y);canvas.style.cursor=environment.hitTest(point.x,point.y)?'pointer':'default'});
document.addEventListener('keydown',e=>{if(e.target.tagName==='A'||(e.target.tagName==='BUTTON'&&!['jump','drop'].includes(e.target.id)))return;if(e.code==='Space'||e.code==='ArrowUp'){e.preventDefault();if(!e.repeat)jump()}if(e.code==='ArrowDown'||e.code==='KeyS'){e.preventDefault();drop()}if(e.code==='KeyP'&&!e.repeat)pause();if(e.code==='KeyE'&&!e.repeat){e.preventDefault();openProject(environment.nearest())}});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&state==='running')pause()});
function line(x,y,a,b,color,width=1){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(a,b);ctx.stroke()}
function poly(points,fill,stroke){ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke()}}
function ellipse(x,y,rx,ry,color){ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill()}
function obstacle(o,d){const x=o.x,y=floor,w=o.w,h=o.h;ctx.save();
 // A dark base and pale outer edge separate hazards from every street material.
 ellipse(x+w/2,y+2,w*.65,4,'rgba(20,31,40,.28)');
 if(o.type==='cone'||o.type==='planter'){
  poly([[x+3,y-5],[x+w*.40,y-h],[x+w*.60,y-h],[x+w-3,y-5]],'#e36b28','#fff4d9');
  poly([[x+w*.31,y-h*.66],[x+w*.69,y-h*.66],[x+w*.76,y-h*.45],[x+w*.24,y-h*.45]],'#fff8df');
  poly([[x-2,y-5],[x+w+2,y-5],[x+w+3,y],[x-3,y]],'#283e4a','#f6eed9');
 }else if(o.type==='warning'||o.type==='rack'){
  line(x+w*.35,y-h*.35,x+w*.25,y,'#283e4a',3);line(x+w*.65,y-h*.35,x+w*.75,y,'#283e4a',3);
  poly([[x+w*.5,y-h],[x+w,y-h*.2],[x,y-h*.2]],'#f7f1d8','#fffbea');
  poly([[x+w*.5,y-h+4],[x+w-5,y-h*.2-3],[x+5,y-h*.2-3]],'#f7b34a','#b64726');
  line(x+w*.5,y-h*.72,x+w*.5,y-h*.46,'#263d48',3);ellipse(x+w*.5,y-h*.34,1.8,1.8,'#263d48');
 }else{
  line(x+8,y-h+4,x+8,y,'#283e4a',4);line(x+w-8,y-h+4,x+w-8,y,'#283e4a',4);
  poly([[x,y-h],[x+w,y-h],[x+w,y-10],[x,y-10]],'#e36b28','#fff4d9');
  ctx.save();ctx.beginPath();ctx.rect(x+2,y-h+2,w-4,h-14);ctx.clip();for(let j=-1;j<5;j++)poly([[x+j*19,y-10],[x+j*19+8,y-10],[x+j*19+25,y-h],[x+j*19+17,y-h]],'#fff6df');ctx.restore();
 }ctx.restore();}
// Eight authored side-view poses: contact, weight, passing, push-off and recovery.
const runKeys=[
 {k:[8,44],f:[19,60]}, {k:[0,45],f:[-1,60]},
 {k:[-10,44],f:[-21,60]}, {k:[-12,41],f:[-20,54]},
 {k:[-14,38],f:[-24,43]}, {k:[-2,37],f:[-15,40]},
 {k:[9,38],f:[0,44]}, {k:[13,41],f:[13,53]}
];
function runnerPose(){
 const grounded=player.y>=floor-bodyHeight-.1,phase=(travel/160)%1,landing=Math.max(0,player.landing||0),compression=landing>0?Math.sin(Math.PI*clamp(landing/.26,0,1))*6:0;
 const x=PX+14,y=player.y,dive=grounded?0:clamp(player.dropPose||0,0,1),bob=grounded&&landing===0?-Math.sin(phase*Math.PI*4)*.8:compression;
 const hip={x:x-3+dive*2,y:y+29+bob};
 function leg(p,index){let k,f;
  if(grounded&&landing>0){k=index?[-10,45+compression*.4]:[9,45+compression*.4];f=index?[-11,60]:[11,60]}
  else if(grounded){const pos=p*8,i=Math.floor(pos)%8,t=pos-Math.floor(pos),a=runKeys[i],b=runKeys[(i+1)%8];k=a.k.map((v,j)=>v+(b.k[j]-v)*t);f=a.f.map((v,j)=>v+(b.f[j]-v)*t)}
  else{const rise=clamp(-player.vy/660,0,1),fall=clamp(player.vy/700,0,1);k=index?[-9,36]:[12,37];f=index?[-19,45-rise*3]:[18,53-rise*6];
   // Falling becomes a landing-ready pose, distinct from the upward jump.
   const targetK=index?[-7,40]:[7,40],targetF=index?[-8,57]:[8,57],blend=Math.max(dive,fall*.45);k=k.map((v,j)=>v+(targetK[j]-v)*blend);f=f.map((v,j)=>v+(targetF[j]-v)*blend);
  }
  return{hip,knee:{x:x+k[0],y:y+k[1]+(grounded?(terrainOffset(x+k[0])-terrainOffset(PX))*.5:0)},foot:{x:x+f[0],y:y+f[1]+(grounded?terrainOffset(x+f[0])-terrainOffset(PX):0)}};
 }
 return{grounded,phase,bob,dive,compression,hip,back:leg((phase+.5)%1,1),front:leg(phase,0)};
}
function runner(){const p=runnerPose(),x=PX+14,y=player.y,b=p.bob;
 const height=floor-(player.y+bodyHeight);ellipse(x,floor+3,17-clamp(height/18,0,7),2.3,routeDepth()>.1?'rgba(0,0,0,.35)':'#dce5e9');ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
 function leg(l,color){line(l.hip.x,l.hip.y,l.knee.x,l.knee.y,color,5.1);line(l.knee.x,l.knee.y,l.foot.x,l.foot.y-1,color,3.9);line(l.foot.x-1,l.foot.y,l.foot.x+4,l.foot.y,color,2.6)}
 const swing=p.grounded?Math.cos(p.phase*Math.PI*2):.55,sy=y+18+b,lean=p.dive*4;
 function arm(sign,color){const ex=x+1-sign*swing*8,ey=sy+9,brake=Math.max(p.dive,p.compression/10);const bx=ex+(x+sign*8-ex)*brake,by=ey-brake*2;line(x+1+lean,sy,bx,by,color,3.5);line(bx,by,bx+8*(1-brake)-sign*brake*2,by-7+brake*16,color,3)}
 arm(-1,'#758b97');leg(p.back,'#758b97');
 // Filled torso prevents the figure from reading as a hinged stick skeleton.
 poly([[x-3+lean,y+15+b],[x+5+lean,y+17+b],[x+2+p.dive*2,y+29+b],[x-7+p.dive*2,y+30+b]],'#284758');
 leg(p.front,'#263e4e');arm(1,'#284758');line(x+2+lean,y+13+b,x+2+lean,y+16+b,'#284758',3);ellipse(x+4+lean,y+7+b,5.8,6.8,'#263e4e');ctx.restore();
}

// The approach and exit are open ramps. Physics stays in local walkway coordinates.
function terrainOffset(x=PX){const p=tunnelRoute().p+x-PX,ease=t=>{t=clamp(t,0,1);return t*t*(3-2*t)};return 270*ease((p-4350)/850)*(1-ease((p-10800)/850))}
function drawRoutePaving(scene){
 const depth=routeDepth(),mix=(a,b)=>`rgb(${a.map((v,i)=>Math.round(v+(b[i]-v)*depth)).join(",")})`,pave=mix([244,241,232],[31,53,67]),foundation=mix([130,157,170],[17,33,48]),curb=mix([180,200,208],[64,111,123]),joints=mix([213,220,214],[45,78,90]);
 const points=[];for(let x=-20;x<W+30;x+=10)points.push([x,floor+terrainOffset(x)]);
 poly([...points.map(([x,y])=>[x,y-6]),...points.slice().reverse().map(([x,y])=>[x,y+13])],pave);
 poly([...points.map(([x,y])=>[x,y+13]),[W+30,H+400],[-20,H+400]],foundation);
 for(let i=1;i<points.length;i++)line(points[i-1][0],points[i-1][1]+13,points[i][0],points[i][1]+13,curb,2);
 for(let world=Math.floor((travel-PX)/100)*100;world<travel-PX+W+100;world+=100){const x=streetX(world),y=floor+terrainOffset(x);line(x,y-6,x-18,y+12,joints,.8)}
}
function tunnelScene(depth){
 const route=tunnelRoute(),start=route.entry-850,end=route.exit+850,roof=floor-20;
 const pathY=x=>floor+terrainOffset(x),xs=[];for(let x=Math.max(-20,start);x<=Math.min(W+20,end)+20;x+=16)xs.push(x);
 if(start<W&&end>0&&xs.length){
  // Open retaining cut: every vertex is anchored to the same world-space ramp.
  for(const [l,r]of [[start,route.entry],[route.exit,end]]){const points=[];for(let x=l;x<r;x+=18)points.push(x);points.push(r);poly([[l,floor-20],[r,floor-20],...points.slice().reverse().map(x=>[x,pathY(x)-9])],'#dce5e3');poly([...points.map(x=>[x,pathY(x)-9]),[r,H+400],[l,H+400]],'#d5dfe2');for(let i=1;i<points.length;i++){const x=points[i-1],xx=points[i],y=pathY(x),yy=pathY(xx);poly([[x,y-57],[xx,yy-57],[xx,yy-9],[x,y-9]],'#e1e6e0');line(x,y-61,xx,yy-61,'#6b8791',2)}for(let x=l;x<=r;x+=85)line(x,pathY(x)-61,x,pathY(x)-13,'#80959e',1.5);}
  const left=clamp(route.entry,0,W),right=clamp(route.exit,0,W);
  if(right>left){ctx.save();ctx.beginPath();ctx.rect(left,roof,right-left,H+400-roof);ctx.clip();
   if(!drawTunnelArt(left,right,roof)){const shade=ctx.createLinearGradient(left,0,Math.min(left+220,right),0);shade.addColorStop(0,'#e4eaeb');shade.addColorStop(1,'#d5e0e5');ctx.fillStyle=shade;ctx.fillRect(left,roof,right-left,H+80);
   poly([[left,roof],[right,roof],[right,roof+28],[left,roof+28]],'#bdced6');line(left,roof+28,right,roof+28,'#94aab7',1);line(left,floor-22,right,floor-22,'#bacad2',3);
   for(let x=route.entry+100+Math.floor(Math.max(0,-route.entry)/220)*220;x<right;x+=220){
    poly([[x-22,roof+28],[x-8,roof+28],[x+9,roof+52],[x+9,floor-21],[x-3,floor-21],[x-3,roof+55]],'#c3d1d7');line(x+20,roof+16,x+122,roof+16,'#fff4ce',4);
    ctx.fillStyle='#e7edec';ctx.fillRect(x+27,roof+76,116,85);line(x+27,roof+76,x+143,roof+76,'#b6c8cb',1);
    poly([[x+40,roof+146],[x+56,roof+117],[x+77,roof+131],[x+93,roof+102],[x+126,roof+146]],'#b3c6c6');line(x+37,roof+152,x+132,roof+152,'#8eaab3');ctx.fillStyle='#7595a2';ctx.font='8px Arial';ctx.fillText('MAKAN / SPATIAL STUDIES',x+28,roof+181);
   }
   }
   const mouth=ctx.createLinearGradient(route.entry,0,route.entry+180,0);mouth.addColorStop(0,'rgba(55,79,92,'+(.62*(1-depth))+')');mouth.addColorStop(1,'rgba(55,79,92,0)');ctx.fillStyle=mouth;ctx.fillRect(left,roof,right-left,floor+270-roof);
   ctx.fillStyle='#f5f1e7';ctx.fillRect(left,floor+265,right-left,19);line(left,floor+270,right,floor+270,'#8ba2ae',1);ctx.restore();
   // This slab belongs to the street above the underground gallery.
   poly([[left,roof-20],[right,roof-20],[right,roof],[left,roof]],'#ece9df');line(left,roof,right,roof,'#91a5ac',3);
  }
  for(const [x,enter]of [[route.entry,true],[route.exit,false]])if(x>-100&&x<W+100){
   poly([[x-12,roof-17],[x+14,roof-17],[x+14,roof+11],[x-12,roof+11]],'#c0cdd0');
   line(x+14,roof+13,x+14,roof+45,'#f4e4b7',3);ctx.fillStyle='#577787';ctx.font='10px Arial';ctx.textAlign='left';ctx.fillText(enter?'TRANSIT GALLERY  →':'CITY PROMENADE  →',x+25,roof-34);
  }
 }
 if(route.ahead>0&&route.ahead<1300){const x=route.entry-680,y=pathY(x)-135;if(x>-120&&x<W){line(x,y+18,x,y+76,'#8da1a8',2);ctx.fillStyle='#f2f1e9';ctx.fillRect(x-16,y-16,151,34);ctx.fillStyle='#52717e';ctx.font='10px Arial';ctx.textAlign='left';ctx.fillText('TRANSIT GALLERY  ↘',x-7,y+4)}}
}

function busCoversPlayer(){return !!bus&&bus.x<PX+40&&bus.x+bus.w>PX-28}
function busDrawing(){if(!bus)return;const x=bus.x,y=floor-74,w=bus.w;ctx.save();ctx.lineJoin='round';ctx.fillStyle='#f1f5f6';ctx.strokeStyle='#8ea7b4';ctx.lineWidth=1.2;ctx.beginPath();ctx.roundRect(x,y,w,81,10);ctx.fill();ctx.stroke();ctx.fillStyle='#658596';ctx.fillRect(x+14,y+11,w-29,30);for(let k=0;k<9;k++)line(x+19+k*31,y+12,x+19+k*31,y+40,'#d3e1e8',2);ctx.fillStyle='#68a7b4';ctx.fillRect(x+2,y+49,w-4,9);ctx.fillStyle='#3f5969';ctx.font='bold 10px Arial';ctx.textAlign='left';ctx.fillText('AMMAN / RAPID TRANSIT',x+16,y+70);line(x+w-54,y+44,x+w-54,y+78,'#a8bdc8',1);ellipse(x+58,y+79,14,14,'#46616f');ellipse(x+58,y+79,6,6,'#c9d8df');ellipse(x+w-58,y+79,14,14,'#46616f');ellipse(x+w-58,y+79,6,6,'#c9d8df');ctx.restore();}
function spawnChunk(){
 chunk++;if(chunk%4===0){for(let j=0;j<3;j++)models.push({x:W+50+j*38,y:floor-40,id:chunk+j,collected:false});return}
 const types=['cone','barrier','warning'],type=types[Math.floor(Math.random()*types.length)],w=type==='barrier'?56:type==='cone'?36:40,h=type==='cone'?46:type==='warning'?48:38,x=W+60;
 objects.push({x,w,h,type,chunk});
 // A collectible shares the obstacle's jump arc; there are no independent trap pairs.
 models.push({x:x+w/2,y:floor-132,id:chunk,collected:false,chunk});
}

function draw(){
 ctx.clearRect(0,0,W,H);const depth=routeDepth(),d=districts[currentZone()],scene={width:W,height:H,ground:floor,camera:cameraDistance,time:ambientTime,interactive:!tunnelRoute().inside};
 const view=cameraView();canvas.dataset.cameraZoom=view.zoom.toFixed(3);ctx.save();ctx.translate(view.x,view.y);ctx.scale(view.zoom,view.zoom);ctx.translate(-view.x,-view.y-view.vertical);environment.background({...scene,camera:travel});environment.frontages?.({...scene,camera:travel});
 streetArchitecture();environment.publicRealm?.({...scene,camera:travel});
 const route=tunnelRoute();
 tunnelScene(depth);drawRoutePaving(scene);ctx.save();ctx.translate(0,terrainOffset(PX));
 objects.forEach(o=>{ctx.save();ctx.translate(0,terrainOffset(o.x+o.w/2)-terrainOffset(PX));obstacle(o,d);ctx.restore()});models.forEach(m=>{const yy=m.y+Math.sin(time*3+m.id)*4;ctx.save();ctx.translate(m.x,yy+terrainOffset(m.x)-terrainOffset(PX));ctx.rotate(Math.sin(time*2+m.id)*.12);poly([[0,-11],[10,-5],[10,7],[0,13],[-10,7],[-10,-5]],'#e6f8fb','#56a8b9');line(-10,-5,0,1,'#56a8b9');line(10,-5,0,1,'#56a8b9');line(0,1,0,13,'#56a8b9');ctx.restore()});ctx.save();if(routeDepth()>.1)ctx.filter='brightness(3) saturate(.5)';runner();ctx.restore();busDrawing();ctx.restore();ctx.restore();
 ctx.fillStyle='#5b7e92';ctx.font='9px monospace';ctx.textAlign='left';ctx.fillText(depth>.45?'UNDERGROUND / TRANSIT PASSAGE':'MAKAN / CONNECTED URBAN DISTRICT',20,H-18);ctx.textAlign='right';const ahead=tunnelRoute().ahead;ctx.fillText(ahead>0&&ahead<1200?'UNDERPASS IN '+Math.ceil(ahead/10)+' m':'E / EXPLORE A LANDMARK',W-20,H-18);
}
function runningSpeed(seconds=time){return 250+290*(1-Math.exp(-seconds/80))}
function update(dt){
 time+=dt;const speed=runningSpeed();travel+=speed*dt;cameraDistance+=(travel-cameraDistance)*(1-Math.exp(-dt*12));const z=currentZone();if(z!==zoneSeen){zoneSeen=z;$('announcement').textContent='Entering '+districts[z].name+'.'}
 jumpBuffer=Math.max(0,jumpBuffer-dt);player.landing=Math.max(0,(player.landing||0)-dt);player.dropPose=(player.dropPose||0)+((player.dropping?1:0)-(player.dropPose||0))*(1-Math.exp(-dt*20));const wasAirborne=player.y<floor-bodyHeight-.1||player.vy<0;player.vy+=(player.dropping?3200:1850)*dt;player.y=Math.min(floor-bodyHeight,player.y+player.vy*dt);
 if(player.y>=floor-bodyHeight){if(wasAirborne)player.landing=player.dropping?.26:.14;player.vy=0;player.jumps=0;player.dropping=false;if(jumpBuffer>0)jump()}
 coverGrace=Math.max(0,coverGrace-dt);nextBus-=dt;
 if(bus){bus.x-=bus.speed*dt;if(busCoversPlayer())coverGrace=.55;if(bus.x+bus.w<-100){bus=null;nextBus=14+Math.random()*7;spawn=Math.max(spawn,.9)}}
 if(!bus&&nextBus<=0){const ttl=(W+90+320-PX)/1100,clear=objects.every(o=>o.x+o.w<PX-30||(o.x-PX)/speed>ttl+.9);if(clear){bus={x:W+90,w:320,speed:1100};spawn=Math.max(spawn,ttl+1.1);$('announcement').textContent='Rapid transit passing. The walkway is clear.'}else nextBus=.25}
 spawn-=dt;if(spawn<=0&&!bus){spawnChunk();spawn=(470+Math.random()*220)/speed}
 // Move and collect nodes before collision checks to avoid stale-frame ordering.
 for(const m of models){m.x-=speed*dt;if(!m.collected&&Math.abs(m.x-(PX+14))<25&&Math.abs(m.y-(player.y+27))<26){m.collected=true;bonus+=50;$('announcement').textContent='Spatial node collected. +50 points.'}}
 for(const o of objects){o.x-=speed*dt;if(coverGrace<=0&&PX+6<o.x+o.w-4&&PX+25>o.x+4&&player.y+bodyHeight-3>floor-o.h+5){end();return}}
 objects=objects.filter(o=>o.x>-100);models=models.filter(m=>m.x>-30&&!m.collected);hud();
}


function openProject(id){const project=environment.projects.find(p=>p.id===id);if(!project)return;const dialog=$('project-dialog');projectResume=state==='running';if(projectResume)pause();$('project-title').textContent=project.title;$('project-type').textContent=project.type;$('project-description').textContent=project.text;const link=$('project-link');link.hidden=!project.href;if(project.href)link.href=project.href;if(!dialog.open)dialog.showModal()}
$('project-close').onclick=()=>$('project-dialog').close();$('project-dialog').addEventListener('close',()=>{if(projectResume&&state==='paused')pause();projectResume=false;canvas.focus()});
for(const button of document.querySelectorAll('[data-project]'))button.addEventListener('click',()=>openProject(button.dataset.project));

function frame(now){let remaining=Math.min(Math.max((now-last)/1000,0),.1);last=now;ambientTime+=remaining;while(remaining>0&&state==='running'){const dt=Math.min(remaining,1/120);update(dt);remaining-=dt}draw();requestAnimationFrame(frame)}requestAnimationFrame(frame);
})();









