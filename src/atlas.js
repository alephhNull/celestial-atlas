import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const $=id=>document.getElementById(id);
const signs=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const months=['MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC','JAN','FEB'];
const monthNames=['March','April','May','June','July','August','September','October','November','December','January','February'];
const nextMonth=['APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC','JAN','FEB','MAR'];
const endDays=[19,19,20,22,22,22,22,22,21,19,18,19];
const details=[
'On the March equinox, the Sun crosses the celestial equator. Earth is on the opposite side of the orbit.',
'As Earth advances, our view toward the Sun rotates toward the next 30° region of the sky.',
'From Earth, the Sun now appears against the Gemini sector of the distant celestial sphere.',
'Near the June solstice, Earth’s tilted axis gives the Northern Hemisphere its longest daylight.',
'Earth continues counterclockwise in the orbital view; the Sun appears to advance through Leo.',
'The solar direction is now projected through the Virgo sector of the ecliptic.',
'The September equinox marks the Sun crossing the celestial equator in the other direction.',
'The apparent solar position has moved halfway around the sky since March.',
'The Sun appears in Sagittarius; Earth is still the body moving around the Sun.',
'Near the December solstice, the Sun reaches its southernmost declination.',
'In this frame, the Sun appears in Aquarius while Earth occupies the opposite orbital direction.',
'By Pisces, Earth has nearly completed a revolution, restoring the same sky geometry.'
];
const DEG=Math.PI/180, TAU=2*Math.PI, OR=5.05, SR=12.25, FAR_R=135;
const stage=$('stage'), canvasRoot=$('atlas');
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
renderer.setSize(canvasRoot.clientWidth,canvasRoot.clientHeight);
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.22;
renderer.setClearColor(0x050a11,0);
renderer.domElement.style.touchAction='none';
stage.appendChild(renderer.domElement);
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(49,canvasRoot.clientWidth/canvasRoot.clientHeight,.02,600);
camera.position.set(12.0,11.5,18.7);
const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.055;controls.enablePan=false;controls.minDistance=8;controls.maxDistance=37;controls.maxPolarAngle=Math.PI-.16;controls.minPolarAngle=.13;controls.target.set(0,0,0);controls.update();
const orbitCamSaved=new THREE.Vector3(12,11.5,18.7);
const orbitFrame=new THREE.Group(), earthSkyFrame=new THREE.Group();scene.add(orbitFrame,earthSkyFrame);
const eclipticGroup=new THREE.Group(), guidesGroup=new THREE.Group();orbitFrame.add(eclipticGroup,guidesGroup);
const skyGuides=new THREE.Group();earthSkyFrame.add(skyGuides);
const glowCanvas=(inner,mid,outer)=>{let c=document.createElement('canvas');c.width=c.height=256;let ctx=c.getContext('2d');let g=ctx.createRadialGradient(128,128,2,128,128,128);g.addColorStop(0,inner);g.addColorStop(.13,mid);g.addColorStop(1,outer);ctx.fillStyle=g;ctx.fillRect(0,0,256,256);let t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t};
const sunGlow=glowCanvas('rgba(255,248,213,1)','rgba(240,163,77,.28)','rgba(240,122,45,0)');
const blueGlow=glowCanvas('rgba(179,235,255,.87)','rgba(78,160,203,.14)','rgba(20,60,100,0)');
const goldGlow=glowCanvas('rgba(255,235,175,.95)','rgba(255,189,94,.22)','rgba(255,170,60,0)');
function halo(tex,size,opacity=1){let sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,opacity,blending:THREE.AdditiveBlending,depthWrite:false}));sprite.scale.set(size,size,1);return sprite}
function circlePoints(r,y=0,segments=256){let ar=[];for(let i=0;i<=segments;i++){let a=i/segments*TAU;ar.push(new THREE.Vector3(r*Math.cos(a),y,r*Math.sin(a)))}return ar}
function line(points,color,opacity=.5,dashed=false){let g=new THREE.BufferGeometry().setFromPoints(points),m=dashed?new THREE.LineDashedMaterial({color,transparent:true,opacity,dashSize:.16,gapSize:.12,depthWrite:false}):new THREE.LineBasicMaterial({color,transparent:true,opacity,depthWrite:false});let obj=new THREE.Line(g,m);if(dashed)obj.computeLineDistances();return obj}
function ring(r,color,opacity=.5,linewidth=1){return line(circlePoints(r),color,opacity)}
function sectorArc(r,a0,a1,segments=40){let pts=[];for(let i=0;i<=segments;i++){let a=a0+(a1-a0)*i/segments;pts.push(new THREE.Vector3(Math.cos(a)*r,0,Math.sin(a)*r))}return pts}
function vecAt(r,a,latitude=0){return new THREE.Vector3(r*Math.cos(latitude)*Math.cos(a),r*Math.sin(latitude),r*Math.cos(latitude)*Math.sin(a))}
function spriteText(text,opt={}){let c=document.createElement('canvas');c.width=1024;c.height=160;let ctx=c.getContext('2d');let serif=opt.serif??true;ctx.font=(serif?'500 72px Georgia,serif':'700 50px Arial,sans-serif');ctx.fillStyle=opt.color||'#d4d6d6';ctx.textAlign='center';ctx.textBaseline='middle';ctx.shadowColor=opt.shadow||'rgba(0,0,0,.95)';ctx.shadowBlur=15;ctx.fillText(text,512,78);let t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;let s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthWrite:false,opacity:opt.opacity??.95}));let w=opt.width||2.4;s.scale.set(w,w*160/1024,1);return s}
function deterministic(seed){return function(){seed=(1664525*seed+1013904223)>>>0;return seed/4294967296}}
function stars(radius,n,seed,size,alpha,nearEquator=false){let rng=deterministic(seed),positions=[],colors=[];for(let i=0;i<n;i++){let az=rng()*TAU;let elevation=nearEquator?(rng()-.5)*.64:Math.asin(2*rng()-1);let r=radius+(rng()-.5)*.65;positions.push(r*Math.cos(elevation)*Math.cos(az),r*Math.sin(elevation),r*Math.cos(elevation)*Math.sin(az));let bright=.5+.5*Math.pow(rng(),6);let choice=rng();let col=choice<.11?[.94,.75,.52]:choice<.42?[.66,.84,.94]:[.81,.88,.98];colors.push(col[0]*bright,col[1]*bright,col[2]*bright)}let geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));return new THREE.Points(geo,new THREE.PointsMaterial({size,vertexColors:true,transparent:true,opacity:alpha,depthWrite:false,sizeAttenuation:true}))}
// A distant fixed star field appears in both perspectives.
scene.add(stars(192,2500,92701,1.45,.82),stars(165,1300,23811,.9,.47));
orbitFrame.add(stars(12.45,1400,7282,.055,.78),stars(12.47,590,73917,.095,.71,true));
earthSkyFrame.add(stars(137,2200,7282,.84,.71),stars(139,580,73917,1.13,.8,true));

// Conceptual celestial sphere (the firmament) and faint coordinate grid.
let dome=new THREE.Mesh(new THREE.SphereGeometry(SR,64,48),new THREE.MeshBasicMaterial({color:0x23506d,transparent:true,opacity:.029,side:THREE.BackSide,depthWrite:false}));orbitFrame.add(dome);
const sphereGrid=new THREE.Group();orbitFrame.add(sphereGrid);
for(let lat of [-60,-30,30,60]){let p=[];for(let i=0;i<=240;i++){let a=i/240*TAU;p.push(vecAt(SR, a,lat*DEG))}sphereGrid.add(line(p,0x47758b,.12))}
for(let lon=0;lon<360;lon+=30){let p=[];for(let i=0;i<=90;i++){let t=(-90+i*2)*DEG;p.push(vecAt(SR,lon*DEG,t))}sphereGrid.add(line(p,0x47758b,.11))}
const ecliptic=ring(SR,0xeac591,.76),faintEcliptic=ring(SR+.14,0xc69457,.16);eclipticGroup.add(ecliptic,faintEcliptic);
const farEcliptic=ring(FAR_R,0xd1ad73,.43);earthSkyFrame.add(farEcliptic);
const guideEquator=(r)=>{let p=circlePoints(r).map(v=>v.applyAxisAngle(new THREE.Vector3(1,0,0),23.44*DEG));return line(p,0x76aabb,.27)};
guidesGroup.add(guideEquator(SR-.10));skyGuides.add(guideEquator(FAR_R+.02));
const orbitRing=ring(OR,0x82c9d9,.68);orbitFrame.add(orbitRing,ring(OR+.065,0x6d91a9,.1));
const orbitLabel=spriteText('EARTH’S ORBIT',{serif:false,width:2.0,color:'#8ebcca',opacity:.75});orbitLabel.position.set(-.1,-.02,-OR-.51);orbitFrame.add(orbitLabel);
const firmamentLabel=spriteText('THE FIRMAMENT',{serif:false,width:3.15,color:'#91a8b8',opacity:.72});firmamentLabel.position.set(0,SR+1.2,0);orbitFrame.add(firmamentLabel);

// Zodiac patterns: simplified connected-star drawings, one per conventional sign sector.
const patterns=[
[[-.85,-.55],[-.4,.24],[.18,.05],[.76,.55]], // Aries
[[-.82,.69],[-.55,.18],[-.2,-.39],[.2,.04],[.7,.63],[-.2,-.39],[.67,-.72]], // Taurus
[[-.67,.74],[-.62,.16],[-.6,-.75],[.65,-.75],[.57,.05],[.6,.77],[-.67,.74],[.6,.77]], // Gemini
[[-.78,-.35],[-.12,.1],[.36,.6],[-.12,.1],[.73,-.42]], // Cancer
[[-.77,.6],[-.4,.88],[.12,.63],[.23,.13],[-.27,-.27],[-.42,-.8],[.49,-.61],[.75,-.15],[.23,.13]], // Leo
[[-.69,.62],[-.22,.31],[.34,.62],[.1,-.25],[.75,-.77],[.1,-.25],[-.46,-.58]], // Virgo
[[-.55,.59],[.48,.59],[.68,-.37],[-.38,-.52],[-.55,.59],[.48,.59],[-.38,-.52]], // Libra
[[-.81,.7],[-.49,.34],[-.17,.51],[.1,.12],[.2,-.34],[.43,-.73],[.74,-.67],[.83,-.23],[.49,-.12]], // Scorpio
[[-.74,.46],[-.3,.66],[.03,.33],[.48,.73],[.62,.2],[.12,.07],[.24,-.52],[-.5,-.55],[-.74,.46],[.12,.07]], // Sagittarius
[[-.76,.52],[-.39,-.07],[.12,-.77],[.56,-.25],[.75,.55],[.12,-.77]], // Capricorn
[[-.82,.16],[-.44,.53],[-.08,-.05],[.28,.43],[.73,-.21],[.42,-.76]], // Aquarius
[[-.81,.52],[-.47,.78],[-.23,.41],[-.51,.08],[-.81,.52],[-.23,.41],[.18,-.05],[.44,-.71],[.75,-.51],[.63,-.12],[.44,-.71]] // Pisces
];
const zodiacOrbit=[],zodiacFar=[];
const starGeoNear=new THREE.SphereGeometry(.052,8,8),starGeoFar=new THREE.SphereGeometry(.50,8,8); // shared by every constellation star
function makeZodiac(r,far=false){let groups=[];signs.forEach((name,i)=>{let g=new THREE.Group();let mid=(i+.5)*30*DEG;let starsOf=patterns[i].map(([x,y])=>vecAt(r,mid+x*14.0*DEG,y*8.2*DEG));
for(let k=0;k<starsOf.length-1;k++){let seg=line([starsOf[k],starsOf[k+1]],0x86bac9,far?.40:.56);g.add(seg)}
starsOf.forEach((p,j)=>{let star=new THREE.Mesh(far?starGeoFar:starGeoNear,new THREE.MeshBasicMaterial({color:j%3===0?0xf4d8ac:0xe0f4ff,transparent:true,opacity:.9}));star.position.copy(p);g.add(star);if(j%3===0){let h=halo(j%2?blueGlow:goldGlow,far?5.1:.53,.38);h.position.copy(p);g.add(h)}});
let label=spriteText(name.toUpperCase(),{serif:true,width:far?23:2.35,color:'#d8d9d7',opacity:.92});label.position.copy(vecAt(r+(far?0:1.05),mid,far?-12*DEG:-.14));g.add(label);let micro=spriteText(months[i]+' — '+nextMonth[i],{serif:false,width:far?14:1.42,color:'#92a7b2',opacity:.66});micro.position.copy(vecAt(r+(far?0:1.10),mid,far?-16*DEG:-.21));g.add(micro);groups.push(g);(far?earthSkyFrame:orbitFrame).add(g);
if(!far){let divider=line([vecAt(SR-.15,i*30*DEG),vecAt(SR+.22,i*30*DEG)],0xdeb984,.31);g.add(divider)}
});return groups}
zodiacOrbit.push(...makeZodiac(SR-.08,false));zodiacFar.push(...makeZodiac(FAR_R+.15,true));

function textureEarth(){let c=document.createElement('canvas');c.width=1024;c.height=512;let x=c.getContext('2d');let sea=x.createLinearGradient(0,0,0,512);sea.addColorStop(0,'#377f9e');sea.addColorStop(.4,'#134668');sea.addColorStop(1,'#1c607c');x.fillStyle=sea;x.fillRect(0,0,1024,512);const polygons=[[[.05,.27],[.15,.2],[.25,.23],[.28,.31],[.22,.39],[.23,.49],[.16,.46],[.13,.39],[.07,.38]],[[.22,.52],[.29,.56],[.34,.67],[.3,.84],[.26,.96],[.22,.83],[.19,.68]],[[.44,.23],[.49,.2],[.56,.29],[.58,.43],[.55,.57],[.49,.62],[.46,.51]],[[.55,.18],[.69,.14],[.83,.19],[.92,.32],[.85,.42],[.75,.36],[.69,.51],[.65,.55],[.61,.38],[.55,.35]],[[.77,.66],[.86,.62],[.9,.75],[.85,.84],[.79,.8]],[[.13,.93],[.23,.91],[.43,.95],[.69,.91],[.86,.93],[.92,.98],[.05,.99]]];polygons.forEach((p,i)=>{x.beginPath();p.forEach(([a,b],j)=>j?x.lineTo(a*1024,b*512):x.moveTo(a*1024,b*512));x.closePath();x.fillStyle=i%2?'#759c76':'#719a82';x.fill();x.strokeStyle='rgba(223,213,160,.23)';x.lineWidth=4;x.stroke()});let r=deterministic(3819);for(let j=0;j<150;j++){let xx=r()*1024,yy=r()*512;x.fillStyle=`rgba(242,248,248,${r()*.14})`;x.fillRect(xx,yy,20+r()*95,1+r()*6)}let t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t}
const sun=new THREE.Group();orbitFrame.add(sun);let sunCore=new THREE.Mesh(new THREE.SphereGeometry(.68,48,32),new THREE.MeshBasicMaterial({color:0xffe5ae}));sun.add(sunCore);sun.add(halo(sunGlow,5.4,.72),halo(sunGlow,3.2,.82),halo(sunGlow,1.9,1));sun.add(new THREE.PointLight(0xffdfad,18,24,1.5));
// Shared solar physical position: orbiting Earth changes the observed solar direction.
const earth=new THREE.Group();orbitFrame.add(earth);const earthAxis=new THREE.Group();earthAxis.rotation.z=23.44*DEG;earth.add(earthAxis);let earthMesh=new THREE.Mesh(new THREE.SphereGeometry(.34,32,24),new THREE.MeshPhongMaterial({map:textureEarth(),shininess:38,specular:0x80a1bb}));earthAxis.add(earthMesh);earth.add(halo(blueGlow,1.42,.8));let earthAtmos=new THREE.Mesh(new THREE.SphereGeometry(.362,32,24),new THREE.MeshBasicMaterial({color:0x6ec1ef,transparent:true,opacity:.07,depthWrite:false}));earthAxis.add(earthAtmos);scene.add(new THREE.AmbientLight(0x8db9cf,.7));
const earthLabel=spriteText('EARTH',{serif:false,width:1.32,color:'#e0f4fa'});orbitFrame.add(earthLabel);
const ghostEarth=[];for(let m of [0,3,6,9]){let a=(m*30+180)*DEG;let pos=new THREE.Vector3(OR*Math.cos(a),0,OR*Math.sin(a));let g=new THREE.Mesh(new THREE.SphereGeometry(.105,12,10),new THREE.MeshBasicMaterial({color:0x76b7c9,transparent:true,opacity:.46}));g.position.copy(pos);orbitFrame.add(g);ghostEarth.push(g)}
const rayToSun=line([new THREE.Vector3(),new THREE.Vector3()],0xe5c590,.81);orbitFrame.add(rayToSun);
const rayOut=line([new THREE.Vector3(),new THREE.Vector3()],0xcda976,.69,true);orbitFrame.add(rayOut);
const endpointHalo=halo(goldGlow,1.6,.9);orbitFrame.add(endpointHalo);
const endpointCore=new THREE.Mesh(new THREE.SphereGeometry(.065,16,12),new THREE.MeshBasicMaterial({color:0xffe1aa}));orbitFrame.add(endpointCore);
const farSunMarker=halo(goldGlow,11,.65);earthSkyFrame.add(farSunMarker);
const farSunDisk=new THREE.Mesh(new THREE.SphereGeometry(1.05,32,24),new THREE.MeshBasicMaterial({color:0xffe4b0}));earthSkyFrame.add(farSunDisk);
const farSunRim=halo(sunGlow,4.4,.9);earthSkyFrame.add(farSunRim);
const farSunLabel=spriteText('SUN',{serif:false,width:9.8,color:'#ebc48f',opacity:.96});earthSkyFrame.add(farSunLabel);
const highlightOrbit=line(sectorArc(SR,(0)*DEG,(30)*DEG,80),0xffdc9e,.97);orbitFrame.add(highlightOrbit);
const highlightSky=line(sectorArc(FAR_R,0,30*DEG,60),0xffd59a,.9);earthSkyFrame.add(highlightSky);
function updateLine(ln,a,b){let attr=ln.geometry.attributes.position;attr.setXYZ(0,a.x,a.y,a.z);attr.setXYZ(1,b.x,b.y,b.z);attr.needsUpdate=true;ln.geometry.computeBoundingSphere();if(ln.material.isLineDashedMaterial)ln.computeLineDistances()}
function updateArc(ln,r,startAngle,span,count){let a=ln.geometry.attributes.position;for(let i=0;i<=count;i++){let p=vecAt(r,startAngle+i/count*span);a.setXYZ(i,p.x,p.y,p.z)}a.needsUpdate=true;ln.geometry.computeBoundingSphere()}
const eclipticLatitude=0;
let progress=0,mode='orbit',playing=false,guides=true,tracking=true,lockedYaw=0,lockedPitch=0,yawDelta=0,orbitCameraRestore=orbitCamSaved.clone();let lastTime=performance.now(),transition=null,tgSync=()=>{};
function frameLayout(){let w=canvasRoot.clientWidth,h=canvasRoot.clientHeight;let scale=Math.max(0,Math.min(1,(w-570)/830));if(mode==='orbit'){controls.target.set(w<700?0:1.15,0,0);controls.update()}camera.fov=w<550?57:49;camera.updateProjectionMatrix()}
frameLayout();
const monthButtons=[];months.forEach((m,i)=>{let b=document.createElement('button');b.className='month';b.textContent=m;b.setAttribute('aria-label',monthNames[i]);b.onclick=()=>{setProgress(i);setPlaying(false)};$('months').append(b);monthButtons.push(b)});
function getDate(p){let month=Math.floor(p),f=p-month,day=20+Math.round(f*30.44);return {month,day:day>30?day-30:day,next:day>30};}
function setProgress(p){progress=(p%12+12)%12;let lam=progress*30*DEG,earthAngle=lam+Math.PI,earthPos=new THREE.Vector3(OR*Math.cos(earthAngle),0,OR*Math.sin(earthAngle)),skyPoint=vecAt(SR,lam),farPoint=vecAt(FAR_R,lam);earth.position.copy(earthPos);earthLabel.position.copy(earthPos).add(new THREE.Vector3(0,.66,0));earthMesh.rotation.y=progress*.38;
updateLine(rayToSun,earthPos,new THREE.Vector3(0,0,0));updateLine(rayOut,new THREE.Vector3(0,0,0),skyPoint);endpointHalo.position.copy(skyPoint);endpointCore.position.copy(skyPoint);farSunMarker.position.copy(farPoint);farSunDisk.position.copy(vecAt(FAR_R-2.1,lam));farSunRim.position.copy(vecAt(FAR_R-2.25,lam));farSunLabel.position.copy(vecAt(FAR_R-1,lam,-3.4*DEG));updateArc(highlightOrbit,SR,Math.floor(progress)*30*DEG,30*DEG,80);updateArc(highlightSky,FAR_R,Math.floor(progress)*30*DEG,30*DEG,60);
let sign=Math.floor(progress),deg=progress*30;$('signName').textContent=signs[sign];$('signDates').textContent=`${months[sign]} 20 — ${nextMonth[sign]} ${endDays[sign]}`;$('longitude').textContent=deg.toFixed(1)+'°';$('orbitProgress').textContent=(progress/12*100).toFixed(1)+'%';$('interpretation').textContent=details[sign];$('scrubber').value=progress;$('scrubber').style.setProperty('--progress',(progress/12*100)+'%');monthButtons.forEach((b,i)=>b.classList.toggle('active',i===sign));let d=getDate(progress);$('timeRead').textContent=`${d.next?monthNames[(d.month+1)%12]:monthNames[d.month]} ${d.day} · ${signs[sign].toUpperCase()}`;
zodiacOrbit.forEach((g,i)=>{g.children.forEach(child=>{if(child.material && child.material.color){if(child.isLine)child.material.opacity=i===sign?.86:.35;else if(child.isSprite)child.material.opacity=i===sign?.98:.61}})});if(tracking&&mode==='sky')lockedYaw=lam;
}
function setPlaying(p){playing=p;$('play').textContent=p?'Ⅱ':'▶';$('play').setAttribute('aria-label',p?'Pause animation':'Play animation')}
$('play').onclick=()=>setPlaying(!playing);$('scrubber').oninput=e=>{setProgress(Number(e.target.value));setPlaying(false)};
$('guideBtn').onclick=()=>{guides=!guides;guidesGroup.visible=guides;sphereGrid.visible=guides;skyGuides.visible=guides;rayToSun.visible=guides;rayOut.visible=guides;endpointHalo.visible=guides;endpointCore.visible=guides;orbitLabel.visible=guides;$('guideBtn').textContent=guides?'Guides · On':'Guides · Off';$('guideBtn').setAttribute('aria-pressed',String(guides))};
function setTracking(value){tracking=value;$('trackBtn').classList.toggle('active',value);$('fixedBtn').classList.toggle('active',!value);if(!value)lockedYaw=progress*30*DEG;if(value)lockedPitch=0}
$('trackBtn').onclick=()=>setTracking(true);$('fixedBtn').onclick=()=>setTracking(false);
function setMode(m){if(mode===m)return;if(mode==='orbit')orbitCameraRestore.copy(camera.position);mode=m;orbitFrame.visible=m==='orbit';earthSkyFrame.visible=m==='sky';controls.enabled=m==='orbit';$('orbitMode').classList.toggle('active',m==='orbit');$('earthMode').classList.toggle('active',m==='sky');$('orbitMode').setAttribute('aria-pressed',String(m==='orbit'));$('earthMode').setAttribute('aria-pressed',String(m==='sky'));$('skyTools').classList.toggle('active',m==='sky');$('legend').style.display=m==='orbit'?'flex':'none';$('hint').innerHTML=m==='orbit'?'<strong>Drag</strong> to rotate · <strong>Scroll</strong> to zoom · Select any month':'<strong>Drag</strong> to look around · <strong>Follow Sun</strong> or <strong>Fix sky</strong>';if(m==='sky'){setTracking(true)}else {camera.position.copy(orbitCameraRestore);camera.lookAt(0,0,0);controls.target.set(0,0,0);controls.update()}frameLayout();tgSync()}
$('orbitMode').onclick=()=>setMode('orbit');$('earthMode').onclick=()=>setMode('sky');
$('fullBtn').onclick=()=>{if(!document.fullscreenElement)canvasRoot.requestFullscreen?.();else document.exitFullscreen?.()};
function updateSkyCamera(){let earthA=progress*30*DEG+Math.PI;let ep=new THREE.Vector3(OR*Math.cos(earthA),0,OR*Math.sin(earthA));let a=tracking?progress*30*DEG:lockedYaw;let elevation=tracking?0:lockedPitch;let direction=new THREE.Vector3(Math.cos(elevation)*Math.cos(a),Math.sin(elevation),Math.cos(elevation)*Math.sin(a));camera.position.copy(ep);camera.up.set(0,1,0);camera.lookAt(ep.clone().add(direction))}
let dragging=false,lastX=0,lastY=0;renderer.domElement.addEventListener('pointerdown',e=>{if(mode!=='sky')return;dragging=true;lastX=e.clientX;lastY=e.clientY;renderer.domElement.setPointerCapture(e.pointerId)});renderer.domElement.addEventListener('pointermove',e=>{if(!dragging||mode!=='sky')return;let dx=e.clientX-lastX,dy=e.clientY-lastY;lastX=e.clientX;lastY=e.clientY;if(tracking)setTracking(false);lockedYaw-=dx*.004;lockedPitch=Math.max(-1.33,Math.min(1.33,lockedPitch+dy*.0035))});renderer.domElement.addEventListener('pointerup',()=>dragging=false);renderer.domElement.addEventListener('pointercancel',()=>dragging=false);
document.addEventListener('keydown',e=>{if(e.key==='ArrowRight'){e.preventDefault();setProgress(progress+1/3);setPlaying(false)}else if(e.key==='ArrowLeft'){e.preventDefault();setProgress(progress-1/3);setPlaying(false)}else if(e.code==='Space'&&e.target.tagName!=='BUTTON'){e.preventDefault();setPlaying(!playing)}});
function resize(){let w=canvasRoot.clientWidth,h=canvasRoot.clientHeight;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false);frameLayout()}window.addEventListener('resize',resize);
function tick(now){requestAnimationFrame(tick);let delta=Math.min((now-lastTime)/1000,.08);lastTime=now;if(playing)setProgress(progress+delta*(12/36));if(mode==='orbit'){controls.update()}else{updateSkyCamera()}sunCore.rotation.y+=delta*.015;renderer.render(scene,camera)}
// Telegram Mini App integration; skipped when opened in an ordinary browser.
// The SDK loads async so the scene can start drawing before it arrives.
function initTelegram(){
const tg=window.Telegram?.WebApp;
if(!tg||tg.platform==='unknown')return;
  const v=x=>tg.isVersionAtLeast(x);
  tg.ready();tg.expand();
  if(v('7.7'))tg.disableVerticalSwipes(); // dragging the globe must not swipe-close the app
  if(v('6.1')){tg.setHeaderColor('#070d15');tg.setBackgroundColor('#060c14')}
  if(v('7.10'))tg.setBottomBarColor('#060c14');
  const haptic=select=>{if(v('6.1'))select?tg.HapticFeedback.selectionChanged():tg.HapticFeedback.impactOccurred('light')};
  monthButtons.forEach(b=>b.addEventListener('click',()=>haptic(true)));
  ['orbitMode','earthMode','guideBtn','play','trackBtn','fixedBtn'].forEach(id=>$(id).addEventListener('click',()=>haptic(false)));
  // Telegram's native back button leaves the "From Earth" view
  if(v('6.1')){tg.BackButton.onClick(()=>setMode('orbit'));tgSync=()=>mode==='sky'?tg.BackButton.show():tg.BackButton.hide()}
  if(v('8.0')){const label=()=>$('fullBtn').textContent=tg.isFullscreen?'Exit full':'Full screen';$('fullBtn').onclick=()=>tg.isFullscreen?tg.exitFullscreen():tg.requestFullscreen();tg.onEvent('fullscreenChanged',label)}
  else $('fullBtn').style.display='none';
  tg.onEvent('viewportChanged',resize);
}
if(window.Telegram?.WebApp)initTelegram();else $('tgSdk')?.addEventListener('load',initTelegram);
setProgress(0);orbitFrame.visible=true;earthSkyFrame.visible=false;resize();requestAnimationFrame(tick);$('loading').classList.add('hide');
