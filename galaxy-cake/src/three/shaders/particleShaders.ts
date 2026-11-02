export const particleVertex = /* glsl */ `
attribute float aSize;
attribute float aSeed;
attribute vec3 aVelocity;
uniform float uTime, uDpr, uMode, uAge, uReduced, uReveal, uGather;
uniform vec3 uCandles[3];
uniform int uCandleCount;
varying vec3 vColor;
varying float vSeed, vAlpha, vPixel;

void main() {
  vec3 p=position;
  vColor=color;
  vSeed=aSeed;
  vAlpha=1.;
  if(uMode<.5) {
    p=mix(vec3(p.x*.3,-.85,p.z*.3),p,uReveal);
    p+=vec3(sin(uTime*.21+aSeed*32.)*.045,
      sin(uTime*.28+aSeed*27.)*.075,cos(uTime*.17+aSeed*21.)*.045)*uReduced;
    vAlpha=.42+.5*pow(.5+.5*sin(uTime*.72+aSeed*53.),3.);
  } else if(uMode>1.5&&uMode<2.5) {
    float phase=fract(sin(aSeed*761.4)*437.5);
    float age=fract(uTime*(.34+aSeed*.14)+phase);
    float spread=.018+age*.14;
    vec3 candle=uCandles[int(mod(floor(aSeed*100.),float(uCandleCount)))];
    p=candle+vec3(sin(aSeed*87.+age*2.7)*spread,
      .23+age*.95,cos(aSeed*23.+age*1.9)*spread*.75);
    vAlpha=pow(1.-age,2.)*smoothstep(0.,.07,age)*(.35+.65*step(.6,aSeed));
    if(uGather<1.) {
      p=candle+vec3(sin(aSeed*87.)*.3*(1.-uGather),
        (1.-uGather)*(.2+aSeed*.8),cos(aSeed*23.)*.3*(1.-uGather));
      vAlpha=uGather;
    }
  } else if(uMode>2.5&&uMode<3.5) {
    float age=max(uAge,0.);
    p=vec3(0.,.15,0.)+aVelocity*age*.9;
    p.y-=.15*age*age;
    vAlpha=uAge<0.?0.:pow(max(0.,1.-age/5.2),1.4);
  } else if(uMode>3.5) {
    float angle=uTime*.045*uReduced;
    p.xz=mat2(cos(angle),-sin(angle),sin(angle),cos(angle))*p.xz;
    p.y+=sin(uTime*.17+aSeed*80.)*.045*uReduced;
    p=mix(vec3(p.x*.3,-.85,p.z*.3),p,uReveal);
    vAlpha=.3+.65*pow(.5+.5*sin(uTime*.63+aSeed*93.),4.);
  }
  vec4 mv=modelViewMatrix*vec4(p,1.);
  gl_PointSize=clamp(aSize*uDpr*8.5/-mv.z,uMode>.5&&uMode<1.5?2.5:1.,28.);
  vPixel=1./gl_PointSize;
  gl_Position=projectionMatrix*mv;
}`

export const particleFragment = /* glsl */ `
varying vec3 vColor;
varying float vSeed,vAlpha,vPixel;
uniform float uOpacity,uMode;

void main() {
  vec2 p=gl_PointCoord-.5;
  if(uMode>1.5&&uMode<2.5)p*=vec2(1.3,.8);
  float r2=dot(p,p);
  float core=exp(-r2/max(1./105.,.4*vPixel*vPixel));
  float halo=exp(-r2*28.)*.065;
  float rayWidth=max(fwidth(p.x)*.75,.009);
  float spike=0.;
  if(uMode<.5&&vSeed>.94) {
    spike=exp(-abs(p.x)/rayWidth)*pow(max(0.,1.-abs(p.y)*2.),2.5)
      +exp(-abs(p.y)/rayWidth)*pow(max(0.,1.-abs(p.x)*2.),2.5);
  }
  float alpha=(core+halo+spike*.65)*vAlpha*uOpacity;
  alpha*=1.-smoothstep(.43,.5,length(p));
  if(alpha<.004)discard;
  // Small hot cores retain a colored falloff instead of an opaque colored disc.
  vec3 radiance=mix(vColor,vec3(2.2,2.05,1.85),pow(core,3.)*.34);
  gl_FragColor=vec4(radiance,alpha);
}`
