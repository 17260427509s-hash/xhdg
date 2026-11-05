/** CSS hue-rotate/saturate in display space, then return to scene-linear RGB.
 * This keeps the full-page CSS sky aligned with the WebGL/export sky. */
export const galaxyColorGLSL=/* glsl */`
vec3 skyDisplay(vec3 c){return mix(c*12.92,1.055*pow(max(c,vec3(0.)),vec3(1./2.4))-.055,step(vec3(.0031308),c));}
vec3 skyLinear(vec3 c){return mix(c/12.92,pow((c+.055)/1.055,vec3(2.4)),step(vec3(.04045),c));}
vec3 galaxyColor(vec3 linearColor,float hue,float saturation){
  vec3 c=skyDisplay(linearColor);float co=cos(hue),si=sin(hue);
  vec3 rotated=clamp(vec3(
    dot(c,vec3(.213+.787*co-.213*si,.715-.715*co-.715*si,.072-.072*co+.928*si)),
    dot(c,vec3(.213-.213*co+.143*si,.715+.285*co+.140*si,.072-.072*co-.283*si)),
    dot(c,vec3(.213-.213*co-.787*si,.715-.715*co+.715*si,.072+.928*co+.072*si))
  ),0.,1.);
  float luminance=dot(rotated,vec3(.213,.715,.072));
  return skyLinear(clamp(mix(vec3(luminance),rotated,saturation),0.,1.));
}`
