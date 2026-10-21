import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { SKY } from './sky-data.js';

const $=id=>document.getElementById(id);
const signs=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const months=['MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC','JAN','FEB'];
const monthNames=['March','April','May','June','July','August','September','October','November','December','January','February'];
// Zodiac glyphs drawn as vector paths in a 100×100 box, so they never fall back to emoji.
const glyphs=[
'M50 88V44C50 22 40 12 28 12C16 12 10 22 12 32C14 42 24 45 30 40M50 44C50 22 60 12 72 12C84 12 90 22 88 32C86 42 76 45 70 40',
'M14 14C20 36 34 44 50 44C66 44 80 36 86 14M50 44A22 22 0 1 1 50 88A22 22 0 1 1 50 44',
'M18 14C38 24 62 24 82 14M18 86C38 76 62 76 82 86M38 21V79M62 21V79',
'M86 32C72 12 34 10 18 38M18 40a10 10 0 1 0 20 0a10 10 0 1 0 -20 0M14 68C28 90 66 90 82 62M62 60a10 10 0 1 0 20 0a10 10 0 1 0 -20 0',
'M17 62a13 13 0 1 0 26 0a13 13 0 1 0 -26 0M43 62C43 34 50 14 66 14C82 14 88 30 80 46C72 62 64 74 72 84C78 92 88 88 90 80',
'M12 24C18 20 22 24 22 32V84M22 34C22 22 40 22 40 34V84M40 34C40 22 58 22 58 34V70C58 86 72 90 80 80C88 70 80 58 70 62C62 66 60 78 62 90',
'M12 86H88M12 68H34C24 58 26 30 50 30C74 30 76 58 66 68H88',
'M12 24C18 20 22 24 22 32V80M22 34C22 22 40 22 40 34V80M40 34C40 22 58 22 58 34V74C58 86 68 88 84 80M74 72L86 80L76 90',
'M18 84L82 18M50 18H82V50M30 48L54 72',
'M10 26C16 22 20 26 22 34L34 80L48 26V66C48 84 74 88 80 70C84 56 72 50 64 56C56 62 58 76 50 86C44 92 36 90 32 86',
'M10 42L26 30L42 42L58 30L74 42L90 30M10 70L26 58L42 70L58 58L74 70L90 58',
'M20 12C46 32 46 68 20 88M80 12C54 32 54 68 80 88M22 50H78'
];
const glyphSvg=i=>`<svg viewBox="0 0 100 100" aria-hidden="true"><path d="${glyphs[i]}" fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
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
const orbitFrame=new THREE.Group(), earthSkyFrame=new THREE.Group();scene.add(orbitFrame,earthSkyFrame);orbitFrame.scale.z=earthSkyFrame.scale.z=-1;
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

// Constellations: Stellarium lines, stars and illustrations (credits in README).
// The real sky is turned back by SKY_SHIFT (roughly the precession since the signs were defined), so each
// zodiac figure lands in its sign's 30° sector while every constellation keeps its true shape and neighbours.
const SKY_SHIFT=26.8*DEG;
const skyVec=(r,[lon,lat])=>vecAt(r,lon*DEG-SKY_SHIFT,lat*DEG);
const dotTex=glowCanvas('rgba(255,255,255,1)','rgba(255,255,255,.9)','rgba(255,255,255,0)');
const artLoader=new THREE.TextureLoader(),artTextures={};
function artTexture(file){if(!artTextures[file]){let t=artLoader.load('art/'+file);t.anisotropy=4;artTextures[file]=t}return artTextures[file]}
// Pin an illustration to the sky (its brightness is used as transparency): solve the affine map from image pixels to the tangent plane through its
// three anchor stars, then wrap a subdivided plane onto the sphere.
function artMesh(c,r,color){let A=c.anchors.map(a=>skyVec(1,[a[2],a[3]]));let ctr=A[0].clone().add(A[1]).add(A[2]).normalize();let ref=Math.abs(ctr.y)>.9?new THREE.Vector3(1,0,0):new THREE.Vector3(0,1,0);let e1=new THREE.Vector3().crossVectors(ref,ctr).normalize(),e2=new THREE.Vector3().crossVectors(ctr,e1);
let plane=A.map(p=>{let d=p.dot(ctr);return [p.dot(e1)/d,p.dot(e2)/d]});let inv=new THREE.Matrix3().set(...c.anchors.flatMap(a=>[a[0],a[1],1])).invert();
let cu=new THREE.Vector3(plane[0][0],plane[1][0],plane[2][0]).applyMatrix3(inv),cv=new THREE.Vector3(plane[0][1],plane[1][1],plane[2][1]).applyMatrix3(inv);
let geo=new THREE.PlaneGeometry(1,1,24,24),pos=geo.attributes.position,uv=geo.attributes.uv;
for(let i=0;i<pos.count;i++){let x=uv.getX(i)*c.w,y=(1-uv.getY(i))*c.h;let p=ctr.clone().addScaledVector(e1,cu.x*x+cu.y*y+cu.z).addScaledVector(e2,cv.x*x+cv.y*y+cv.z).normalize().multiplyScalar(r);pos.setXYZ(i,p.x,p.y,p.z)}
pos.needsUpdate=true;geo.computeBoundingSphere();
return new THREE.Mesh(geo,new THREE.MeshBasicMaterial({alphaMap:artTexture(c.img),color,transparent:true,opacity:.1,depthWrite:false,side:THREE.DoubleSide}))}
const zodiacOrbit=[],zodiacFar=[];
function makeSky(r,far){SKY.forEach(c=>{let zodiac=c.sign>=0,g=new THREE.Group();
let segs=[];c.lines.forEach(l=>{for(let k=0;k<l.length-1;k++)segs.push(skyVec(r,l[k]),skyVec(r,l[k+1]))});
let lines=new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(segs),new THREE.LineBasicMaterial({color:zodiac?0x9cc7d4:0xa9bdd0,transparent:true,opacity:.32,depthWrite:false}));
let pts=[],cols=[],halos=[];c.stars.forEach(s=>{let p=skyVec(r,s),b=Math.min(1,Math.max(.35,1-(s[2]-1)*.17));pts.push(p);cols.push(b,b,b*(s[2]<1.5?.9:1.05));if(s[2]<2.3){let h=halo(s[2]<1.3?goldGlow:blueGlow,(far?6.5:.6)*(1.3-s[2]*.15),.3);h.position.copy(p);halos.push(h)}});
let sg=new THREE.BufferGeometry().setFromPoints(pts);sg.setAttribute('color',new THREE.Float32BufferAttribute(cols,3));
let stars=new THREE.Points(sg,new THREE.PointsMaterial({size:far?1.9:.17,map:dotTex,vertexColors:true,transparent:true,opacity:.9,depthWrite:false,blending:THREE.AdditiveBlending}));
let art=artMesh(c,r+(far?.6:.01),zodiac?0xf3c27e:0x9fc4e2);
let ctr=c.stars.reduce((a,s)=>a.add(skyVec(1,s)),new THREE.Vector3()).normalize(),low=Math.min(...c.stars.map(s=>s[1]));
let label=zodiac?spriteText(signs[c.sign].toUpperCase(),{serif:true,width:far?22:2.2,color:'#ead9bb'}):spriteText(c.name.toUpperCase(),{serif:false,width:far?15:1.6,color:'#adc0cf',opacity:.7});
label.position.copy(vecAt(r,Math.atan2(ctr.z,ctr.x),Math.max(-85,low-(far?5:6))*DEG));
g.add(art,lines,stars,...halos,label);g.userData={lines,stars,halos,label,art,k:0};(far?earthSkyFrame:orbitFrame).add(g);if(zodiac)(far?zodiacFar:zodiacOrbit)[c.sign]=g})}
makeSky(SR-.08,false);makeSky(FAR_R+.15,true);
for(let i=0;i<12;i++)orbitFrame.add(line([vecAt(SR-.15,i*30*DEG),vecAt(SR+.22,i*30*DEG)],0xdeb984,.31)); // sign sector dividers
// Blend each zodiac figure toward focused (k=1) or resting (k=0).
function applyFocus(groups,sign,delta){groups.forEach((g,i)=>{let u=g.userData;u.k+=((i===sign?1:0)-u.k)*Math.min(1,delta*6);let k=u.k;u.art.material.opacity=.1+.62*k;u.lines.material.opacity=.3+.55*k;u.stars.material.opacity=.7+.3*k;u.halos.forEach(h=>h.material.opacity=.25+.5*k);u.label.material.opacity=.5+.5*k})}

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
let progress=0,mode='orbit',playing=false,tracking=true,lockedYaw=0,lockedPitch=0,yawDelta=0,orbitCameraRestore=orbitCamSaved.clone();let lastTime=performance.now(),transition=null,tgSync=()=>{};
function frameLayout(){let w=canvasRoot.clientWidth,h=canvasRoot.clientHeight;let scale=Math.max(0,Math.min(1,(w-570)/830));if(mode==='orbit'){controls.target.set(w<700?0:1.15,0,0);controls.update()}camera.fov=w<550?57:49;camera.updateProjectionMatrix()}
frameLayout();
const monthButtons=[];months.forEach((m,i)=>{let b=document.createElement('button');b.className='month';b.textContent=m;b.setAttribute('aria-label',monthNames[i]);b.onclick=()=>{setProgress(i);setPlaying(false)};$('months').append(b);monthButtons.push(b)});
function getDate(p){let month=Math.floor(p),f=p-month,day=20+Math.round(f*30.44);return {month,day:day>30?day-30:day,next:day>30};}
function setProgress(p){progress=(p%12+12)%12;let lam=progress*30*DEG,earthAngle=lam+Math.PI,earthPos=new THREE.Vector3(OR*Math.cos(earthAngle),0,OR*Math.sin(earthAngle)),skyPoint=vecAt(SR,lam),farPoint=vecAt(FAR_R,lam);earth.position.copy(earthPos);earthLabel.position.copy(earthPos).add(new THREE.Vector3(0,.66,0));earthMesh.rotation.y=progress*.38;
updateLine(rayToSun,earthPos,new THREE.Vector3(0,0,0));updateLine(rayOut,new THREE.Vector3(0,0,0),skyPoint);endpointHalo.position.copy(skyPoint);endpointCore.position.copy(skyPoint);farSunMarker.position.copy(farPoint);farSunDisk.position.copy(vecAt(FAR_R-2.1,lam));farSunRim.position.copy(vecAt(FAR_R-2.25,lam));farSunLabel.position.copy(vecAt(FAR_R-1,lam,-3.4*DEG));updateArc(highlightOrbit,SR,Math.floor(progress)*30*DEG,30*DEG,80);updateArc(highlightSky,FAR_R,Math.floor(progress)*30*DEG,30*DEG,60);
let sign=Math.floor(progress);$('scrubber').value=progress;$('scrubber').style.setProperty('--progress',(progress/12*100)+'%');monthButtons.forEach((b,i)=>b.classList.toggle('active',i===sign));let d=getDate(progress);$('timeRead').innerHTML=`${glyphSvg(sign)}${d.next?monthNames[(d.month+1)%12]:monthNames[d.month]} ${d.day}<span>· ${signs[sign]}</span>`;
if(tracking&&mode==='sky')lockedYaw=followYaw();
}
function setPlaying(p){playing=p;$('play').textContent=p?'Ⅱ':'▶';$('play').setAttribute('aria-label',p?'Pause animation':'Play animation')}
$('play').onclick=()=>setPlaying(!playing);$('scrubber').oninput=e=>{setProgress(Number(e.target.value));setPlaying(false)};
function setTracking(value){tracking=value;$('trackBtn').classList.toggle('active',value);$('fixedBtn').classList.toggle('active',!value);if(!value)lockedYaw=followYaw();if(value)lockedPitch=0}
$('trackBtn').onclick=()=>setTracking(true);$('fixedBtn').onclick=()=>setTracking(false);
function setMode(m){if(mode===m)return;if(mode==='orbit')orbitCameraRestore.copy(camera.position);mode=m;orbitFrame.visible=m==='orbit';earthSkyFrame.visible=m==='sky';controls.enabled=m==='orbit';$('orbitMode').classList.toggle('active',m==='orbit');$('earthMode').classList.toggle('active',m==='sky');$('orbitMode').setAttribute('aria-pressed',String(m==='orbit'));$('earthMode').setAttribute('aria-pressed',String(m==='sky'));$('skyTools').classList.toggle('active',m==='sky');$('legend').style.display=m==='orbit'?'flex':'none';$('hint').innerHTML=m==='orbit'?'<strong>Drag</strong> to rotate · <strong>Scroll</strong> to zoom · Select any month':'<strong>Drag</strong> to look around · <strong>Follow Sun</strong> or <strong>Fix sky</strong>';if(m==='sky'){setTracking(true)}else {camera.position.copy(orbitCameraRestore);camera.lookAt(0,0,0);controls.target.set(0,0,0);controls.update()}frameLayout();tgSync()}
$('orbitMode').onclick=()=>setMode('orbit');$('earthMode').onclick=()=>setMode('sky');
$('fullBtn').onclick=()=>{if(!document.fullscreenElement)canvasRoot.requestFullscreen?.();else document.exitFullscreen?.()};
// Follow Sun aims halfway between the Sun and its sign's centre so the focused figure stays in frame on phones.
function followYaw(){return (progress*30*DEG+(Math.floor(progress)+.5)*30*DEG)/2}
function updateSkyCamera(){let earthA=progress*30*DEG+Math.PI;let ep=new THREE.Vector3(OR*Math.cos(earthA),0,-OR*Math.sin(earthA));let a=tracking?followYaw():lockedYaw;let elevation=tracking?0:lockedPitch;let direction=new THREE.Vector3(Math.cos(elevation)*Math.cos(a),Math.sin(elevation),-Math.cos(elevation)*Math.sin(a));camera.position.copy(ep);camera.up.set(0,1,0);camera.lookAt(ep.clone().add(direction))}
let dragging=false,lastX=0,lastY=0;renderer.domElement.addEventListener('pointerdown',e=>{if(mode!=='sky')return;dragging=true;lastX=e.clientX;lastY=e.clientY;renderer.domElement.setPointerCapture(e.pointerId)});renderer.domElement.addEventListener('pointermove',e=>{if(!dragging||mode!=='sky')return;let dx=e.clientX-lastX,dy=e.clientY-lastY;lastX=e.clientX;lastY=e.clientY;if(tracking)setTracking(false);lockedYaw+=dx*.004;lockedPitch=Math.max(-1.33,Math.min(1.33,lockedPitch+dy*.0035))});renderer.domElement.addEventListener('pointerup',()=>dragging=false);renderer.domElement.addEventListener('pointercancel',()=>dragging=false);
document.addEventListener('keydown',e=>{if(e.key==='ArrowRight'){e.preventDefault();setProgress(progress+1/3);setPlaying(false)}else if(e.key==='ArrowLeft'){e.preventDefault();setProgress(progress-1/3);setPlaying(false)}else if(e.code==='Space'&&e.target.tagName!=='BUTTON'){e.preventDefault();setPlaying(!playing)}});
function resize(){let w=canvasRoot.clientWidth,h=canvasRoot.clientHeight;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false);frameLayout()}window.addEventListener('resize',resize);
function tick(now){requestAnimationFrame(tick);let delta=Math.min((now-lastTime)/1000,.08);lastTime=now;if(playing)setProgress(progress+delta*(12/36));if(mode==='orbit'){controls.update()}else{updateSkyCamera()}sunCore.rotation.y+=delta*.015;let sign=Math.floor(progress);applyFocus(zodiacOrbit,sign,delta);applyFocus(zodiacFar,sign,delta);renderer.render(scene,camera)}
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
  ['orbitMode','earthMode','play','trackBtn','fixedBtn'].forEach(id=>$(id).addEventListener('click',()=>haptic(false)));
  // Telegram's native back button leaves the "From Earth" view
  if(v('6.1')){tg.BackButton.onClick(()=>setMode('orbit'));tgSync=()=>mode==='sky'?tg.BackButton.show():tg.BackButton.hide()}
  if(v('8.0')){const label=()=>$('fullBtn').textContent=tg.isFullscreen?'Exit full':'Full screen';$('fullBtn').onclick=()=>tg.isFullscreen?tg.exitFullscreen():tg.requestFullscreen();tg.onEvent('fullscreenChanged',label)}
  else $('fullBtn').style.display='none';
  tg.onEvent('viewportChanged',resize);
}
if(window.Telegram?.WebApp)initTelegram();else $('tgSdk')?.addEventListener('load',initTelegram);
setProgress(0);orbitFrame.visible=true;earthSkyFrame.visible=false;resize();requestAnimationFrame(tick);$('loading').classList.add('hide');
