let lightshaftv = `
attribute vec4 fx;

uniform vec2 uResolution;

varying vec4 vFx;
varying vec2 vUv;
varying vec2 vResolution;
varying vec2 vScreenUv;

void main() {
    vec3 aspectRatioCorrected = position * vec3(uResolution.y / uResolution.x, 1.0, 1.0);

    vFx = fx;
    vUv = uv;
    vResolution = uResolution;

    vScreenUv = aspectRatioCorrected.xy * 0.5 + 0.5;

    gl_Position = vec4(aspectRatioCorrected, 1.0);
}
`;

let lightshaftf = `
varying vec4 vFx;
varying vec2 vUv;
varying vec2 vScreenUv;
varying vec2 vResolution;

uniform sampler2D uTexture1;
uniform sampler2D uTexture2;


// procedural noise from IQ
vec2 hash( vec2 p )
{
	p = vec2( dot(p,vec2(127.1,311.7)),
			 dot(p,vec2(269.5,183.3)) );
	return -1.0 + 2.0*fract(sin(p)*43758.5453123);
}

float noise( in vec2 p )
{
	const float K1 = 0.366025404; // (sqrt(3)-1)/2;
	const float K2 = 0.211324865; // (3-sqrt(3))/6;
	
	vec2 i = floor( p + (p.x+p.y)*K1 );
	
	vec2 a = p - i + (i.x+i.y)*K2;
	vec2 o = (a.x>a.y) ? vec2(1.0,0.0) : vec2(0.0,1.0);
	vec2 b = a - o + K2;
	vec2 c = a - 1.0 + 2.0*K2;
	
	vec3 h = max( 0.5-vec3(dot(a,a), dot(b,b), dot(c,c) ), 0.0 );
	
	vec3 n = h*h*h*h*vec3( dot(a,hash(i+0.0)), dot(b,hash(i+o)), dot(c,hash(i+1.0)));
	
	return dot( n, vec3(70.0) );
}

float fbm(vec2 uv)
{
	float f;
	mat2 m = mat2( 1.6,  1.2, -1.2,  1.6 );
	f  = 0.5000*noise( uv ); uv = m*uv;
	f += 0.2500*noise( uv ); uv = m*uv;
	f += 0.1250*noise( uv ); uv = m*uv;
	f += 0.0625*noise( uv ); uv = m*uv;
	f = 0.5 + 0.5*f;
	return f;
}


void main() {

    vec2 uvOffs = vec2(     
        vFx.z,  // fbm(vec2(vFx.z, 0.0)), 
        vFx.w   // fbm(vec2(0.0, vFx.w))
    ) * vFx.x * 0.015;

    vec3 col1 = texture2D(uTexture1, vScreenUv + uvOffs).rgb;
    vec3 col2 = col1 * 1.3 * vec3(1.0, 0.5, 0.25);

    col1 = col1 * vec3(1.0, 0.6, 0.5);

    vec3 col = mix(col1, col2, vFx.y);


    vec2 uv = vec2(vUv.x, pow(vUv.y, 2.0));


    float timeOpacity = vFx.x;
    if(timeOpacity > 0.5) {
        timeOpacity = 1.0 - smoothstep(0.5, 1.0, timeOpacity);
    } else {
        timeOpacity = timeOpacity / 0.5;
    }


    float sphereAlpha = max(1.0 - smoothstep(0.3, 0.5, length(uv - vec2(0.5)) ),   0.0);
    float a = timeOpacity * sphereAlpha;


    a *= 0.25;

    // avoids a strange artifact
    if(length(vUv - vec2(0.5)) > 0.499) a = 0.0;

    
    gl_FragColor = vec4(col * a, 0.0);
}
`;


export { lightshaftv, lightshaftf }