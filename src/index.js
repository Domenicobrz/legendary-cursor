import * as THREE from 'three';
import Utils from "./js/utils"; 
import { linev, linef } from "./js/shaders/line";
import { sparklev, sparklef } from "./js/shaders/sparkle";
import { lightshaftv, lightshaftf } from "./js/shaders/lightshaft";
import { quadclearv, quadclearf } from "./js/shaders/quadclear";

let vec3 = function(x,y,z) {
    return new THREE.Vector3(x,y,z);
};

let LegendaryCursor = { };

let scene; 
let camera;
let renderer;
let lineMaterial;
let sparkleMaterial;
let lightShaftMaterial;
let quadClearMaterial;
let clock;

let linePoints  = [];
let sparkles    = [];
let lightShafts = [];
let aspectRatio = innerWidth / innerHeight;

let mouseDown  = false;
let mouseMixer = 0;

let cumulativeUvy;

let speedExpFactor;
let lineSize;
let lineExpFactor;
let opacityDecrement;
let sparklesCount;
let maxOpacity;

LegendaryCursor.init = function(args) {
    if(!args) args = { };
    
    lineExpFactor    = args.lineExpFactor  || 0.6;
    speedExpFactor   = args.speedExpFactor || 0.8;
    lineSize         = args.lineSize || 0.15;
    opacityDecrement = args.opacityDecrement || 0.55;
    sparklesCount    = args.sparklesCount || 65;
    maxOpacity       = args.maxOpacity || 1;

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, premultipliedAlpha: true });
    renderer.autoClear = false;
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.domElement.style.pointerEvents = "none";
    renderer.domElement.style.position = "fixed";
    renderer.domElement.style.top = "0";
    renderer.domElement.style.left = "0";
    renderer.domElement.style.zIndex = "99999";
    document.body.appendChild( renderer.domElement );

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 1000 );
    camera.position.set( 0, 0, 60 );

    clock = new THREE.Clock();

    let t1, t2, t4;
    new THREE.TextureLoader().load(args.texture1 || "https://domenicobrz.github.io/assets/legendary-cursor/t3.jpg", function(texture) {
        // setting these values will prevent the texture from being downscaled internally by three.js
        texture.generateMipmaps = false;
        texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.minFilter = THREE.LinearFilter;
        t1 = texture;
        onDl();
    });

    new THREE.TextureLoader().load(args.texture2 || "https://domenicobrz.github.io/assets/legendary-cursor/t6_1.jpg", function(texture) {
        // setting these values will prevent the texture from being downscaled internally by three.js
        texture.generateMipmaps = false;
        texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.minFilter = THREE.LinearFilter;
        t2 = texture;        
        onDl();
    });

    new THREE.TextureLoader().load(args.texture3 || "https://domenicobrz.github.io/assets/legendary-cursor/ts.png", function(texture) {
        t4 = texture;        
        onDl();
    });

    function onDl() {
        if(!t1 || !t2 || !t4) return;


        // modify line shader material
        let linef2 = linef.replace(
            "float t = 2.5 - pow(vFx.x, 0.5) * 2.7;",
            "float t = 2.5 - pow(vFx.x, 0.5) * " + (2.7 * maxOpacity).toFixed(2) + ";",
        );


        lineMaterial = new THREE.ShaderMaterial( {
            uniforms: {
                uTime: { value: 0 },
                uResolution: { value: new THREE.Vector2(innerWidth, innerHeight) },
                uUVYheadStart: { value: 0 },
                uUVYheadLength: { value: 0 },
                uCumulativeY: { value: 0 },
                uTexture1: { type: "t", value: t1 },
                uTexture2: { type: "t", value: t2 },
                uPass: { value: 0 },
                uMouseTextureDisp: { value: new THREE.Vector2(0, 0) },
            },
    
            side: THREE.DoubleSide,
            transparent: true,
            
            depthTest: false,
            
            vertexShader: linev,
            fragmentShader: linef2,
        } );

        sparkleMaterial = new THREE.ShaderMaterial( {
            uniforms: {
                uResolution: { value: new THREE.Vector2(innerWidth, innerHeight) },
                uTexture1: { type: "t", value: t1 },
                uTexture2: { type: "t", value: t2 },
                uTexture3: { type: "t", value: t4 },
            },
    
            side: THREE.DoubleSide,
            transparent: true,
            
            depthTest: false,
            
            vertexShader: sparklev,
            fragmentShader: sparklef,
        } );

        // lightShaftMaterial = new THREE.ShaderMaterial( {
        //     uniforms: {
        //         uResolution: { value: new THREE.Vector2(innerWidth, innerHeight) },
        //         uTexture1: { type: "t", value: t3 },
        //         uTexture2: { type: "t", value: t2 },
        //     },
    
        //     side: THREE.DoubleSide,
        //     transparent: false,
            
        //     depthTest: false,
            
        //     vertexShader: lightshaftv,
        //     fragmentShader: lightshaftf,
        // } );

        // quadClearMaterial = new THREE.ShaderMaterial( {
        //     side: THREE.DoubleSide,
        //     transparent: true,

        //     blending: THREE.CustomBlending,
        //     blendDst: THREE.OneMinusSrcAlphaFactor,
        //     blendDstAlpha: THREE.ZeroFactor,
        //     blendSrc: THREE.ZeroFactor,
        //     blendSrcAlpha: THREE.ZeroFactor,

        //     vertexShader:   quadclearv,
        //     fragmentShader: quadclearf,
        // });

        window.addEventListener("mousemove", onMouseMove);
    
        clock.start();
        animate();
    }


    window.addEventListener("mousedown", function() {
        mouseDown = true;
    });
    window.addEventListener("mouseup", function() {
        mouseDown = false;
    });

    window.addEventListener("resize", () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        
        lineMaterial.uniforms.uResolution.value = new THREE.Vector2(innerWidth, innerHeight);
        sparkleMaterial.uniforms.uResolution.value = new THREE.Vector2(innerWidth, innerHeight);
        aspectRatio = innerWidth / innerHeight;

        renderer.setSize( window.innerWidth, window.innerHeight );
    }); 
}

let followCumulative = 0;
let velocityExp      = 0;
function animate(now) {
    requestAnimationFrame(animate);

    now *= 0.001;

    // DON'T MOVE THE ORDER OF THESE TWO CALLS
    let delta = clock.getDelta();
    let time  = clock.getElapsedTime();


    followCumulative = followCumulative * 0.92 + cumulativeUvy * 0.08;
    if(isNaN(followCumulative)) followCumulative = 0;
    followCumulative = Math.min(followCumulative, cumulativeUvy - 0.1);


    lineMaterial.uniforms.uTime.value = time;
    lineMaterial.uniforms.uUVYheadStart.value  = followCumulative; // cumulativeUvy - 0.1;
    lineMaterial.uniforms.uUVYheadLength.value = cumulativeUvy - followCumulative; //0.1;
    lineMaterial.uniforms.uCumulativeY.value   = cumulativeUvy; //0.1;



    if(mouseDown) {
        mouseMixer += delta * 10;
        mouseMixer = Math.min(mouseMixer, 1); 
    } else {
        mouseMixer -= delta * 10;
        mouseMixer = Math.max(mouseMixer, 0); 
    }



    let atd = 0.01;
    textureDisp = textureDisp.clone().multiplyScalar(1-atd).add(lastTextureDisp.clone().multiplyScalar(atd));
    lineMaterial.uniforms.uMouseTextureDisp.value = textureDisp;



    let a = lineExpFactor;
    // because of the exponential averaging of lastMousePos,  minDistBeforeActivation is probably broken
    // and wont behave the way I've intended to
    let minDistBeforeActivation = 0.00;//0.0075;

    let newPos = vec3(
        currMousePos.x * a + lastMousePos.x * (1-a),
        currMousePos.y * a + lastMousePos.y * (1-a),
        currMousePos.z * a + lastMousePos.z * (1-a),
    );
    
    let dist = lastMousePos.distanceTo(newPos);

    velocityExp = velocityExp * speedExpFactor + dist * (1-speedExpFactor);


    if(dist > minDistBeforeActivation) {
        cumulativeUvy += dist;// * ( 7 + Math.sin(cumulativeUvy * 5 + time * 3) * 3 );
        if(isNaN(cumulativeUvy)) cumulativeUvy = 0;
        
        // prevents the first point from being interpolated with vec3(0,0,0)
        if(linePoints.length === 0) {
            newPos = currMousePos;
            velocityExp = 0;
        }

        let velocityOpacity = Math.min(velocityExp * 40, 1);
        linePoints.push({
            v: newPos,
            opacity: 1,
            velocityOpacity: velocityOpacity,
            uvy: cumulativeUvy,
            mouseMixer: mouseMixer,
        });

        // console.log(velocityOpacity.toFixed(2));



        let num = Math.floor((dist + 0.01) * sparklesCount);
        let rs  = 5;
        let sparkleBackDir = lastMousePos.clone().sub(newPos).normalize().multiplyScalar(0.1);
        for(let i = 0; i < num; i++)
        sparkles.push({
            v: newPos.clone().add(vec3(Math.random() * 0.2 - 0.1, Math.random() * 0.2 - 0.1, 0)).add(sparkleBackDir),
            opacity: 0.8 * velocityOpacity,
            mouseMixer: mouseMixer,
            vel: lastMousePos.clone().add(newPos).normalize().add(vec3(Math.random() * - rs + rs * 0.5, Math.random() * - rs + rs * 0.5, Math.random() * - rs + rs * 0.5)).multiplyScalar(0.0025),
            size: 0.0025 + Math.random() * 0.01,
        });



        // let minimumSpeedToShowShafts = 0.01;
        // if(dist > minimumSpeedToShowShafts) {
        //     let shaftdir = lastMousePos.clone().sub(newPos).normalize();
        //     shaftdir = vec3(-shaftdir.y, shaftdir.x);
        //     if(Math.random() > 0.5) {
        //         shaftdir.negate();
        //     }
        //     let shaftorigin = lastMousePos.clone().sub(shaftdir.clone().multiplyScalar(0 + 0.1 * Math.random()));
        //     let normal = lastMousePos.clone().sub(newPos).normalize();
        //     for(let i = 0; i < 20; i++)
        //     lightShafts.push({
        //         v:   shaftorigin.clone().add(normal.clone().multiplyScalar(Math.random() * 0.2)),
        //         dir: shaftdir,
        //         opacity: 1,
        //         n:   normal,
        //         lenMult: Math.random(),
        //         mouseMixer: mouseMixer,
        //     });
        // }

        lastMousePos = newPos;    
    }
    

    updateOpacity(delta);
    // constructLightShaftGeometry();
    constructSparkleGeometry();
    constructGeometry();


    // lightShaftMaterial.transparent = true;
    // lightShaftMaterial.blending = THREE.CustomBlending;
    // lightShaftMaterial.blendSrc = THREE.OneFactor;
    // lightShaftMaterial.blendDst = THREE.OneFactor;
    // lightShaftMaterial.blendSrcAlpha = THREE.OneFactor;
    // lightShaftMaterial.blendDstAlpha = THREE.OneFactor;
    // // renderer.render(scene, camera);

    // if(scene.getObjectByName("line"))
    //     scene.getObjectByName("line").material.visible = false;
    // if(scene.getObjectByName("sparkles"))
    //     scene.getObjectByName("sparkles").material.visible = false;
    // if(scene.getObjectByName("lightShafts"))
    //     scene.getObjectByName("lightShafts").material.visible = true;   
    // renderer.render(scene, camera);

    // scene.background = undefined;
    // if(scene.getObjectByName("line"))
    //     scene.getObjectByName("line").material.visible = true;
    // if(scene.getObjectByName("sparkles"))
    //     scene.getObjectByName("sparkles").material.visible = true;
    // if(scene.getObjectByName("lightShafts"))
    //     scene.getObjectByName("lightShafts").material.visible = false;
    renderer.render(scene, camera);
}

// let omncesaf = 0;
function updateOpacity(delta) {
    for(let linePoint of linePoints) {
        linePoint.opacity -= delta * opacityDecrement;
    }
    // this filter routine might need a modification to solve TODO .1
    linePoints = linePoints.filter((e, i) => { 

        // if(e.opacity < -0.2 && omncesaf === 0) {
        //     console.log(linePoints[0] === e);
        //     console.log(e);
        //     omncesaf = 1;
        // }

        // we can't delete an element if the successor still has some opacity left, this can cause little artifacts 
        // if we move lines really fast
        if(linePoints.length > (i+1)) {
            return e.opacity > -0.2 || linePoints[i+1].opacity > -0.2;
        }

        return e.opacity > -0.2;
    });


    for(let sparkle of sparkles) {
        sparkle.opacity -= delta * opacityDecrement * 1.54;
    }
    // this filter routine might need a modification to solve TODO .1
    sparkles = sparkles.filter((e) => e.opacity > 0);


    for(let lightShaft of lightShafts) {
        lightShaft.opacity -= delta * 1.385;
    }
    // this filter routine might need a modification to solve TODO .1
    lightShafts = lightShafts.filter((e) => e.opacity > 0);
}

function constructGeometry() {
    
    // this has to run at the beginning of the function otherwise we run the risk of never deleting stale lines
    let prevMesh = scene.getObjectByName("line");
    if(prevMesh) {
        scene.remove(prevMesh);
    }

    // this if-statement might need a modification to solve TODO .1
    if(linePoints.length < 3) return;

    let newPoints = []
    function CubicInterpolate(y0, y1, y2, y3, mu) {
        let a0,a1,a2,a3,mu2;
     
        mu2 = mu*mu;
     
        a0 = -0.5*y0 + 1.5*y1 - 1.5*y2 + 0.5*y3;
        a1 = y0 - 2.5*y1 + 2*y2 - 0.5*y3;
        a2 = -0.5*y0 + 0.5*y2;
        a3 = y1;

        return(a0*mu*mu2+a1*mu2+a2*mu+a3);
    }

    // create fake first element if necessary
    linePoints.splice(0, 0, {
        v: linePoints[0].v.clone().add(  linePoints[1].v.clone().sub(linePoints[0].v).normalize().multiplyScalar(-0.02)  ),
        opacity: linePoints[0].opacity,
        velocityOpacity: linePoints[0].velocityOpacity,
    });

   
    // cube spline new points
    for(let i = 1; i < linePoints.length-2; i++) {
        let p0 = linePoints[i-1].v;
        let p1 = linePoints[i].v;
        let p2 = linePoints[i+1].v;
        let p3 = linePoints[i+2].v;

        let n0 = p0.clone().sub(p1).normalize();
        let n1 = p1.clone().sub(p2).normalize();
        let n2 = p2.clone().sub(p3).normalize();

        let uvy1 = linePoints[i].uvy;
        let uvy2 = linePoints[i+1].uvy;
        
        let vo1 = linePoints[i].velocityOpacity;
        let vo2 = linePoints[i+1].velocityOpacity;

        let mm1 = linePoints[i].mouseMixer;
        let mm2 = linePoints[i+1].mouseMixer;

        let dot1 = n0.dot(n1);
        let dot2 = n0.dot(n2);
        let biggestProblematicDot = dot1 < dot2 ? dot1 : dot2;

        let dotT = ((biggestProblematicDot * -1) + 1) / 2;

        let o0 = linePoints[i].opacity;
        let o1 = linePoints[i+1].opacity;

        let segments = Math.max(30 * dotT, 1);

        // these two lines below seems to solve a very obscure bug that drove me crazy for 2 hours
        let js = 1;
        if(i===1) js = 0;
        
        for(let j = js; j <= segments; j++) {
            let mu = j / segments;

            let x = CubicInterpolate(p0.x, p1.x, p2.x, p3.x, mu);
            let y = CubicInterpolate(p0.y, p1.y, p2.y, p3.y, mu);
            
            let o = o0 * (1-mu) + o1 * mu; 

            newPoints.push({
                v: vec3(x, y, 0),
                opacity: o,
                velocityOpacity: vo1 * (1-mu) + vo2 * mu,
                uvy: uvy1 * (1-mu) + uvy2 * mu,
                mouseMixer: mm1 * (1-mu) + mm2 * mu,
            });

        }
    }

    // delete fake first element
    linePoints.shift();        


    // compute initially intermediary normals, the normals at the begin and the end of the trail will be handled separately
    for(let i = 1; i < newPoints.length - 1; i++) {
        let p0 = newPoints[i-1].v;
        let p1 = newPoints[i].v;
        let p2 = newPoints[i+1].v;

        let pn = p0.clone().sub(p2).normalize();
        let n = vec3(-pn.y, pn.x, 0);
        newPoints[i].n = n;
    }

    // tail normal
    {
        let p0 = newPoints[0].v;
        let p1 = newPoints[1].v;

        let pn = p0.clone().sub(p1).normalize();
        let n = vec3(-pn.y, pn.x, 0);
        newPoints[0].n = n;
    }
    
    // head normal
    {
        let p0 = newPoints[newPoints.length - 2].v;
        let p1 = newPoints[newPoints.length - 1].v;

        let pn = p0.clone().sub(p1).normalize();
        let n = vec3(-pn.y, pn.x, 0);
        newPoints[newPoints.length - 1].n = n;
    }
    
    
    // construct geometry
    let vertices = [];
    let uvs = [];
    let fxs = [];
    for(let i = 0; i < newPoints.length - 1; i++) {
        let p1 = newPoints[i].v;
        let p2 = newPoints[i+1].v;

        let mm1 = newPoints[i].mouseMixer;
        let mm2 = newPoints[i+1].mouseMixer;

        let uvy1 = newPoints[i].uvy;
        let uvy2 = newPoints[i+1].uvy;
        
        let n1 = newPoints[i].n;
        let n2 = newPoints[i+1].n;

        let v1 = vec3(0,0,0);
        let v2 = vec3(0,0,0);
        let v3 = vec3(0,0,0);
        let v4 = vec3(0,0,0);

        
        v1.copy(p1.clone().sub(n1.clone().multiplyScalar(lineSize)));
        v2.copy(p1.clone().add(n1.clone().multiplyScalar(lineSize)));

        v3.copy(p2.clone().sub(n2.clone().multiplyScalar(lineSize)));
        v4.copy(p2.clone().add(n2.clone().multiplyScalar(lineSize)));


        let lineDirv1 = v3.clone().sub(v1);
        let lineDirv2 = v4.clone().sub(v2);
        let lineDirv3 = v3.clone().sub(v1);
        let lineDirv4 = v4.clone().sub(v2);
        if(i < newPoints.length - 2) {
            let v5 = vec3(0,0,0);
            let v6 = vec3(0,0,0);
            v5.copy(newPoints[i+2].v.clone().sub(newPoints[i+2].n.clone().multiplyScalar(lineSize)));
            v6.copy(newPoints[i+2].v.clone().add(newPoints[i+2].n.clone().multiplyScalar(lineSize)));

            lineDirv3 = v5.clone().sub(v3);
            lineDirv4 = v6.clone().sub(v4);
        }


        vertices.push(v1.x, v1.y, v1.z);
        vertices.push(v2.x, v2.y, v2.z);
        vertices.push(v3.x, v3.y, v3.z);

        vertices.push(v2.x, v2.y, v2.z);
        vertices.push(v3.x, v3.y, v3.z);
        vertices.push(v4.x, v4.y, v4.z);

        uvs.push(1, uvy1);
        uvs.push(0, uvy1);
        uvs.push(1, uvy2);

        uvs.push(0, uvy1);
        uvs.push(1, uvy2);
        uvs.push(0, uvy2);

        fxs.push(newPoints[i].opacity   * newPoints[i].velocityOpacity  ,   mm1, lineDirv1.x, lineDirv1.y);
        fxs.push(newPoints[i].opacity   * newPoints[i].velocityOpacity  ,   mm1, lineDirv2.x, lineDirv2.y);
        fxs.push(newPoints[i+1].opacity * newPoints[i+1].velocityOpacity, mm2, lineDirv3.x, lineDirv3.y);

        fxs.push(newPoints[i].opacity   * newPoints[i].velocityOpacity  ,   mm1, lineDirv2.x, lineDirv2.y);
        fxs.push(newPoints[i+1].opacity * newPoints[i+1].velocityOpacity, mm2, lineDirv3.x, lineDirv3.y);
        fxs.push(newPoints[i+1].opacity * newPoints[i+1].velocityOpacity, mm2, lineDirv4.x, lineDirv4.y);

    }


    let geometry = new THREE.BufferGeometry();
    geometry.addAttribute( 'position', new THREE.BufferAttribute( new Float32Array(vertices), 3 ) );
    geometry.addAttribute( 'fx', new THREE.BufferAttribute( new Float32Array(fxs), 4 ) );
    geometry.addAttribute( 'uv', new THREE.BufferAttribute( new Float32Array(uvs), 2 ) );
    let mesh = new THREE.Mesh( geometry, lineMaterial );
    mesh.name = "line";

    
    scene.add(mesh);

    // if(window.maxv === undefined) window.maxv = 0;
    // if(window.maxv < (vertices.length / 3)) {
    //     window.maxv = vertices.length / 3;
    //     console.log(window.maxv);
    // }
}

function constructSparkleGeometry() {

    // update velocities
    for(let i = 0; i < sparkles.length - 1; i++) {
        let sparkle = sparkles[i];
        sparkle.vel.x *= 0.97;
        sparkle.vel.y *= 0.97;

        sparkle.v.add(sparkle.vel);
    }

    // construct geometry
    let vertices = [];
    let fxs = [];
    for(let i = 0; i < sparkles.length - 1; i++) {
        let sparkle = sparkles[i];
        let v = sparkle.v;
        let mm = sparkle.mouseMixer;
        let size = sparkle.size;

        let opacity = sparkle.opacity;
        if(opacity > 0.7) {
            opacity = 1 - (opacity - 0.7) / 0.3;
        } else {
            opacity = (opacity / 0.7);            
        }

        opacity *= 0.7;

        vertices.push(v.x, v.y, v.z);
        fxs.push(opacity, mm, size, 0);
    }


    var geometry = new THREE.BufferGeometry();
    geometry.addAttribute( 'position', new THREE.BufferAttribute( new Float32Array(vertices), 3 ) );
    geometry.addAttribute( 'fx', new THREE.BufferAttribute( new Float32Array(fxs), 4 ) );
    var mesh = new THREE.Points( geometry, sparkleMaterial );
    mesh.name = "sparkles";

    let prevMesh = scene.getObjectByName("sparkles");
    if(prevMesh) {
        scene.remove(prevMesh);
    }

    scene.add(mesh);
}

function constructLightShaftGeometry() {
    // construct geometry
    let vertices = [];
    let uvs = [];
    let fxs = [];
    for(let i = 0; i < lightShafts.length; i++) {
        let lightShaft = lightShafts[i];
        let v = lightShaft.v;
        let dir = lightShaft.dir;
        let mm = lightShaft.mouseMixer;
        let strength = lightShaft.strength;
        // let mm = lightShaft.mouseMixer;

        let shaftSide = 0.05;
        let shaftLength = 0.1 + lightShaft.lenMult * 0.2;
        let n = lightShaft.n;

        let v1 = v.clone().add(n.clone().multiplyScalar(shaftSide));
        let v2 = v.clone().sub(n.clone().multiplyScalar(shaftSide));
        let v3 = v.clone().add(dir.clone().multiplyScalar(shaftLength)).add(n.clone().multiplyScalar(shaftSide));
        let v4 = v.clone().add(dir.clone().multiplyScalar(shaftLength)).sub(n.clone().multiplyScalar(shaftSide));

        let opacity = lightShaft.opacity;

        vertices.push(v1.x, v1.y, v1.z);
        vertices.push(v2.x, v2.y, v2.z);
        vertices.push(v3.x, v3.y, v3.z);

        vertices.push(v2.x, v2.y, v2.z);
        vertices.push(v3.x, v3.y, v3.z);
        vertices.push(v4.x, v4.y, v4.z);

        uvs.push(0, 0);
        uvs.push(1, 0);
        uvs.push(0, 1);

        uvs.push(1, 0);
        uvs.push(0, 1);
        uvs.push(1, 1);

        fxs.push(opacity, mm, n.x, n.y);
        fxs.push(opacity, mm, n.x, n.y);
        fxs.push(opacity, mm, n.x, n.y);

        fxs.push(opacity, mm, n.x, n.y);
        fxs.push(opacity, mm, n.x, n.y);
        fxs.push(opacity, mm, n.x, n.y);
    }

    var geometry = new THREE.BufferGeometry();
    geometry.addAttribute( 'position', new THREE.BufferAttribute( new Float32Array(vertices), 3 ) );
    geometry.addAttribute( 'uv', new THREE.BufferAttribute( new Float32Array(uvs), 2 ) );
    geometry.addAttribute( 'fx', new THREE.BufferAttribute( new Float32Array(fxs), 4 ) );
    var mesh = new THREE.Mesh( geometry, lightShaftMaterial );
    mesh.name = "lightShafts";

    var clearMesh = new THREE.Mesh(new THREE.PlaneBufferGeometry(2,2), quadClearMaterial);
    clearMesh.name = "quadClear";

    let prevMesh = scene.getObjectByName("lightShafts");
    let prevMesh2 = scene.getObjectByName("quadClear");
    if(prevMesh) {
        scene.remove(prevMesh);
    }
    if(prevMesh2) {
        scene.remove(prevMesh2);
    }

    scene.add(mesh);
    scene.add(clearMesh);
}


let currMousePos = vec3(0,0,0);
let lastMousePos = vec3(0,0,0);
let textureDisp  = new THREE.Vector2(0, 0);
let lastTextureDisp = new THREE.Vector2(0, 0);

function onMouseMove(e) {

    let ux = (e.clientX / innerWidth) * 2 - 1;
    let uy = ((innerHeight - e.clientY) / innerHeight) * 2 - 1;

    let v = vec3(ux * aspectRatio, uy, 0);

    currMousePos = v;

    lastTextureDisp = new THREE.Vector2(ux, uy);
}

export default LegendaryCursor;