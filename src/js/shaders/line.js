let linev = `
attribute vec4 fx;

uniform vec2 uResolution;

varying vec2 vUv;
varying vec4 vFx;
varying vec3 vNDCpos;

void main() {
    vec3 aspectRatioCorrected = position * vec3(uResolution.y / uResolution.x, 1.0, 1.0);

    vUv = uv;
    vFx = fx;

    vNDCpos = aspectRatioCorrected;

    gl_Position = vec4(aspectRatioCorrected, 1.0);
}`;

let linef = `
varying vec2 vUv;
varying vec4 vFx;
varying vec3 vNDCpos;

uniform float uTime;
uniform float uUVYheadStart;
uniform float uUVYheadLength;
uniform float uCumulativeY;
uniform vec2 uResolution;

uniform vec2  uMouseTextureDisp;

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

// uv are screen uvs from 0...1
vec3 computeColor(vec2 uv, vec2 lineUvs, float mouseMixer) {

    // vec2 uvDistortion = vec2(0.0);
    // vec2 mouseDispl = uMouseTextureDisp * 0.05 * pow(vFx.x, 3.0);

    float disx = fbm(vec2(   lineUvs.x        )  *  3.0 );
    float disy = fbm(vec2(   lineUvs.y * 0.2  )  *  3.0 );
    vec2 mouseDispl = uMouseTextureDisp * 0.05;

    // vec2 uvDistortion = vec2(disx, disy) * pow(vFx.x, 5.0) * 0.075;
    vec2 lineDir = normalize(vFx.zw);
    vec2 uvDistortion = vec2(disx, disy) * pow(vFx.x, 5.0) * 0.125 * lineDir;


    uvDistortion *= 1.0;
    mouseDispl   *= 0.0;


    vec2 mouseDisplacedUvs = uv * 0.9 + 0.05 + mouseDispl;

    // mobile screen aspect ratio correction
    float aspectRatio = uResolution.x / uResolution.y;
    if(aspectRatio < 1.777) {
        float h = (uResolution.x / uResolution.y) / (1.777);
        mouseDisplacedUvs.x = mouseDisplacedUvs.x * h + (1.0-h) * 0.5; 
    }

    vec3 col1 = texture2D(uTexture1, mouseDisplacedUvs + uvDistortion ).rgb;
    vec3 col2 = texture2D(uTexture2, mouseDisplacedUvs + uvDistortion ).rgb;


    col1 = col1 * (0.8 + pow(vFx.x, 2.5) * 0.5);
    col2 = col2 * (0.7 + pow(vFx.x, 2.5) * 1.1);

    vec3 col = mix(col1, col2, mouseMixer);


    return col;
}


void main() {
   
    // Normalized pixel coordinates (from 0 to 1)
    vec2 uvRef = vUv;
    vec2 uv = vUv;
	vec3 col = computeColor(vNDCpos.xy * 0.5 + 0.5, vUv, vFx.y); 
    
    float time = uTime;


    uv += fbm(vec2(uv * 3.0 + time * 0.25)) * (0.03 + (sin(time) * 0.005 + 0.005) );
    
    float xl, xl1, xl2;
    float secondaryNoiseSpeed = pow(fbm(vec2(uv.x + time * 0.005, 0.0)), 1.5) * 55.0;
    secondaryNoiseSpeed = max(secondaryNoiseSpeed, 35.0);
    

    

    // ****** linee base 
    xl1 = noise(vec2(uv.x * 2.7, uv.y * 0.5)) * 1.15;
    xl2 = noise(vec2(uv.x * 2.7 + 452.2315, uv.y * 0.5)) * 1.15;
    
    float vbase = 0.5 + noise(
        vec2(uv.x, uv.y)
    ) * 0.4;

    if(vbase < 0.4) {
        xl = xl1;
    } else if (vbase < 0.6) {
        float t = (vbase - 0.4) / 0.2;
        xl = xl1 * (1.0 - t) + xl2 * t;
    } else {
        xl = xl2;
    }

    // v v v optional, also looks cool
    // xl = xl1;
    // ^ ^ ^ optional, also looks cool
    // ****** linee base - END

    
    
    
    
    // linee verticali di intermezzo
    xl += fbm(vec2(uv.x * 10.0, uv.y * 0.5 * 2.0)) * 1.5;
    // ********* v v v opzionale 
    // xl += (fbm(vec2(uv.x * 10.0 + 234.23424, uv.y * 0.3 * 2.0)) * 2.0 - 1.0) * 0.35;
    // ********* ^ ^ ^ opzionale - END
    xl -= pow(fbm(vec2(uv.x * 8.0, uv.y * 2.2 * 2.0)), 2.5) * 0.45;
    
    // noise generale, per distorcere un po' le linee verticali 
    xl += fbm(vec2(uv.x * 10.0, uv.y * 6.0 * 2.0)) * (0.2 + sin(uv.y + time) * 0.1);
    
    
    xl = pow(xl, 2.0);
    
    
    // this line v v v is replaced by index.js
    float t = 2.5 - pow(vFx.x, 0.5) * 2.7; 

    
    						// this increases a bit the fading effect when the lines are disappearing
    						// v v v v v v v v v v v 
    float windowSize = 0.25 + abs(max(t, 0.0)) * 0.5; 
    windowSize += clamp(abs(-min(xl - 0.1, 0.0)) * 2.5, 0.0, 0.055); 
    
    float t1 = t;
	float t2 = t1 + windowSize;
    
    
    
    float a = 0.0;
    if(xl > t1 && xl < t2) {
    	a = (xl - t1) / windowSize;
    } else if (t1 > xl) {
		a = 0.0;
    } else if (t2 < xl) {
    	a = 1.0;
    }
    a = clamp(a, 0.0, 1.0);
    



    // calculate head opacity
    float headOpacity = 1.0;
    if(uvRef.y >= uUVYheadStart) {
        float nuvy = (uvRef.y - uUVYheadStart) / uUVYheadLength * 0.5;     // let's "imagine" the difference from the head start to head length is 0.5 
        float nuvx = uvRef.x;

        // will be at maximum 0.5
        float dist = length(vec2(nuvx, nuvy) - vec2(0.5, 0.0));

        float clampt = 0.2 + 0.3 * abs(uvRef.x - 0.5) * 1.99;
        float headOpacity = 1.0 - smoothstep(clampt, 0.501, dist);

        a *= headOpacity;
    }


    float topOfTheLineFadingLength = 0.07;
    if(uvRef.y >= uCumulativeY - topOfTheLineFadingLength) {
        float nuvy = uvRef.y - (uCumulativeY - topOfTheLineFadingLength);
        a *= 1.0 - smoothstep(0.0, topOfTheLineFadingLength, nuvy);
    }


    gl_FragColor = vec4(col, a);
}
`;



export { linev, linef }