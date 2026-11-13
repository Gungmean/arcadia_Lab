import assert from 'node:assert/strict';
import {defaults,measure,electronWavelength,beamSections,beamRadiusAt,beamPointAt,semScanAt,semSurfaceZ,semRadiusAtHeight,semSpecimenBase,semSignalPath,cubicPoint,temSpecimenZ,temPoleGap} from './model.mjs';
import {makeInstrument} from './geometry.mjs';
const optical=measure('optical',defaults.optical);
assert.equal(optical.magnification,400);
assert.ok(Math.abs(optical.resolution-516.153846)<.001);
const highEye=measure('optical',{...defaults.optical,eyepiece:20});
assert.equal(highEye.magnification,800);
assert.equal(highEye.resolution,optical.resolution,'Eyepiece magnification must not improve objective resolution');
assert.equal(highEye.fov,optical.fov/2);
assert.equal(optical.fieldNumber,18);assert.equal(highEye.fieldNumber,9);
assert.equal(highEye.diffractionSigma,2*optical.diffractionSigma,'Empty magnification must magnify the PSF as well as the specimen');
assert.equal(highEye.diffractionSigma*highEye.fov,optical.diffractionSigma*optical.fov);
assert.ok(Math.abs(electronWavelength(100)-3.7014)<.001);
assert.ok(Math.abs(electronWavelength(300)-1.9687)<.001);
assert.ok(electronWavelength(1)>electronWavelength(30));
const thin=measure('tem',{...defaults.tem,thickness:30});
const thick=measure('tem',{...defaults.tem,thickness:240});
assert.ok(thin.transmission>thick.transmission);
assert.equal(measure('tem',{...defaults.tem,vacuum:false}).signal,0);
assert.equal(measure('sem',{...defaults.sem,vacuum:false}).signal,0);
assert.equal(measure('sem',{...defaults.sem,dwell:5}).frameTime,1.31072);
assert.equal(measure('sem',{...defaults.sem,dwell:10}).frameTime,2.62144);
assert.ok(temPoleGap[0]<temSpecimenZ&&temSpecimenZ+.15<temPoleGap[1],'TEM specimen must lie between objective poles');
// Inspect the actual geometry's opening radii over their complete thickness.
let checks=0;
for(const mode of ['optical','tem','sem']) {
  const {apertures}=makeInstrument(mode);
  for(const section of beamSections(mode))for(const aperture of apertures) {
    for(let i=0;i<=100;i++) {
      const z=aperture.z0+(aperture.z1-aperture.z0)*i/100,r=beamRadiusAt(section,z);
      if(r!==null){assert.ok(Math.abs(r)<=aperture.r+1e-9,`${mode} beam hits ${aperture.name}: z${z}, r${r} > aperture ${aperture.r}`);checks++;}
    }
  }
  for(const section of beamSections(mode))for(let i=0;i<=100;i++) {
    const [z,r]=beamPointAt(section,i/100,.8),width=beamRadiusAt(section,z);
    assert.ok(Math.abs(r)<=Math.abs(width)+1e-6,'animated particles must remain inside their ray bundle');
  }
}
const imageRay=beamSections('optical')[1];
const slopeBefore=(beamRadiusAt(imageRay,241)-beamRadiusAt(imageRay,240));
const slopeAfter=(beamRadiusAt(imageRay,242)-beamRadiusAt(imageRay,241));
assert.ok(Math.abs(slopeBefore-slopeAfter)<1e-9,'rays cannot reflect at the empty intermediate image plane');
assert.equal(beamRadiusAt(imageRay,290),beamRadiusAt(imageRay,309),'relaxed-eye output is parallel in the equivalent eyepiece model');
for(const fov of [25,40,60])for(const dwell of [1,5,20])for(let i=0;i<512;i++) {
  const s={...defaults.sem,fov,dwell},p=semScanAt(i*.017,s);
  assert.ok(Math.abs(p.z-semSurfaceZ(p.x,p.y))<1e-6);
  assert.ok(Math.abs(p.x)<=fov/1.25/2+1e-9);
  if(p.hitSphere)assert.ok(Math.abs(semRadiusAtHeight(p.z-semSpecimenBase)-Math.hypot(p.x,p.y))<1e-6);
  for(let n=0;n<100;n++){
    const t=n/100,x=p.x*t,y=p.y*t,z=137+(p.z-137)*t;
    assert.ok(z>semSurfaceZ(x,y)-1e-6,'primary scan ray must hit the top surface first');
  }
  for(const kind of ['SE','BSE']){
    const signal=semSignalPath(p,kind);
    if(signal.visible)for(let n=1;n<80;n++){
      const [x,y,z]=cubicPoint(signal.points,n/80);
      assert.ok(z>=65-1e-6&&(z<65||x*x+y*y+(z-65)**2>=100-1e-5),'visible detected electrons cannot pass through the specimen');
    }
  }
  const radius=Math.hypot(p.x,p.y);
  for(const [z,r]of [[136,4],[134,5],[132,5]])assert.ok(radius*(137-z)/(137-p.z)<r,'SEM deflected probe must clear lower pole and BSE hole');
}
assert.equal(semScanAt(.2,{...defaults.sem,dwell:10}).period,2*semScanAt(.2,defaults.sem).period);
const grazingBSE=semScanAt(2.666029296875,{...defaults.sem,fov:25});
assert.equal(semSignalPath(grazingBSE,'BSE').visible,false,'BSE re-entering the specimen immediately after emission must be occluded');
console.log(`Scientific checks passed: ${checks} beam/aperture depth samples, image-plane continuity, physical PSF scaling, TEM pole gap, SEM scan/surface registration, wavelength, attenuation and scan timing.`);
