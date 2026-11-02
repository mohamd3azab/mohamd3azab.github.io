/* Real WebGL geometry, directional lighting and shadow mapping. No runtime dependencies. */
(() => {
  'use strict';
  const host = document.querySelector('.architectural-scene');
  if (!host) return;
  const canvas = document.createElement('canvas');
  canvas.className = 'spatial-canvas';
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', 'Interactive abstract architectural study. Use the rotate buttons to explore the three-dimensional structure.');
  const gl = canvas.getContext('webgl', { alpha: false, antialias: true, powerPreference: 'low-power' });
  if (!gl) return; // The original project image remains the fallback.
  const root = document.querySelector('.experience-home');
  const hero = root.querySelector('.hero');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const mat = {
    identity: () => new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]),
    multiply(a,b) {
      const out = new Float32Array(16);
      for (let c=0;c<4;c++) for (let r=0;r<4;r++) for (let k=0;k<4;k++) out[c*4+r] += a[k*4+r]*b[c*4+k];
      return out;
    },
    perspective(fov,aspect,near,far) {
      const f=1/Math.tan(fov/2), d=1/(near-far);
      return new Float32Array([f/aspect,0,0,0,0,f,0,0,0,0,(far+near)*d,-1,0,0,2*far*near*d,0]);
    },
    ortho(l,r,b,t,n,f) { return new Float32Array([2/(r-l),0,0,0,0,2/(t-b),0,0,0,0,-2/(f-n),0,-(r+l)/(r-l),-(t+b)/(t-b),-(f+n)/(f-n),1]); },
    lookAt(eye,target) {
      const normalize=v=>{const n=Math.hypot(...v)||1;return v.map(x=>x/n);};
      const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
      const z=normalize(eye.map((v,i)=>v-target[i])), x=normalize(cross([0,1,0],z)), y=cross(z,x);
      const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
      return new Float32Array([x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,eye),-dot(y,eye),-dot(z,eye),1]);
    },
    model(x,y,z,sx,sy,sz,angle=0) {
      const c=Math.cos(angle),s=Math.sin(angle);
      return new Float32Array([c*sx,0,-s*sx,0,0,sy,0,0,s*sz,0,c*sz,0,x,y,z,1]);
    }
  };
  const vertex = `
    attribute vec3 aPosition; attribute vec3 aNormal;
    uniform mat4 uModel; uniform mat4 uViewProjection; uniform mat4 uLight;
    varying vec3 vWorld; varying vec3 vNormal; varying vec4 vShadow;
    void main(){ vec4 world=uModel*vec4(aPosition,1.0);vWorld=world.xyz;
      vNormal=normalize(mat3(uModel)*aNormal);vShadow=uLight*world;
      gl_Position=uViewProjection*world; }
  `;
  const fragment = `
    precision highp float;
    uniform vec3 uColor; uniform vec3 uEye; uniform sampler2D uShadow;
    uniform float uGround; uniform float uEmission;
    varying vec3 vWorld; varying vec3 vNormal; varying vec4 vShadow;
    float unpackDepth(vec4 v){return dot(v,vec4(1.0/16777216.0,1.0/65536.0,1.0/256.0,1.0));}
    float shadow(){ vec3 p=vShadow.xyz/vShadow.w*.5+.5;
      if(p.x<0.0||p.x>1.0||p.y<0.0||p.y>1.0||p.z>1.0)return 1.0;
      float s=0.0;
      for(int x=-1;x<=1;x++){for(int y=-1;y<=1;y++){
        float d=unpackDepth(texture2D(uShadow,p.xy+vec2(float(x),float(y))/1024.0));
        s+=p.z-0.0025>d?0.28:1.0;
      }} return s/9.0;
    }
    void main(){ vec3 n=normalize(vNormal), l=normalize(vec3(-.6,1.0,.65));
      vec3 view=normalize(uEye-vWorld); float diffuse=max(dot(n,l),0.0);
      float rim=pow(1.0-max(dot(n,view),0.0),3.0);
      vec3 base=uColor;
      if(uGround>.5){
        vec2 cell=abs(fract(vWorld.xz*.5+.5)-.5);
        float grid=1.0-smoothstep(.005,.018,min(cell.x,cell.y));
        base+=vec3(.012,.01,.009)*grid;
      }
      float visibility=shadow();
      vec3 light=vec3(.15,.16,.20)+vec3(1.5,1.18,.82)*diffuse*visibility;
      float spec=pow(max(dot(n,normalize(l+view)),0.0),48.0)*.16*visibility;
      vec3 color=base*light+vec3(.23,.13,.12)*rim+spec+base*uEmission;
      float fog=1.0-exp(-length(uEye-vWorld)*.014);
      color=mix(color,vec3(.018,.016,.023),fog);
      color=color/(color+vec3(1.0));color=pow(color,vec3(1.0/2.2));
      gl_FragColor=vec4(color,1.0);
    }
  `;
  const depthVertex = `attribute vec3 aPosition;uniform mat4 uModel;uniform mat4 uLight;void main(){gl_Position=uLight*uModel*vec4(aPosition,1.0);}`;
  const depthFragment = `precision highp float;void main(){vec4 d=fract(gl_FragCoord.z*vec4(16777216.0,65536.0,256.0,1.0));d-=d.xxyz*vec4(0.0,1.0/256.0,1.0/256.0,1.0/256.0);gl_FragColor=d;}`;
  function program(v,f) {
    function compile(type,source) {const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){gl.deleteShader(s);throw Error('Shader unavailable');}return s;}
    const vs=compile(gl.VERTEX_SHADER,v),fs=compile(gl.FRAGMENT_SHADER,f),p=gl.createProgram();gl.attachShader(p,vs);gl.attachShader(p,fs);gl.linkProgram(p);gl.deleteShader(vs);gl.deleteShader(fs);
    if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error('Scene program unavailable');
    return {p,position:gl.getAttribLocation(p,'aPosition'),normal:gl.getAttribLocation(p,'aNormal'),model:gl.getUniformLocation(p,'uModel'),view:gl.getUniformLocation(p,'uViewProjection'),light:gl.getUniformLocation(p,'uLight'),color:gl.getUniformLocation(p,'uColor'),eye:gl.getUniformLocation(p,'uEye'),shadow:gl.getUniformLocation(p,'uShadow'),ground:gl.getUniformLocation(p,'uGround'),emission:gl.getUniformLocation(p,'uEmission')};
  }
  let main,depth,buffer,shadowTexture,shadowBuffer,depthBuffer;
  try {
    main=program(vertex,fragment);depth=program(depthVertex,depthFragment);
    const faces=[
      [[1,0,0],[[.5,-.5,-.5],[.5,.5,-.5],[.5,.5,.5],[.5,-.5,.5]]],
      [[-1,0,0],[[-.5,-.5,.5],[-.5,.5,.5],[-.5,.5,-.5],[-.5,-.5,-.5]]],
      [[0,1,0],[[-.5,.5,-.5],[-.5,.5,.5],[.5,.5,.5],[.5,.5,-.5]]],
      [[0,-1,0],[[-.5,-.5,.5],[-.5,-.5,-.5],[.5,-.5,-.5],[.5,-.5,.5]]],
      [[0,0,1],[[.5,-.5,.5],[.5,.5,.5],[-.5,.5,.5],[-.5,-.5,.5]]],
      [[0,0,-1],[[-.5,-.5,-.5],[-.5,.5,-.5],[.5,.5,-.5],[.5,-.5,-.5]]]
    ];
    const data=[];for(const [normal,points] of faces)for(const i of [0,1,2,0,2,3])data.push(...points[i],...normal);
    buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.STATIC_DRAW);
    shadowTexture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,shadowTexture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1024,1024,0,gl.RGBA,gl.UNSIGNED_BYTE,null);
    for(const pname of [gl.TEXTURE_MIN_FILTER,gl.TEXTURE_MAG_FILTER])gl.texParameteri(gl.TEXTURE_2D,pname,gl.NEAREST);
    for(const pname of [gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T])gl.texParameteri(gl.TEXTURE_2D,pname,gl.CLAMP_TO_EDGE);
    shadowBuffer=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,shadowBuffer);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,shadowTexture,0);
    depthBuffer=gl.createRenderbuffer();gl.bindRenderbuffer(gl.RENDERBUFFER,depthBuffer);gl.renderbufferStorage(gl.RENDERBUFFER,gl.DEPTH_COMPONENT16,1024,1024);gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.RENDERBUFFER,depthBuffer);
    if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw Error('Shadow framebuffer unavailable');
    gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.enable(gl.DEPTH_TEST);
  } catch (_) {
    if(main)gl.deleteProgram(main.p);if(depth)gl.deleteProgram(depth.p);
    if(buffer)gl.deleteBuffer(buffer);if(shadowTexture)gl.deleteTexture(shadowTexture);
    if(shadowBuffer)gl.deleteFramebuffer(shadowBuffer);if(depthBuffer)gl.deleteRenderbuffer(depthBuffer);
    return;
  }
  host.prepend(canvas);
  host.classList.add('webgl-ready');
  const toolbar=document.createElement('div');toolbar.className='spatial-controls';
  toolbar.innerHTML='<span>Drag to orbit</span><div><button type="button" data-orbit="-1" aria-label="Rotate 3D study left">←</button><button type="button" data-orbit="1" aria-label="Rotate 3D study right">→</button><button type="button" data-orbit="reset">Reset view</button></div>';
  host.append(toolbar);
  const tag=document.createElement('div');tag.className='spatial-label';tag.innerHTML='<span class="spatial-live">Interactive 3D / Spatial study</span><strong>Architecture<br>in motion.</strong><span>Scroll to unfold the structure ↓</span>';
  host.append(tag);
  const colors={stone:[.58,.53,.45],chalk:[.82,.77,.66],wine:[.20,.035,.065],metal:[.10,.095,.105],light:[1.2,.51,.16]};
  let visible=true,frame=0,lastTime=0,orbit=0,dragging=false,lastX=0,progress=0,targetProgress=0,lost=false;
  const light=mat.multiply(mat.ortho(-9,9,-7,10,.1,35),mat.lookAt([-9,14,10],[0,1,0]));
  function geometry(p) {
    const objects=[];
    const add=(x,y,z,w,h,d,color,angle=0,ground=0,emission=0)=>objects.push({model:mat.model(x,y,z,w,h,d,angle),color,ground,emission});
    add(0,-1.2,0,50,.12,50,[.022,.021,.028],0,1);
    add(0,-.97,0,6.5,.32,5.1,colors.metal);
    add(0,-.77,0,5.8,.10,4.5,colors.stone);
    for(let level=0;level<4;level++){
      const y=-.3+level*(.82+p*.52),x=(level%2 ? .32:-.32)*(1+p*.4),z=level%2?.15:-.15;
      const color=level===2?colors.wine:colors.chalk;
      const w=4.9-level*.26,d=3.8-level*.22;
      add(x,y,z-d/2+.32,w,.15,.64,color);
      add(x,y,z+d/2-.32,w,.15,.64,color);
      add(x-w/2+.32,y,z,.64,.15,d-1.28,color);
      add(x+w/2-.32,y,z,.64,.15,d-1.28,color);
      if(level<3){
        const height=.82+p*.52;
        for(const sx of [-1,1])for(const sz of [-1,1])add(x+sx*(w/2-.32),y+height/2,z+sz*(d/2-.32),.085,height,.085,colors.metal);
      }
      add(x,y+.09,z-d/2+.12,w-.45,.023,.035,colors.light,0,0,1.5);
      if(level%2===0)add(x,y+.13,z,3.8,.085,.48,colors.stone,level===0?-.15:.18);
    }
    // A suspended bridge, screen and repeated stair treads give readable depth.
    add(.2,1.12+p*.5,0,1.3,.09,4.9,colors.wine,.32);
    for(let i=0;i<13;i++)add(-2.65+i*.16,-.6+i*.105,-1.65,.28,.08,.82,colors.stone);
    for(let i=0;i<10;i++)add(2.48, .6+p*.6, -1.65+i*.34,.045,2.7,.045,colors.metal);
    add(2.48,1.97+p*.6,-.12,.07,.055,3.35,colors.light,0,0,1.2);
    add(-2.68,.82+p*.65,.25,.09,3.1,3.25,colors.wine);
    add(-2.61,2.40+p*.65,.25,.035,.035,3.3,colors.light,0,0,1.2);
    return objects;
  }
  function bind(p) {
    gl.useProgram(p.p);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.enableVertexAttribArray(p.position);gl.vertexAttribPointer(p.position,3,gl.FLOAT,false,24,0);
    if(p.normal>=0){gl.enableVertexAttribArray(p.normal);gl.vertexAttribPointer(p.normal,3,gl.FLOAT,false,24,12);}
    gl.uniformMatrix4fv(p.light,false,light);
  }
  function draw(time=0) {
    frame=0;if(lost||!visible||document.hidden)return;
    const off=root.dataset.motion==='off'||reduced.matches;
    if(!off&&time-lastTime<32){frame=requestAnimationFrame(draw);return;}
    lastTime=time;
    progress=off?0:progress+(targetProgress-progress)*.085;
    const rect=host.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,innerWidth<700?1.5:2);
    const width=Math.max(1,Math.round(rect.width*dpr)),height=Math.max(1,Math.round(rect.height*dpr));
    if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}
    const angle=.78+orbit+progress*1.55+(off?0:Math.sin(time*.00013)*.045);
    const narrow=rect.width/rect.height<.85;
    const radius=narrow?12.8:10.2;
    const eye=[Math.sin(angle)*radius,5.3+progress*2.4,Math.cos(angle)*radius];
    const view=mat.multiply(mat.perspective(.64,width/height,.1,80),mat.lookAt(eye,[0,.7+progress*.8,0]));
    const objects=geometry(progress);
    gl.bindFramebuffer(gl.FRAMEBUFFER,shadowBuffer);gl.viewport(0,0,1024,1024);gl.clearColor(1,1,1,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);bind(depth);
    for(const object of objects){gl.uniformMatrix4fv(depth.model,false,object.model);gl.drawArrays(gl.TRIANGLES,0,36);}
    gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.viewport(0,0,width,height);gl.clearColor(.055,.049,.064,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);bind(main);
    gl.uniformMatrix4fv(main.view,false,view);gl.uniform3fv(main.eye,eye);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,shadowTexture);gl.uniform1i(main.shadow,0);
    for(const object of objects){gl.uniformMatrix4fv(main.model,false,object.model);gl.uniform3fv(main.color,object.color);gl.uniform1f(main.ground,object.ground);gl.uniform1f(main.emission,object.emission);gl.drawArrays(gl.TRIANGLES,0,36);}
    root.style.setProperty('--journey',progress.toFixed(4));
    if(!off)frame=requestAnimationFrame(draw);
  }
  function requestDraw(){if(!frame&&!lost&&visible&&!document.hidden)frame=requestAnimationFrame(draw);}
  function scroll(){const rect=hero.getBoundingClientRect(),sceneRect=host.getBoundingClientRect();targetProgress=Math.max(0,Math.min(1,innerWidth>1100?-rect.top/Math.max(1,hero.offsetHeight-innerHeight):(innerHeight-sceneRect.top)/(innerHeight+sceneRect.height)));requestDraw();}
  window.addEventListener('scroll',scroll,{passive:true});window.addEventListener('resize',scroll,{passive:true});
  document.addEventListener('visibilitychange',requestDraw);
  canvas.addEventListener('pointerdown',event=>{if(event.button!==0)return;dragging=true;lastX=event.clientX;canvas.setPointerCapture(event.pointerId);canvas.classList.add('is-dragging');});
  canvas.addEventListener('pointermove',event=>{if(!dragging)return;orbit+=(event.clientX-lastX)*.008;lastX=event.clientX;requestDraw();});
  const end=()=>{dragging=false;canvas.classList.remove('is-dragging');};
  canvas.addEventListener('pointerup',end);canvas.addEventListener('pointercancel',end);canvas.addEventListener('lostpointercapture',end);
  toolbar.querySelectorAll('[data-orbit]').forEach(button=>button.addEventListener('click',()=>{orbit=button.dataset.orbit==='reset'?0:orbit+Number(button.dataset.orbit)*.35;requestDraw();}));
  new MutationObserver(requestDraw).observe(root,{attributes:true,attributeFilter:['data-motion']});
  reduced.addEventListener('change',requestDraw);
  if('IntersectionObserver'in window)new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)requestDraw();else if(frame){cancelAnimationFrame(frame);frame=0;}},{rootMargin:'120px'}).observe(host);
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();lost=true;if(frame)cancelAnimationFrame(frame);host.classList.remove('webgl-ready');canvas.remove();toolbar.remove();tag.remove();});
  scroll();
})();
