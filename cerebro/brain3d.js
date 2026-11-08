/* Visor WebGL sin dependencias externas para la malla real aportada en Cerebro.glb.
   Mantiene exactamente los vértices, las UV y las texturas del GLB original.
   Efectos TDAH: representaciones didácticas, NO simulación clínica ni mapa neuronal real.
*/
(()=>{
  'use strict';
  const root=document.getElementById('brain3d-view');
  const canvas=document.getElementById('brain3d-canvas');
  const info=document.getElementById('brain3d-info');
  const fall=document.getElementById('brain3d-fallback');
  const spinBtn=document.getElementById('brain3d-spin');
  const resetBtn=document.getElementById('brain3d-reset');
  const focusButtons=[...document.querySelectorAll('[data-brain-focus]')];
  if(!root || !canvas)return;
  const disclaimer='Modelo anatómico aportado; los resaltados y redes son ilustraciones didácticas, no datos diagnósticos.';
  const setMessage=txt=>{ const warning=/No se pudo|Falta |No se dispone|Se ha interrumpido|No se encontró/i.test(String(txt)); info.textContent=warning?txt:disclaimer; };
  const fail=(msg)=>{console.warn('Cerebro anatómico GLB:',msg);canvas.style.display='none';fall.hidden=false;setMessage('No se pudo cargar el modelo 3D. '+msg);};
  const source=window.TDAH_REAL_BRAIN;
  if(!source){fail('Falta brain_model_data.js.');return;}
  let gl;
  try{gl=canvas.getContext('webgl',{alpha:true,antialias:true,depth:true,premultipliedAlpha:false})||canvas.getContext('experimental-webgl');}catch(e){}

  // Modo alternativo interactivo: fotogramas del mismo GLB renderizados localmente.
  // No necesita GPU y permite girar, ampliar y activar los efectos didácticos.
  function start2D(target=canvas){
    const ctx=target.getContext('2d');
    if(!ctx){fail('No se dispone de un contexto gráfico para la vista alternativa.');return;}
    const sheet=new Image();
    let ready=false,mode=0,angle=.72,zoom=1.28,spin=true,drag=false,lastPointer=0,clock=0;
    let raf=0,going=false,prev=0;
    const order=['','dopamina','prefrontal','conectividad'];
    const texts=[
      'Vista alternativa interactiva del mismo cerebro 3D · arrastra para girar.',
      'Dopamina · Partículas simbólicas, no valores medidos.',
      'Corteza prefrontal · Vista anatómica natural, sin coloreado.',
      'Conectividad · Enlaces ilustrativos, no un mapa real de conexiones.'
    ];
    function say(s){setMessage(s);}
    function setFocus(n){mode=Math.max(0,Math.min(3,Number(n)||0));
      focusButtons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.brainFocus===order[mode])));
      say(texts[mode]);
      // Cambiar de efecto no altera el giro ni la orientacion.
    }
    function setSpin(on){spin=on;spinBtn.setAttribute('aria-pressed',String(on));
      spinBtn.innerHTML=on?'Ⅱ <span>PAUSAR GIRO</span>':'↻ <span>REANUDAR GIRO</span>';}
    function reset(){angle=.72;zoom=1.28;setFocus(0);}
    sheet.onload=()=>{ready=true;say(texts[0]);};
    sheet.onerror=()=>{ready=false;fail('No se encontró assets/cerebro_turntable.webp.');};
    sheet.src='assets/cerebro_turntable.webp';
    spinBtn.addEventListener('click',()=>setSpin(!spin));resetBtn.addEventListener('click',reset);
    focusButtons.forEach((b,i)=>b.addEventListener('click',()=>setFocus(mode===i+1?0:i+1)));
    document.addEventListener('tdah:brainkey',e=>setFocus(e.detail.key));
    target.addEventListener('pointerdown',e=>{drag=true;lastPointer=e.clientX;target.setPointerCapture(e.pointerId);});
    target.addEventListener('pointermove',e=>{if(!drag)return;angle+=(e.clientX-lastPointer)*.013;lastPointer=e.clientX;});
    target.addEventListener('pointerup',()=>{drag=false;});
    target.addEventListener('pointercancel',()=>{drag=false;});
    target.addEventListener('wheel',e=>{e.preventDefault();zoom=Math.max(.7,Math.min(1.8,zoom-Math.sign(e.deltaY)*.1));},{passive:false});
    target.addEventListener('dblclick',reset);
    function paint(t){
      const ratio=Math.min(window.devicePixelRatio||1,2);
      const w=Math.max(2,Math.round(target.clientWidth*ratio)),h=Math.max(2,Math.round(target.clientHeight*ratio));
      if(target.width!==w||target.height!==h){target.width=w;target.height=h;}
      ctx.clearRect(0,0,w,h);
      if(!ready)return;
      const count=32,cols=8,fw=480,fh=246;
      const ix=((Math.round(((angle%(2*Math.PI)+2*Math.PI)%(2*Math.PI))/(2*Math.PI)*count))%count);
      const dw=w*zoom,dh=h*zoom;
      // Siempre mostrar el cerebro con su textura original, incluso al elegir la tarjeta 02.
      const img=sheet;
      ctx.drawImage(img,(ix%cols)*fw,Math.floor(ix/cols)*fh,fw,fh,(w-dw)/2,(h-dh)/2,dw,dh);
      ctx.save();ctx.lineWidth=Math.max(2,w/300);
      // Refuerzo visual de partículas y conexiones del modo 2D alternativo.
      if(mode===1||mode===3){
        const marks=Array.from({length:23},(_,i)=>[w*(.34+.32*((Math.sin(i*2.36)+1)/2)),h*(.20+.58*((Math.cos(i*2.9)+1)/2))]);
        if(mode===3){
          ctx.strokeStyle='rgba(8,190,166,.74)';
          marks.forEach((a,i)=>{const b=marks[(i*7+3)%marks.length];ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.stroke();});
        }
        marks.forEach((q,i)=>{
          const cy=q[1]+(mode===1?4*Math.sin(t*2+i):0);
          const radius=mode===1?5+1.5*Math.sin(t*3+i):4.4;
          const glow=ctx.createRadialGradient(q[0],cy,0,q[0],cy,radius*2.6);
          if(mode===1){glow.addColorStop(0,'rgba(255,247,164,.98)');glow.addColorStop(.25,'rgba(255,178,29,.84)');}
          else{glow.addColorStop(0,'rgba(217,255,250,.98)');glow.addColorStop(.25,'rgba(4,199,174,.88)');}
          glow.addColorStop(1,'rgba(0,0,0,0)');
          ctx.fillStyle=glow;ctx.beginPath();ctx.arc(q[0],cy,radius*2.6,0,Math.PI*2);ctx.fill();
        });
      }
      ctx.restore();
    }
    function tick(ms){if(!going)return;const dt=Math.min(.07,(ms-prev)/1000||.016);prev=ms;clock=ms/1000;
      if(spin)angle+=dt*.10;
      paint(clock);raf=requestAnimationFrame(tick);}
    function watch(){const active=Boolean(root.closest('.slide')?.classList.contains('is-active'))&&!document.hidden;
      if(active&&!going){going=true;prev=performance.now();raf=requestAnimationFrame(tick);}
      if(!active&&going){going=false;cancelAnimationFrame(raf);}}
    document.addEventListener('tdah:slidechange',watch);document.addEventListener('visibilitychange',watch);
    say('Cargando el cerebro anatómico (vista alternativa)…');watch();
  }

  if(!gl){start2D();return;}

  const decode=(value,Type)=>{
    const binary=atob(value),bytes=new Uint8Array(binary.length);
    for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
    return new Type(bytes.buffer);
  };
  let pos,nor,uv,idx;
  try{
    pos=decode(source.positions,Float32Array);
    nor=decode(source.normals,Float32Array);
    uv=decode(source.uvs,Float32Array);
    idx=decode(source.indices,Uint16Array);
    if(pos.length!==source.vertexCount*3 || uv.length!==source.vertexCount*2 || idx.length!==source.indexCount)throw Error('Malla 3D incompleta');
  }catch(e){fail(e.message);return;}

  const vertexSrc=`precision highp float;
    attribute vec3 aP;attribute vec3 aN;attribute vec2 aUV;
    uniform mat4 uMVP;uniform mat4 uModel;
    varying vec3 vN;varying vec2 vUV;
    void main(){vN=mat3(uModel)*aN;vUV=aUV;gl_Position=uMVP*vec4(aP,1.);}`;
  const fragmentSrc=`precision highp float;
    varying vec3 vN;varying vec2 vUV;
    // Las cuatro texturas del GLB: diffuse, specularGlossiness, baseColor y metallicRoughness.
    uniform sampler2D uDiffuse;uniform sampler2D uSpecGloss;
    uniform sampler2D uBaseColor;uniform sampler2D uMetalRoughness;
    uniform float uFocus;
    void main(){
      vec4 diffuse=texture2D(uDiffuse,vUV);
      vec4 pbr=texture2D(uBaseColor,vUV);
      vec4 specGloss=texture2D(uSpecGloss,vUV);
      vec4 metalRough=texture2D(uMetalRoughness,vUV);
      float opacity=min(diffuse.a,pbr.a);
      if(opacity<.4)discard;
      // Preservar la textura de color fotografiada y el material del GLB.
      vec3 albedo=mix(diffuse.rgb,pbr.rgb,.15);
      vec3 N=normalize(vN);
      float key=max(dot(N,normalize(vec3(-.30,.72,1.0))),0.);
      float fill=max(dot(N,normalize(vec3(.85,.28,-.50))),0.);
      float roughness=clamp(metalRough.g,.12,1.);
      float gloss=clamp(specGloss.a,0.,1.);
      float highlight=pow(max(dot(N,normalize(vec3(-.3,.77,.9))),0.), mix(29.,11.,roughness));
      vec3 base=albedo*(.79+.29*key+.12*fill)+vec3(1.,.92,.85)*highlight*(.04+.10*gloss);
      // La tarjeta 02 conserva su información, sin aplicar ningún coloreado al cerebro.
      if(uFocus>.5 && uFocus<1.5)base=mix(base,base*vec3(1.04,.98,.87),.13);
      if(uFocus>2.5)base=mix(base,vec3(.43,.75,.70),.052);
      gl_FragColor=vec4(base,opacity);
    }`;
  const overlayVS=`precision mediump float;
    attribute vec3 aP;attribute float aPhase;
    uniform mat4 uMVP;uniform float uClock;uniform float uFocus;
    varying float vPhase;
    void main(){
      float drift=.045*sin(uClock*2.1+aPhase*6.28);
      vec3 p=aP+vec3(0.,(uFocus<1.5?drift:0.),0.);
      gl_Position=uMVP*vec4(p,1.);
      float beat=.5+.5*sin(uClock*2.5+aPhase*6.28);
      gl_PointSize=(uFocus<1.5?15.:12.)+(uFocus<1.5?9.:7.)*beat;
      vPhase=aPhase;
    }`;
  const overlayFS=`precision mediump float;
    uniform float uFocus;uniform float uClock;varying float vPhase;
    void main(){
      float d=length(gl_PointCoord-.5)*2.;
      float halo=1.-smoothstep(.12,1.,d);
      float core=1.-smoothstep(.0,.42,d);
      float pulse=.85+.15*sin(uClock*2.7+vPhase*6.28);
      vec3 col=uFocus<1.5?vec3(1.,.67,.08):vec3(.03,.85,.76);
      vec3 bright=uFocus<1.5?vec3(1.,.95,.50):vec3(.76,1.,.94);
      gl_FragColor=vec4(mix(col,bright,core*.87),clamp((halo*.53+core*.48)*pulse,0.,1.));
    }`;
  const lineVS=`precision mediump float;
    attribute vec3 aP;uniform mat4 uMVP;varying vec3 vLineP;
    void main(){vLineP=aP;gl_Position=uMVP*vec4(aP,1.);}`;
  const lineFS=`precision mediump float;
    uniform float uClock;varying vec3 vLineP;
    void main(){
      float pulse=.5+.5*sin(uClock*3.2+dot(vLineP,vec3(11.,8.,6.)));
      gl_FragColor=vec4(.02,.77,.67,.55+.33*pulse);
    }`;
  const compile=(type,src)=>{const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;};
  const makeProgram=(vs,fs)=>{const p=gl.createProgram();gl.attachShader(p,compile(gl.VERTEX_SHADER,vs));gl.attachShader(p,compile(gl.FRAGMENT_SHADER,fs));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));return p;};
  let brainProgram,pointProgram,lineProgram;
  try{brainProgram=makeProgram(vertexSrc,fragmentSrc);pointProgram=makeProgram(overlayVS,overlayFS);lineProgram=makeProgram(lineVS,lineFS);}catch(e){console.warn('Fallo WebGL: ',e.message);const alt=document.createElement('canvas');alt.id=canvas.id;alt.width=canvas.width;alt.height=canvas.height;alt.setAttribute('aria-label',canvas.getAttribute('aria-label'));canvas.replaceWith(alt);start2D(alt);return;}
  const upload=(type,array)=>{const b=gl.createBuffer();gl.bindBuffer(type,b);gl.bufferData(type,array,gl.STATIC_DRAW);return b;};
  const mesh={p:upload(gl.ARRAY_BUFFER,pos),n:upload(gl.ARRAY_BUFFER,nor),uv:upload(gl.ARRAY_BUFFER,uv),idx:upload(gl.ELEMENT_ARRAY_BUFFER,idx),len:idx.length};

  // Nodos y aristas de ejemplo ubicados sobre la superficie del modelo aportado.
  // No pretenden reproducir un conectoma ni una distribución real de dopamina.
  const cloud=[],phases=[],connections=[];
  let seed=1367;const rand=()=>((seed=(1664525*seed+1013904223)>>>0)/4294967296);
  const selected=[];
  for(let i=0;i<85;i++){
    const index=Math.floor(rand()*source.vertexCount)*3;
    let p=[pos[index],pos[index+1],pos[index+2]];
    const norm=Math.hypot(...p)||1;
    p=p.map(x=>x*1.025);
    selected.push(p);cloud.push(...p);phases.push(rand());
  }
  for(let i=0;i<selected.length;i++){
    const a=selected[i];const ordered=selected.map((b,j)=>({j,d:Math.hypot(...a.map((v,k)=>v-b[k]))})).filter(t=>t.j!==i).sort((x,y)=>x.d-y.d);
    for(let j=0;j<2;j++)if(ordered[j].j>i){connections.push(...a,...selected[ordered[j].j]);}
  }
  const dots={p:upload(gl.ARRAY_BUFFER,new Float32Array(cloud)),phase:upload(gl.ARRAY_BUFFER,new Float32Array(phases)),count:phases.length};
  const wires={p:upload(gl.ARRAY_BUFFER,new Float32Array(connections)),count:connections.length/3};

  const ident=()=>new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);
  const mul=(a,b)=>{const o=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++)for(let k=0;k<4;k++)o[c*4+r]+=a[k*4+r]*b[c*4+k];return o;};
  const ry=a=>new Float32Array([Math.cos(a),0,-Math.sin(a),0,0,1,0,0,Math.sin(a),0,Math.cos(a),0,0,0,0,1]);
  const rx=a=>new Float32Array([1,0,0,0,0,Math.cos(a),Math.sin(a),0,0,-Math.sin(a),Math.cos(a),0,0,0,0,1]);
  const trans=(x,y,z)=>{const m=ident();m[12]=x;m[13]=y;m[14]=z;return m;};
  const perspective=(fov,aspect,near,far)=>{const f=1/Math.tan(fov/2),d=1/(near-far);return new Float32Array([f/aspect,0,0,0,0,f,0,0,0,0,(far+near)*d,-1,0,0,2*far*near*d,0]);};
  const bind=(prg,attr,b,components)=>{const a=gl.getAttribLocation(prg,attr);if(a<0)return;gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,components,gl.FLOAT,false,0,0);};

  let angle=.72,pitch=-.12,dist=2.95,turning=true,drag=false,mouse={x:0,y:0},focus=0;
  let running=false,raf=0,prev=0;
  // Los materiales vienen del Cerebro.glb original; no se crean texturas ficticias.
  const materialMaps=['diffuse','specGloss','baseColor','metalRoughness'];
  const embeddedTextures=window.TDAH_BRAIN_TEXTURES;
  let fallbackActive=false;
  const activateFallback=(reason)=>{
    if(fallbackActive)return;fallbackActive=true;
    console.warn('Cerebro 3D: se activa el visor alternativo con texturas:',reason);
    running=false;if(raf)cancelAnimationFrame(raf);
    const alt=document.createElement('canvas');
    alt.id=canvas.id;alt.width=canvas.width;alt.height=canvas.height;
    alt.setAttribute('aria-label',canvas.getAttribute('aria-label'));
    canvas.replaceWith(alt);start2D(alt);
  };
  if(!Array.isArray(embeddedTextures)||embeddedTextures.length!==4){
    activateFallback('No se encontró brain_texture_data.js');return;
  }
  const texs=[];
  let texturesLoaded=0;
  for(let i=0;i<materialMaps.length;i++){
    const tx=gl.createTexture();texs.push(tx);
    gl.activeTexture(gl.TEXTURE0+i);gl.bindTexture(gl.TEXTURE_2D,tx);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array(i===0||i===2?[220,177,163,255]:[255,255,255,255]));
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    const image=new Image();
    image.onload=()=>{
      if(fallbackActive)return;
      try{
        gl.activeTexture(gl.TEXTURE0+i);gl.bindTexture(gl.TEXTURE_2D,tx);
        // Imágenes en la orientación que coincide con las UV del GLB.
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
        gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);
        if((image.width&(image.width-1))===0&&(image.height&(image.height-1))===0){
          gl.generateMipmap(gl.TEXTURE_2D);
          gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);
        }
        const err=gl.getError();
        if(err!==gl.NO_ERROR)throw Error('WebGL texImage2D: error '+err);
        texturesLoaded++;
        if(texturesLoaded===4){
          setMessage('Modelo anatómico 3D · Arrastra para girar o pulsa las tarjetas para explorar.');
          console.info('Cerebro 3D: materiales cargados 4/4 desde datos locales integrados.');
        }
      }catch(e){activateFallback('Error al aplicar textura '+(i+1)+': '+e.message);}
    };
    image.onerror=()=>activateFallback('No se pudo decodificar la textura '+(i+1));
    image.src=embeddedTextures[i];
  }

  const desc=[
    'Modelo anatómico original cargado. Arrastra para girar o selecciona un concepto.',
    'Dopamina · Partículas doradas simbólicas: no indican niveles reales en este cerebro.',
    'Corteza prefrontal · Vista anatómica natural, sin coloreado.',
    'Conectividad · Líneas y nodos didácticos; no son conexiones neuronales medidas.'
  ];
  function setFocus(n){
    focus=Math.max(0,Math.min(3,Number(n)||0));
    const names=['','dopamina','prefrontal','conectividad'];
    for(const b of focusButtons)b.setAttribute('aria-pressed',String(b.dataset.brainFocus===names[focus]));
    setMessage(desc[focus]);
    if(fallbackActive)return;
    // Seleccionar una región no pausa ni reposiciona el cerebro.
  }
  function setSpin(value){turning=value;spinBtn.setAttribute('aria-pressed',String(value));spinBtn.innerHTML=value?'Ⅱ <span>PAUSAR GIRO</span>':'↻ <span>REANUDAR GIRO</span>';}
  const reset=()=>{angle=.72;pitch=-.12;dist=2.95;setFocus(0);};
  spinBtn.addEventListener('click',()=>setSpin(!turning));resetBtn.addEventListener('click',reset);
  focusButtons.forEach((b,i)=>b.addEventListener('click',()=>setFocus(focus===i+1?0:i+1)));
  document.addEventListener('tdah:brainkey',e=>setFocus(Number(e.detail.key)));
  canvas.addEventListener('pointerdown',e=>{drag=true;mouse={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);});
  canvas.addEventListener('pointermove',e=>{if(!drag)return;angle+=(e.clientX-mouse.x)*.009;pitch=Math.max(-1.28,Math.min(1.28,pitch+(e.clientY-mouse.y)*.009));mouse={x:e.clientX,y:e.clientY};});
  canvas.addEventListener('pointerup',()=>{drag=false;});canvas.addEventListener('pointercancel',()=>{drag=false;});
  canvas.addEventListener('wheel',e=>{e.preventDefault();dist=Math.max(2.65,Math.min(6.6,dist+Math.sign(e.deltaY)*.25));},{passive:false});
  canvas.addEventListener('dblclick',e=>{e.preventDefault();reset();});
  function draw(t){
    if(fallbackActive)return;
    const ratio=Math.min(window.devicePixelRatio||1,2);
    const w=Math.max(2,Math.round(canvas.clientWidth*ratio)),h=Math.max(2,Math.round(canvas.clientHeight*ratio));
    if(w!==canvas.width||h!==canvas.height){canvas.width=w;canvas.height=h;}
    gl.viewport(0,0,w,h);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.disable(gl.CULL_FACE);
    const model=mul(ry(angle),rx(pitch)),p=perspective(Math.PI/4.2,w/h,.1,60),mvp=mul(mul(p,trans(0,0,-dist)),model);
    gl.useProgram(brainProgram);
    bind(brainProgram,'aP',mesh.p,3);bind(brainProgram,'aN',mesh.n,3);bind(brainProgram,'aUV',mesh.uv,2);
    gl.uniformMatrix4fv(gl.getUniformLocation(brainProgram,'uMVP'),false,mvp);
    gl.uniformMatrix4fv(gl.getUniformLocation(brainProgram,'uModel'),false,model);
    gl.uniform1f(gl.getUniformLocation(brainProgram,'uFocus'),focus);
    const samplerNames=['uDiffuse','uSpecGloss','uBaseColor','uMetalRoughness'];
    for(let i=0;i<4;i++){
      gl.activeTexture(gl.TEXTURE0+i);gl.bindTexture(gl.TEXTURE_2D,texs[i]);
      gl.uniform1i(gl.getUniformLocation(brainProgram,samplerNames[i]),i);
    }
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,mesh.idx);gl.drawElements(gl.TRIANGLES,mesh.len,gl.UNSIGNED_SHORT,0);
    if(focus!==1 && focus!==3)return;
    gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
    // El trazado ilustrativo flota sobre el modelo; no son tractos anatómicos.
    gl.disable(gl.DEPTH_TEST);
    if(focus===3){
      gl.useProgram(lineProgram);bind(lineProgram,'aP',wires.p,3);
      gl.uniformMatrix4fv(gl.getUniformLocation(lineProgram,'uMVP'),false,mvp);
      gl.uniform1f(gl.getUniformLocation(lineProgram,'uClock'),t);
      gl.drawArrays(gl.LINES,0,wires.count);
    }
    gl.useProgram(pointProgram);bind(pointProgram,'aP',dots.p,3);bind(pointProgram,'aPhase',dots.phase,1);
    gl.uniformMatrix4fv(gl.getUniformLocation(pointProgram,'uMVP'),false,mvp);
    gl.uniform1f(gl.getUniformLocation(pointProgram,'uClock'),t);
    gl.uniform1f(gl.getUniformLocation(pointProgram,'uFocus'),focus);
    gl.drawArrays(gl.POINTS,0,dots.count);gl.disable(gl.BLEND);
  }
  function tick(ms){
    if(!running||fallbackActive)return;
    const dt=Math.min(.055,(ms-prev)/1000||.016);prev=ms;
    if(turning)angle+=dt*.10;
    draw(ms/1000);
    raf=requestAnimationFrame(tick);
  }
  function watch(){
    const show=Boolean(root.closest('.slide')?.classList.contains('is-active'))&&!document.hidden;
    if(fallbackActive)return;
    if(show&&!running){running=true;prev=performance.now();raf=requestAnimationFrame(tick);}
    else if(!show&&running){running=false;cancelAnimationFrame(raf);}
  }
  document.addEventListener('tdah:slidechange',watch);document.addEventListener('visibilitychange',watch);
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();running=false;setMessage('Se ha interrumpido WebGL. Recarga la presentación para continuar.');});
  setMessage('Cargando modelo anatómico original…');watch();
})();
