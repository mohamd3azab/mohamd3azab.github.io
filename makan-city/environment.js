/* MAKAN city illustration. Decorative geometry never enters the collision system. */
(function(global){'use strict';
const palette={ivory:'#f4f1e8',white:'#fffefa',stone:'#dfE3dd',side:'#bbcdd6',glass:'#b9d5e4',ink:'#496a7d',sage:'#9eaf87',sageDark:'#6f8c70',beige:'#d9ba8d'};
const projects=[
 {id:'connector',title:'The Multi-Level Urban Connector',short:'Urban Connector',type:'Architecture / connected public space',text:'Pedestrian bridges, elevated public spaces and stepped courtyards connect multiple urban layers. This district translates the project into a continuous network of shared platforms.',href:'https://mohamdazab.com/work/multi-level-urban-connector.html'},
 {id:'headquarters',title:'MAKAN Headquarters',short:'MAKAN HQ',type:'Fictional landmark / creative hub',text:'A signature home for MAKAN: a model-making workshop, architecture studios, shared research spaces and a public gallery gathered around planted terraces. A fictional creative hub designed for this game world.'},
 {id:'spectrum',title:'Amman Spectrum Media City',short:'Spectrum',type:'Architecture / media and mixed use',text:'Twin high-rise towers rise above a connected modern podium. Glazed elevations, shared terraces and a public base bring the vertical landmark into the life of the district.',href:'https://mohamdazab.com/work/amman-spectrum-media-city.html'},
 {id:'benghazi',title:'Benghazi Parametric Tower',short:'Benghazi Tower',type:'Parametric architecture / illustrated interpretation',text:'An expressive tower with fluid structural ribbons, recessed glazing and planted sky spaces. The game illustration interprets the tower described in your brief through the geometry of the supplied visual references.'},
 {id:'pulse',title:'Urban Pulse',short:'Urban Pulse',type:'Urban design / public life',text:'Public stairs, planted edges, informal seating and interactive urban spaces make room for daily encounters. The city is experienced at the scale of the people who use it.',href:'https://mohamdazab.com/work/urban-pulse.html'}
];
const fract=n=>{const v=Math.sin(n*127.1+13.7)*43758.5453;return v-Math.floor(v)};
function create(context){
 const cache=new Map(),foliage=new Map();let hits=[],metrics={drawCalls:0,cachedLandmarks:0},lastWidth=1200;
 function path(c,pts,fill,stroke,width=.7){c.beginPath();pts.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.closePath();if(fill){c.fillStyle=fill;c.fill()}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke()}}
 function line(c,x,y,a,b,col,w=1){c.strokeStyle=col;c.lineWidth=w;c.beginPath();c.moveTo(x,y);c.lineTo(a,b);c.stroke()}
 function oval(c,x,y,rx,ry,col){c.fillStyle=col;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill()}
 function rect(c,x,y,w,h,col){c.fillStyle=col;c.fillRect(x,y,w,h)}
 function gradient(c,x,y,h,top,bottom){const g=c.createLinearGradient(x,y,x,y+h);g.addColorStop(0,top);g.addColorStop(1,bottom);return g}
 function figure(c,x,y,s=1,sitting=false){c.save();c.translate(x,y);c.scale(s,s);oval(c,0,-17,2.3,2.6,'#527386');line(c,0,-13,-1,-6,'#527386',2.5);if(sitting){line(c,-1,-6,5,-6,'#527386',1.4);line(c,5,-6,5,0,'#527386',1.3)}else{line(c,-1,-6,-4,0,'#527386',1.3);line(c,-1,-6,2,0,'#527386',1.3)}line(c,-1,-11,4,-7,'#527386',1.1);c.restore()}
 function treeSprite(seed){const key=seed%5;if(foliage.has(key))return foliage.get(key);const cv=document.createElement('canvas');cv.width=130;cv.height=150;const c=cv.getContext('2d');
  // Branching silhouettes and many small clusters avoid uniform circular canopies.
  line(c,65,143,66,72,'#788778',3);for(let j=0;j<7;j++){const a=fract(j+key*19)*70-35,b=45+fract(j*5+key)*30;line(c,66,109-j*4,65+a,b,'#788778',1.5)}
  const colors=['#a8b991','#91aa83','#bdc89e','#829b7c','#cfD5b0'];for(let j=0;j<74;j++){const angle=fract(j*3+key)*Math.PI*2,r=Math.sqrt(fract(j*7+key))*44,x=65+Math.cos(angle)*r,y=58+Math.sin(angle)*r*.77;oval(c,x,y,5+fract(j*11)*8,4+fract(j*9)*7,colors[j%5])}foliage.set(key,cv);return cv;
 }
 function tree(c,x,base,size=1,seed=0,wind=0){c.save();c.translate(x,base);c.rotate(wind);c.drawImage(treeSprite(seed),-55*size,-127*size,110*size,127*size);c.restore()}
 function shrubs(c,x,y,w,seed=0){const colors=['#a7b98c','#c0cba1','#8da681','#b1c392'];for(let j=0;j<w/5;j++){const px=x+j*5,py=y-fract(j+seed)*7;oval(c,px,py,4+fract(j*2+seed)*4,4+fract(j*3)*5,colors[j%4])}}
 function planter(c,x,y,w,h=15){rect(c,x,y,w,h,'#dae1d9');path(c,[[x+w,y],[x+w+7,y-4],[x+w+7,y+h-4],[x+w,y+h]],'#b7c7c5');shrubs(c,x+3,y,w-5,Math.round(x))}
 function railing(c,x,y,w){line(c,x,y,x+w,y,'#648899',1);for(let j=0;j<=w;j+=27)line(c,x+j,y,x+j,y+16,'#7195a4',.65);rect(c,x,y+1,w,14,'#c6e0e652')}
 function glazing(c,x,y,w,h,warm=false){rect(c,x,y,w,h,gradient(c,x,y,h,warm?'#dfe7df':'#b5d1e1',warm?'#f5e7c8':'#d7e8ed'));if(warm){for(let j=0;j<w;j+=37)rect(c,x+j+6,y+5,23,h-10,'#f8eacc');for(let j=0;j<w;j+=48)line(c,x+j+18,y+5,x+j+18,y+12,'#fffef2',1.5)}
  for(let j=16;j<w;j+=19)line(c,x+j,y,x+j,y+h,'#f3f6f0',.8);for(let k=18;k<h;k+=20)line(c,x,y+k,x+w,y+k,'#eef5f5',.6);
  path(c,[[x+3,y],[x+w*.35,y],[x+w*.7,y+h],[x+w*.55,y+h]],'#ffffff26');
 }
 function volume(c,x,y,w,h,opt={}){const side=opt.side||'#bdcdd4';rect(c,x,y,w,h,opt.fill||palette.ivory);path(c,[[x+w,y],[x+w+14,y-8],[x+w+14,y+h-8],[x+w,y+h]],side);path(c,[[x,y],[x+14,y-8],[x+w+14,y-8],[x+w,y]],'#fffefa');if(opt.glass!==false)glazing(c,x+8,y+10,w-16,h-19,!!opt.warm);if(opt.fins){for(let j=12;j<w-10;j+=11)rect(c,x+j,y+8,2.6,h-15,'#f6f4e9')}line(c,x,y+h,x+w,y+h,'#b7c8d0',.8)}
 function stairs(c,x,base,w,rise,count=10){const sh=rise/count,sw=w/count;for(let i=0;i<count;i++){rect(c,x+i*sw,base-(i+1)*sh,w-i*sw,sh+1,i%2?'#e9e8df':'#f7f4e9');line(c,x+i*sw,base-(i+1)*sh,x+w,base-(i+1)*sh,'#cbd1ca',.55)}line(c,x,base-15,x+w,base-rise-17,'#7396a2',1);for(let j=0;j<=5;j++){const t=j/5;line(c,x+w*t,base-rise*t-16,x+w*t,base-rise*t,'#7396a2',.65)}}
 function bridge(c,x,y,w,columns=true){path(c,[[x,y],[x+w,y-3],[x+w,y+9],[x,y+12]],'#eef0e8');line(c,x,y+12,x+w,y+9,'#b8cbd4',1);railing(c,x,y-15,w);if(columns)for(let j=70;j<w;j+=130){path(c,[[x+j,y+10],[x+j+12,y+10],[x+j+20,y+88],[x+j+5,y+88]],'#d5e0e2');}planter(c,x+12,y-3,Math.min(w*.43,150),5)}
 function sculpture(c,x,y,s=1){c.save();c.translate(x,y);c.scale(s,s);for(let j=0;j<3;j++){c.beginPath();c.moveTo(j*22,0);c.bezierCurveTo(j*22-5,-55+j*10,j*22+53,-76+j*5,j*22+54,0);c.strokeStyle='#b69265';c.lineWidth=4;c.stroke();c.strokeStyle='#e8d1ac';c.lineWidth=1;c.stroke()}c.restore()}
 function headquarters(c){
  volume(c,163,239,425,117,{warm:true});volume(c,283,177,238,61,{warm:true});volume(c,342,115,149,62);volume(c,422,50,88,65);
  // Tall open crown: a recognisable, restrained creative-campus signature.
  rect(c,505,5,18,225,'#e9e8df');rect(c,622,5,15,225,'#d3dedf');rect(c,505,5,132,20,'#f9f5e9');path(c,[[637,5],[650,-3],[650,230],[637,230]],'#b9cbd4');glazing(c,524,92,95,137);planter(c,524,93,94,9);tree(c,552,93,.32,3);tree(c,591,93,.28,4);
  for(const [x,y,w] of [[173,238,400],[291,176,223],[350,114,130]]){planter(c,x,y,w,9);railing(c,x+5,y-17,w-10)}
  for(let j=0;j<5;j++)tree(c,190+j*77,238,.28,j);for(let j=0;j<3;j++)tree(c,307+j*70,176,.25,j+1);
  rect(c,163,238,108,118,'#f0eddf');c.fillStyle='#607d90';c.font='16px Arial';c.letterSpacing='3px';c.fillText('M A K A N',181,274);line(c,183,287,230,287,'#8aabbb',2);
  // Small physical models on studio worktables give the creative hub an interior life.
  rect(c,311,217,83,3,'#bda37d');line(c,318,220,318,230,'#9faeac',1);line(c,386,220,386,230,'#9faeac',1);
  rect(c,326,206,12,11,'#fffdf5');rect(c,340,200,10,17,'#f5f3e9');rect(c,353,209,21,8,'#fffdf5');path(c,[[326,206],[331,203],[343,203],[338,206]],'#e2e8df');
  stairs(c,297,356,152,89,12);railing(c,472,337,108);figure(c,199,236,.75);figure(c,222,236,.7);figure(c,318,175,.7);figure(c,493,336,.7);figure(c,512,336,.7);
  planter(c,453,334,119,20);tree(c,542,333,.42,2);volume(c,58,289,104,67,{warm:true});bridge(c,70,277,125,false);planter(c,70,276,110,8);tree(c,90,276,.36,3);
 }
 function connector(c){
  volume(c,24,231,177,100,{warm:true});volume(c,275,190,129,94,{fins:true});volume(c,443,226,174,106,{warm:true});volume(c,89,161,110,70,{warm:true});
  bridge(c,-35,222,785,true);bridge(c,12,306,714,false);stairs(c,318,357,183,87,12);stairs(c,20,356,155,38,7);bridge(c,160,151,246,false);
  for(const [x,y,w]of[[28,222,161],[453,222,155],[95,151,100],[281,181,114],[549,300,93]])planter(c,x,y,w,7);
  for(let j=0;j<8;j++)tree(c,34+j*92,305,.32,j);for(let j=0;j<5;j++)figure(c,63+j*130,220,.65);for(let j=0;j<3;j++)figure(c,230+j*62,304,.75);
  // Lightweight gallery pavilion on the elevated connector.
  glazing(c,205,177,125,44,true);path(c,[[190,171],[345,178],[343,184],[192,178]],'#d7b98d');line(c,204,179,204,221,'#7f9aa8',2);line(c,331,184,331,221,'#7f9aa8',2);
  sculpture(c,109,356,.85);planter(c,16,341,90,17);planter(c,529,338,144,19);
 }
 function spectrum(c){
  for(const [x,y,w,h]of[[91,29,100,245],[239,45,94,229]]){volume(c,x,y,w,h,{fins:true});rect(c,x-8,y-22,13,h+22,'#f6f2e6');rect(c,x+w-4,y-22,15,h+22,'#e5e6de');rect(c,x-8,y-22,w+19,12,'#f6f2e6');planter(c,x+4,y+22,w-11,7);tree(c,x+32,y+22,.22,1);tree(c,x+67,y+22,.22,2)}
  volume(c,48,274,474,73,{warm:true});volume(c,363,225,159,49,{warm:true});bridge(c,178,257,241,false);planter(c,57,273,283,9);planter(c,369,224,149,9);railing(c,369,207,145);tree(c,389,224,.30,0);tree(c,476,224,.30,1);
  stairs(c,405,354,142,60,8);for(let j=0;j<6;j++)figure(c,69+j*75,271,.65);bridge(c,-20,330,728,false);tree(c,572,345,.67,4);
 }
 function benghazi(c){
  // Continuous fluid ribbons, read as structure and shade around recessed glazing.
  c.beginPath();c.moveTo(237,309);c.bezierCurveTo(226,207,260,131,243,19);c.bezierCurveTo(286,15,335,40,365,63);c.bezierCurveTo(377,148,344,218,371,309);c.closePath();c.fillStyle='#b9d5e5';c.fill();
  for(let k=0;k<9;k++){c.beginPath();c.moveTo(249+k*12,35+k*3);c.bezierCurveTo(265+k*12,125,231+k*13,219,248+k*13,303);c.strokeStyle='#f5f6ef';c.lineWidth=.9;c.stroke()}
  for(let y=65;y<305;y+=16)line(c,244,y,365,y,'#e9f2f4',.65);
  const ribbons=[[[242,22],[242,127],[349,185],[371,309]],[[366,63],[381,155],[269,243],[239,309]],[[259,24],[301,128],[253,216],[291,309]]];
  for(const r of ribbons){c.beginPath();c.moveTo(...r[0]);c.bezierCurveTo(...r[1],...r[2],...r[3]);c.strokeStyle='#c5d4da';c.lineWidth=13;c.stroke();c.strokeStyle='#fcf8ed';c.lineWidth=10;c.stroke()}
  planter(c,257,141,51,7);tree(c,280,141,.21,1);planter(c,297,234,49,7);tree(c,320,234,.2,4);
  volume(c,116,310,398,45,{warm:true});bridge(c,-20,291,248,false);bridge(c,384,291,346,false);tree(c,161,307,.42,0);tree(c,456,307,.43,1);railing(c,125,293,90);figure(c,190,307,.7);figure(c,434,307,.7);
 }
 function pulse(c){
  volume(c,466,197,190,75,{warm:true});volume(c,485,146,154,51,{warm:true});planter(c,493,144,141,9);railing(c,492,129,144);tree(c,527,144,.34,3);tree(c,593,144,.31,2);
  // Broad civic stairs and seating make the public realm the principal form.
  stairs(c,280,356,206,114,15);stairs(c,110,356,140,43,7);bridge(c,-20,240,380,true);volume(c,55,269,142,45,{warm:true});
  for(const [x,y,w]of[[130,335,113],[174,306,86],[499,277,121],[486,271,166]]){planter(c,x,y,w,14);railing(c,x,y-16,w)}
  for(const [x,y,w]of[[149,332,81],[342,322,70],[405,289,73]]){rect(c,x,y,w,8,'#c6a375');rect(c,x+5,y+8,6,13,'#a5b6ba');rect(c,x+w-12,y+8,6,13,'#a5b6ba');figure(c,x+w*.67,y,.8,true)}
  tree(c,73,355,.72,1);tree(c,560,270,.48,0);tree(c,632,270,.38,2);tree(c,242,306,.38,3);sculpture(c,88,355,.9);sculpture(c,191,355,.6);figure(c,458,244,.8);figure(c,307,355,.9);figure(c,324,355,.8);figure(c,604,270,.7);
 }
 const builders={connector,headquarters,spectrum,benghazi,pulse};
 function tile(id){if(cache.has(id))return cache.get(id);const cv=document.createElement('canvas'),ratio=1.5;cv.width=750*ratio;cv.height=390*ratio;const c=cv.getContext('2d');c.scale(ratio,ratio);builders[id](c);cache.set(id,cv);metrics.cachedLandmarks=cache.size;return cv}
 function surfaceDistance(distance){return distance}
 function background({width,height,ground,camera,time,interactive=true}){const c=context;lastWidth=width;hits=[];metrics.drawCalls=0;
  rect(c,0,0,width,height,gradient(c,0,0,height,'#ddf1fb','#f9fcf8'));oval(c,width*.86,68,22,22,'#fffcf0');
  for(let i=-1;i<Math.ceil(width/260)+2;i++){const x=i*270-((camera*.025+time*2)%270),y=36+fract(i+9)*62;c.save();c.globalAlpha=.68;c.fillStyle='#fff';c.beginPath();c.moveTo(x-40,y+13);c.bezierCurveTo(x-70,y+6,x-39,y-17,x-24,y-7);c.bezierCurveTo(x-10,y-42,x+30,y-32,x+33,y-12);c.bezierCurveTo(x+68,y-18,x+80,y+15,x+52,y+16);c.closePath();c.fill();c.restore()}
  // Distant landscape and skyline use their own parallax rates and low contrast.
  c.beginPath();c.moveTo(0,ground-90);for(let x=0;x<=width;x+=16)c.lineTo(x,ground-107+Math.sin((x+camera*.045)/210)*13);c.lineTo(width,ground);c.lineTo(0,ground);c.closePath();c.fillStyle='#e4eff0';c.fill();
  for(const layer of [{rate:.065,step:82,base:ground-76,color:'#d9e9f0',alpha:.72},{rate:.13,step:121,base:ground-61,color:'#c8dfe9',alpha:.62}]){const off=camera*layer.rate,start=Math.floor(off/layer.step)-1;c.save();c.globalAlpha=layer.alpha;for(let i=start;i<start+Math.ceil(width/layer.step)+3;i++){const x=i*layer.step-off,r=fract(i+23),w=34+r*33,h=67+fract(i+71)*190,y=layer.base-h;rect(c,x,y,w,h,layer.color);path(c,[[x+w,y],[x+w+9,y-5],[x+w+9,layer.base],[x+w,layer.base]],'#bbd3df');if(i%4===0){path(c,[[x,y],[x+w*.7,y-16],[x+w,y],[x+w,layer.base],[x,layer.base]],layer.color);line(c,x+w*.65,y-14,x+w*.65,y-38,'#c7e0eb',1)}for(let xx=x+9;xx<x+w-4;xx+=12)line(c,xx,y+8,xx,layer.base-7,'#e5f0f4',.65)}c.restore()}
  // Secondary silhouettes introduce the district's architectural language in depth.
  c.save();c.globalAlpha=.55;const distant=(camera*.16)%2600;
  c.drawImage(tile('spectrum'),30-distant,ground-326,510,265);
  c.drawImage(tile('benghazi'),300-distant,ground-334,525,273);
  c.drawImage(tile('spectrum'),2630-distant,ground-326,510,265);c.restore();
  const off=surfaceDistance(camera)*.36+200,start=Math.floor(off/750)-1;
  for(let i=start;i<start+Math.ceil(width/750)+3;i++){const index=((i%5)+5)%5,id=projects[index].id,x=i*750-off-160,top=ground-370;if(x>width+20||x+750<-20)continue;c.drawImage(tile(id),x,top,750,390);metrics.drawCalls++;
   const px=x+(id==='benghazi'?306:id==='headquarters'?360:340);if(px>25&&px<width-25&&interactive){hits.push({id,x:px-72,y:ground-54,width:144,height:22,building:{x:x+20,y:top+15,width:690,height:320}});c.fillStyle='#fffdf2e8';c.fillRect(px-72,ground-54,144,22);line(c,px-72,ground-54,px-72,ground-32,'#8facb9',1.5);c.font='9px Arial';c.textAlign='center';c.fillStyle='#4d7286';c.fillText(projects[index].short.toUpperCase()+'  +',px,ground-40)}
  }
  // Continuous midground transit route joins the architectural groups.
  const yy=ground-150;bridge(c,-20,yy,width+40,false);for(let x=-(camera*.24)%330;x<width;x+=330){path(c,[[x,yy+10],[x+12,yy+10],[x+23,ground-44],[x+9,ground-44]],'#d6e4e7')}
  const tx=(time*66-camera*.12)%(width+220);rect(c,tx,yy-24,158,19,'#f5f7f0');for(let j=0;j<9;j++)rect(c,tx+7+j*16,yy-20,11,9,'#9cbfd2');line(c,tx+3,yy-5,tx+155,yy-5,'#91aebd',1.4);
 }
 function foreground({width,ground,camera,time}){const c=context,off=camera*.63,start=Math.floor(off/270)-1;
  rect(c,0,ground-23,width,20,'#ecf0e8');for(let i=start;i<start+Math.ceil(width/270)+3;i++){const x=i*270-off;planter(c,x+9,ground-34,113,12);tree(c,x+53,ground-34,.61,Math.abs(i),Math.sin(time*.8+i)*.008);line(c,x+159,ground-21,x+159,ground-104,'#547789',2.1);line(c,x+159,ground-104,x+183,ground-104,'#547789',2);line(c,x+169,ground-101,x+183,ground-101,'#e9d9b0',2.1);
   rect(c,x+163,ground-95,18,39,'#c3cdaa');path(c,[[x+163,ground-95],[x+181,ground-95],[x+163,ground-72]],'#f5f1d8');oval(c,x+176,ground-63,6,6,'#f5f1d8');
   if(i%2===0){rect(c,x+199,ground-30,63,5,'#caa779');rect(c,x+204,ground-25,4,5,'#8aa1ab');rect(c,x+251,ground-25,4,5,'#8aa1ab');figure(c,x+238,ground-30,.88,true)}
  }
 }
 function promenade({width,ground,camera}){const c=context;rect(c,0,ground-3,width,16,'#f4f1e9');line(c,0,ground,width,ground,'#7e9baa',1);rect(c,0,ground+13,width,12,'#afc3ce');rect(c,0,ground+25,width,75,gradient(c,0,ground+25,75,'#8fa9b9','#c0d1dc'));for(let x=-(camera)%80;x<width;x+=80){line(c,x,ground+1,x-24,ground+12,'#d7dcd8',.8);line(c,x,ground+14,x,ground+24,'#8fa7b4',.7)}}
 function hitTest(x,y){return hits.find(h=>x>=h.x&&x<=h.x+h.width&&y>=h.y&&y<=h.y+h.height)||hits.find(h=>x>=h.building.x&&x<=h.building.x+h.building.width&&y>=h.building.y&&y<=h.building.y+h.building.height&&y<350)}
 function nearest(){return hits.length?hits.reduce((a,b)=>Math.abs(a.x+a.width/2-180)<Math.abs(b.x+b.width/2-180)?a:b).id:'headquarters'}
 return{background,foreground,promenade,hitTest,nearest,projects,getMetrics:()=>({...metrics,treeSprites:foliage.size}),surfaceDistance};
}
global.MakanEnvironment={create,projects,palette};
})(window);

// A single coherent panorama, cached as one cyclic texture. No alternating plates.
(function(global){'use strict';const baseCreate=global.MakanEnvironment.create;
const base=document.currentScript?.src||document.baseURI;
global.MakanEnvironment.create=function(c){const fallback=baseCreate(c);if(!global.Image)return fallback;
 const im=new global.Image();im.decoding='async';im.src=global.MAKAN_ART?.panorama||new URL('assets/city-loop.png',base).href;let texture=null,hits=[];
 const realm=new global.Image();realm.decoding='async';realm.src=global.MAKAN_ART?.realm||new URL('assets/foreground-layer.png',base).href;let realmTile=null;
 const ready=()=>im.complete&&im.naturalWidth>0;
 function surfaceDistance(n){return n}
 function plate(){if(texture)return texture;const overlap=Math.round(im.naturalWidth*.065),w=im.naturalWidth-overlap,cv=document.createElement('canvas');cv.width=w;cv.height=im.naturalHeight;const x=cv.getContext('2d');x.drawImage(im,-overlap,0);
  // Overlap only the quiet outer edge of this SAME district. The final pixel wraps
  // to the source coordinate at the beginning of the next period.
  const edge=document.createElement('canvas');edge.width=overlap;edge.height=cv.height;const e=edge.getContext('2d');e.drawImage(im,0,0);e.globalCompositeOperation='destination-in';const g=e.createLinearGradient(0,0,overlap,0);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,1)');e.fillStyle=g;e.fillRect(0,0,overlap,cv.height);x.drawImage(edge,w-overlap,0);texture=cv;return cv;
 }
 const areas=[['spectrum',.16,.16,.15,.43],['benghazi',.36,.12,.10,.52],['headquarters',.49,.15,.23,.65],['pulse',.24,.66,.21,.22],['connector',.01,.43,.24,.34]];
 function background(scene){if(!ready()){fallback.background(scene);return}c.canvas.dataset.artReady='true';const cv=plate(),scale=scene.height/im.naturalHeight,w=cv.width*scale,off=surfaceDistance(scene.camera)-140,y=scene.ground-scene.height*.912;hits=[];
  for(let n=Math.floor(off/w)-1;n<Math.floor(off/w)+Math.ceil(scene.width/w)+2;n++){const x=n*w-off;c.drawImage(cv,x,y,w,scene.height);if(scene.interactive!==false)for(const[id,ax,ay,aw,ah]of areas){const h={id,x:x+(ax*im.naturalWidth-im.naturalWidth*.065)*scale,y:y+ay*scene.height,width:aw*im.naturalWidth*scale,height:ah*scene.height};if(h.x+h.width>0&&h.x<scene.width)hits.push(h)}}

  // Small high clouds drift independently of the architectural panorama.
  c.save();c.globalAlpha=.12;c.fillStyle='#ffffff';for(let i=-1;i<5;i++){const x=i*410-(scene.time*4+scene.camera*.035)%410;c.beginPath();c.ellipse(x,43+(i%2)*25,65,7,0,0,Math.PI*2);c.fill()}c.restore();
 }
 const frontage=new global.Image();frontage.decoding='async';frontage.src=global.MAKAN_ART?.frontage||new URL('assets/street-frontages-integrated.png',base).href;let frontageTile=null;
 function frontages(scene){
  if(!frontage.complete||!frontage.naturalWidth)return;
  if(!frontageTile){const cv=document.createElement('canvas');cv.width=frontage.naturalWidth;cv.height=frontage.naturalHeight;cv.getContext('2d').drawImage(frontage,0,0);frontageTile=cv;}
  const cycle=Math.floor(scene.camera/22000),plans=[[800,.9,'headquarters'],[14000,.9,'spectrum'],[17800,.9,'pulse'],[21600,.9,'benghazi']];
  for(let cycleIndex=cycle-1;cycleIndex<=cycle+1;cycleIndex++)for(const [end,size,id]of plans){const h=scene.height*size,w=frontage.naturalWidth/frontage.naturalHeight*h,right=140+cycleIndex*22000+end-scene.camera,x=right-w,y=scene.ground-h*.91;if(right<0||x>scene.width)continue;c.drawImage(frontageTile,x,y,w,h);if(scene.interactive!==false)hits.unshift({id,x:x+w*.08,y:y+h*.36,width:w*.84,height:h*.50});}
  c.canvas.dataset.frontages='ready';
 }
 function districtSpans(scene){
  const spans=[],cycle=Math.floor(scene.camera/22000),ratio=frontage.naturalWidth&&frontage.naturalHeight?frontage.naturalWidth/frontage.naturalHeight:3;
  for(let n=cycle-1;n<=cycle+1;n++){
   for(const end of [800,14000,17800,21600]){const right=140+n*22000+end-scene.camera,w=ratio*scene.height*.9;spans.push([right-w+85,right-85])}
   const joint=140+n*22000+2600-scene.camera,w=scene.height*.8*3;spans.push([joint-w+85,joint+w-85]);
  }
  return spans.filter(([a,b])=>b>0&&a<scene.width).sort((a,b)=>a[0]-b[0]);
 }
 function publicRealm(scene){
  if(!realm.complete||!realm.naturalWidth)return;
  if(!realmTile){const overlap=Math.round(realm.naturalWidth*.08),cv=document.createElement('canvas');cv.width=realm.naturalWidth-overlap;cv.height=realm.naturalHeight;const x=cv.getContext('2d');x.drawImage(realm,-overlap,0);const edge=document.createElement('canvas');edge.width=overlap;edge.height=cv.height;const q=edge.getContext('2d');q.drawImage(realm,0,0);q.globalCompositeOperation='destination-in';const fade=q.createLinearGradient(0,0,overlap,0);fade.addColorStop(0,'rgba(0,0,0,0)');fade.addColorStop(1,'rgba(0,0,0,1)');q.fillStyle=fade;q.fillRect(0,0,overlap,cv.height);x.drawImage(edge,cv.width-overlap,0);realmTile=cv;}
  // Each district owns its near architecture. Do not stack another street image
  // across doors, terrace steps or bridge supports already present in that district.
  c.save();c.beginPath();let cursor=0;for(const [a,b]of districtSpans(scene)){const left=Math.max(0,a),right=Math.min(scene.width,b);if(left>cursor)c.rect(cursor,0,left-cursor,scene.height+400);cursor=Math.max(cursor,right)}if(cursor<scene.width)c.rect(cursor,0,scene.width-cursor,scene.height+400);c.clip();
  const scale=scene.height/realm.naturalHeight,w=realmTile.width*scale,off=scene.camera-140,y=scene.ground-855*scale;
  for(let n=Math.floor(off/w)-1;n<Math.ceil((off+scene.width)/w)+1;n++)c.drawImage(realmTile,n*w-off,y,w,scene.height);
  c.restore();c.canvas.dataset.publicRealm='ready';
 }
 function foreground(scene){const {width,ground,camera}=scene;
  c.fillStyle='#f4f1e8';c.fillRect(0,ground-10,width,26);c.fillStyle='#a7bdc9';c.fillRect(0,ground+16,width,12);c.fillStyle='#7e9aaa';c.fillRect(0,ground+28,width,90);
  c.strokeStyle='#d4d9d5';c.lineWidth=.8;const off=camera%100;for(let x=-off;x<width+100;x+=100){c.beginPath();c.moveTo(x,ground-10);c.lineTo(x-25,ground+15);c.stroke()}c.strokeStyle='#dfe5e2';c.beginPath();c.moveTo(0,ground+16);c.lineTo(width,ground+16);c.stroke();
 }
 function hitTest(x,y){return ready()?hits.find(h=>x>=h.x&&x<=h.x+h.width&&y>=h.y&&y<=h.y+h.height):fallback.hitTest(x,y)}
 return{...fallback,background,foreground,publicRealm,frontages,districtSpans,promenade:()=>{},hitTest,nearest:()=>hits.length?hits.reduce((a,b)=>Math.abs(a.x+a.width/2-180)<Math.abs(b.x+b.width/2-180)?a:b).id:'headquarters',surfaceDistance,getMetrics:()=>({...fallback.getMetrics(),artReady:ready(),publicRealmReady:realm.complete&&realm.naturalWidth>0,frontagesReady:frontage.complete&&frontage.naturalWidth>0,artLayers:2,cachedArtPlates:texture?1:0,loopWidth:texture?.width||0})};
};})(window);


