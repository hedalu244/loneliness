import p5 from "p5";
import { Asset } from "./asset";

interface Blob {
    x: number,
    y: number,
    z: number,
    r: number,
}
interface Dot {
    x: number,
    y: number,
    z: number,
    r: number,
    color: "black" | "white";
}

interface Emission {
    x: number,
    y: number,
    r: number,
}

export class Renderer {
    static p: p5;
    static needUpdate: boolean;
    static lastNeedUpdate: boolean;
    static lastSimplified: boolean;
    static lastRenderTimestamp: number;

    static blobShader05: p5.Shader;
    static blobShader10: p5.Shader;
    static blobShader15: p5.Shader;
    static blobShader20: p5.Shader;
    static blobScr: p5.Graphics;

    static fxaaShader: p5.Shader;
    static fxaaScr: p5.Graphics;

    static floorShader: p5.Shader; // mainScr

    static bgScr: p5.Graphics;
    static mainScr: p5.Graphics;

    static filterScr: p5.Graphics;
    static BlurShader: p5.Shader;
    static lensShader: p5.Shader;

    static fade: number;
    static offsetX: number;
    static offsetY: number;

    static shadow80: p5.Image;

    static readonly lightingFS = `
    precision highp float;

    const vec3 light_dir = normalize(vec3(0.5, -0.5, -0.707));
    const vec3 directional = vec3(0.3);
    const vec3 ambient = vec3(0.6);

    vec3 lighting(vec3 color, vec3 normal, float shadow) {
        vec3 lambert = max(0., dot(normal, light_dir)) * shadow * directional;

        float f = min(1., 1. + normal.z);
        float f2 = f * f;
        vec3 fresnel = f * f2 * f2 * ambient * 0.3;

        return (lambert + ambient) * color + fresnel;
    }`;

    static readonly ScreenVS = `
    precision highp float;

    attribute vec3 aPosition;
    attribute vec2 aTexCoord;
    varying vec2 uv;

    void main() {
        vec4 position = vec4(aPosition.xy, 1.0, 1.0);

        gl_Position = position;
        uv = aTexCoord;
    }`;
    static readonly blobFS = `
    varying vec2 uv;
    uniform vec2 res;
    uniform float smooth_param;

    const int 	TRACE_STEPS 		= 10;
    const float TRACE_EPSILON 		= 1.;
    const float TRACE_DISTANCE		= 50.0;
    const float NORMAL_EPSILON		= 0.01;

    uniform vec4 blobs[NUM_BLOBS];

    const vec3 blobColor = vec3(1.0);

    float smin(float a, float b, float k) {
        float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
        return mix(b, a, h) - k * h * (1.0 - h);
    } 

    float blobs_field(vec3 at) {
        float sum = TRACE_DISTANCE;
        for (int i = 0; i < NUM_BLOBS; ++i) {
            if (blobs[i].w == 0.) continue;
            float r = length(blobs[i].xyz - at) - blobs[i].w;
            sum = smin(sum, r, smooth_param);
        }
        return sum;
    }

    vec3 normal(vec3 at) {
        vec2 e = vec2(0.0, NORMAL_EPSILON);
        return normalize(vec3(blobs_field(at + e.yxx) - blobs_field(at), 
                              blobs_field(at + e.xyx) - blobs_field(at),
                              blobs_field(at + e.xxy) - blobs_field(at)));
    }

    vec4 raymarch(vec3 pos, vec3 dir) {
        float l = 0.;
        for (int i = 0; i < TRACE_STEPS; i++) {
            float d = blobs_field(pos + dir * l);
            if (d < TRACE_EPSILON)
                break;
            l += d;
            if (l > TRACE_DISTANCE) break;
        }
        return vec4(pos + dir * l, l);
    }

    void main() {
        vec3 eye = vec3((uv - 0.5) * res, -TRACE_DISTANCE);
        vec3 dir = vec3(0, 0, 1);
        
        vec4 pos = raymarch(eye, dir);

        if (pos.w >= TRACE_DISTANCE) {
            gl_FragColor = vec4(0, 0, 0, 0);
            return;
        }
        else {
            vec3 n = normal(pos.xyz);
            gl_FragColor = vec4(lighting(blobColor, n, 1.0), 1.0);
        }
    }`;
    static readonly fxaaFS = `
    precision highp float;
    
    varying vec2 uv;
    uniform vec2 res;
    
    uniform sampler2D tex;

    float lum(vec4 color) {
        return dot(color, vec4(0.299, 0.587, 0.114, 1.));
    }
    
    void main() {
        //FXAA
        vec4 center = texture2D(tex, uv);
    
        vec2 px = 1.0 / res.xy;    
        float lumC = lum(center);
        float lumL = lum(texture2D(tex, uv + vec2(-0.5, 0) * px));
        float lumR = lum(texture2D(tex, uv + vec2( 0.5, 0) * px));
        float lumT = lum(texture2D(tex, uv + vec2( 0, -0.5) * px));
        float lumB = lum(texture2D(tex, uv + vec2( 0,  0.5) * px));
        
        float maxlum = max(max(max(lumL, lumR), max(lumT, lumB)), lumC);
        float minlum = min(min(min(lumL, lumR), min(lumT, lumB)), lumC);
    
        vec2 dir = normalize(vec2(lumB - lumT, lumL - lumR));
        
        vec2 alignedDir = abs(dir.x) < 0.5 ? vec2(0, dir.y / (dir.x + 0.001))
                        : abs(dir.y) < 0.5 ? vec2(dir.x / (dir.y + 0.001), 0) : dir;
        //vec2 alignedDir = dir * dir * dir / (dir.yx + 0.01);
        
        vec2 offset1 = clamp(alignedDir, -0.5, 0.5) * px;
        vec2 offset2 = clamp(alignedDir, -1.5, 1.5) * px;
        
        vec4 rgbN1 = texture2D(tex, uv - offset1);
        vec4 rgbP1 = texture2D(tex, uv + offset1);
        vec4 rgbN2 = texture2D(tex, uv - offset2);
        vec4 rgbP2 = texture2D(tex, uv + offset2);
        
        vec4 AA1 = (rgbN1 + rgbP1) * 0.5;
        vec4 AA2 = (rgbN1 + rgbP1 + rgbN2 + rgbP2) * 0.25;
        
        float lumAA2 = lum(AA2);
        gl_FragColor = (minlum < lumAA2 && lumAA2 < maxlum) ? AA2 : AA1;

        // gl_FragColor.rgb = 0. < gl_FragColor.a ? gl_FragColor.rgb / gl_FragColor.a : gl_FragColor.rgb;
    }`;

    static readonly lensFS = `
    precision highp float;
    
    varying vec2 uv;
    uniform vec2 res;
    
    uniform sampler2D tex;
    uniform float fade;
    uniform vec2 offset;

    const vec3 fade_color = vec3(0.88);

    float distort(float x, float a, float fix) {
        return (pow(a, x) - 1.) / (pow(a, fix) - 1.);
    }

    float random(vec2 uv) {
        return fract(sin(dot(uv.xy ,vec2(12.9898,78.233))) * 43758.5453);
    }
    
    void main() {
        vec2 duv = uv - 0.5;

        float l = length(duv);
        duv = duv * distort(l, 1.1, 1.) / l;

        float r = texture2D(tex, duv * 1.012 + 0.5 + offset).r;
        float g = texture2D(tex, duv * 1.006 + 0.5 + offset).g;
        float b = texture2D(tex, duv * 1.000 + 0.5 + offset).b;
        vec3 color = mix(vec3(r, g, b), fade_color, fade);

        float vignette = 1. - l * 0.2;
        float noise = random(uv) * 0.008 - 0.004;

        gl_FragColor = vec4(color * vignette + noise, 1);
    }`;

    static readonly blurFS = `
    precision highp float;
    
    varying vec2 uv;
    uniform vec2 res;
    
    uniform sampler2D tex;
    
    void main() {
        vec4 x = texture2D(tex, uv);

        vec2 duv = (uv - 0.5) * 0.004;
        vec2 cuv = duv.yx * vec2(1, -1);
        vec4 a = texture2D(tex, uv + duv);
        vec4 b = texture2D(tex, uv - duv);
        vec4 c = texture2D(tex, uv + cuv);
        vec4 d = texture2D(tex, uv - cuv);

        gl_FragColor = vec4((x + x + a + b + c + d).rgb * .1667, 1);
    }`;

    static blobs: Blob[];
    static dots: Dot[];
    static emissions: Emission[];
    static smooth_scale: number;

    static init(p: p5) {
        Renderer.needUpdate = true;
        Renderer.lastRenderTimestamp = performance.now();
        Renderer.lastSimplified = true;
        Renderer.lastNeedUpdate = true;

        Renderer.p = p;
        p.rectMode(p.CENTER);
        p.imageMode(p.CENTER);

        Renderer.bgScr = p.createGraphics(p.width, p.height);
        Renderer.bgScr.rectMode(p.CENTER);
        Renderer.bgScr.imageMode(p.CENTER);

        Renderer.blobScr = Renderer.p.createGraphics(p.width, p.height, Renderer.p.WEBGL);
        Renderer.blobScr.setAttributes('alpha', true);
        Renderer.blobShader05 = Renderer.blobScr.createShader(Renderer.ScreenVS, Renderer.lightingFS + Renderer.blobFS.split("NUM_BLOBS").join("5"));
        Renderer.blobShader10 = Renderer.blobScr.createShader(Renderer.ScreenVS, Renderer.lightingFS + Renderer.blobFS.split("NUM_BLOBS").join("10"));
        Renderer.blobShader15 = Renderer.blobScr.createShader(Renderer.ScreenVS, Renderer.lightingFS + Renderer.blobFS.split("NUM_BLOBS").join("15"));
        Renderer.blobShader20 = Renderer.blobScr.createShader(Renderer.ScreenVS, Renderer.lightingFS + Renderer.blobFS.split("NUM_BLOBS").join("20"));

        Renderer.fxaaScr = Renderer.p.createGraphics(p.width, p.height, Renderer.p.WEBGL);
        Renderer.fxaaScr.setAttributes("depth", false);
        Renderer.fxaaScr.setAttributes('alpha', true);
        Renderer.fxaaShader = Renderer.fxaaScr.createShader(Renderer.ScreenVS, Renderer.fxaaFS);

        Renderer.mainScr = p.createGraphics(p.width, p.height, Renderer.p.WEBGL);
        Renderer.mainScr.rectMode(p.CENTER);
        Renderer.mainScr.imageMode(p.CENTER);
        Renderer.mainScr.noStroke();
        Renderer.mainScr.setAttributes("depth", false);

        Renderer.filterScr = p.createGraphics(p.width, p.height, Renderer.p.WEBGL);
        Renderer.filterScr.rectMode(p.CENTER);
        Renderer.filterScr.imageMode(p.CENTER);

        Renderer.lensShader = Renderer.filterScr.createShader(Renderer.ScreenVS, Renderer.lensFS);
        Renderer.lensShader.setUniform('res', [Renderer.mainScr.width, Renderer.mainScr.height]);

        Renderer.BlurShader = Renderer.filterScr.createShader(Renderer.ScreenVS, Renderer.blurFS);
        Renderer.BlurShader.setUniform('res', [Renderer.mainScr.width, Renderer.mainScr.height]);

        Renderer.setBlobArea(p.width, p.height, 0);
        Renderer.setFade(0);
        Renderer.setOffset(0, 0);
        Renderer.clear();
    }

    static clear() {
        Renderer.blobs = [];
        Renderer.dots = [];
        Renderer.emissions = [];
    }

    static addBlob(x: number, y: number, z: number, r: number) {
        Renderer.blobs.push({ x, y, z, r });
    }

    static addDot(x: number, y: number, z: number, r: number, color: "black" | "white") {
        Renderer.dots.push({ x, y, z, r, color });
    }

    static addEmission(x: number, y: number, r: number) {
        Renderer.emissions.push({ x, y, r });
    }

    /// fadeRate: 0～1の薄めぐあい
    static render() {
        const lastFrameTime = performance.now() - Renderer.lastRenderTimestamp;
        Renderer.lastRenderTimestamp = performance.now();

        if (!Renderer.lastSimplified && !Renderer.lastNeedUpdate) {
            Renderer.lastNeedUpdate = Renderer.needUpdate;
            Renderer.needUpdate = false;
            return;
        }
        
        console.log("updated", "fxaa", lastFrameTime < 60 || !Renderer.lastNeedUpdate, "blur", lastFrameTime < 120 || !Renderer.lastNeedUpdate);

        Renderer.p.background(255);

        Renderer.renderFloor();
        Renderer.renderBlob();

        if (lastFrameTime < 60 || !Renderer.lastNeedUpdate) Renderer.renderFxaa();
        else Renderer.renderNoFxaa();
        Renderer.renderDot();
        Renderer.renderEmission();
        Renderer.renderFilter();

        if (lastFrameTime < 120 || !Renderer.lastNeedUpdate) Renderer.renderBlur();

        Renderer.p.image(Renderer.mainScr, Renderer.p.width / 2, Renderer.p.height / 2);

        Renderer.lastSimplified = !(lastFrameTime < 60 || !Renderer.lastNeedUpdate);

        Renderer.lastNeedUpdate = Renderer.needUpdate;
        Renderer.needUpdate = false;
    }

    // bgScr => mainScr
    static renderFloor() {
        // (light_dir.z * directional * shadow + ambient) * color;
        // (0.707 * 0.3 + 0.6)
        // light　0.8121 207
        // shadow 0.6    153

        Renderer.mainScr.clear(0, 0, 0, 0);
        Renderer.mainScr.background(207);

        Renderer.blobs.forEach(a => Renderer.mainScr.image(
            Asset.shadow80,
            a.x - a.z, a.y + a.z,
            Asset.shadow80.width / 40 * a.r,
            Asset.shadow80.height / 40 * a.r)
        );

        Renderer.mainScr.blendMode(Renderer.p.MULTIPLY);
        Renderer.mainScr.image(Renderer.bgScr, 0, 0);
        Renderer.mainScr.blendMode(Renderer.p.BLEND);
    }

    // blob => blobScr
    static renderBlob() {
        if (Renderer.blobs.length == 0) {
            Renderer.blobScr.clear(0, 0, 0, 0);
            return;
        }
        const blob_params: number[] = [];
        Renderer.blobs.forEach(a => blob_params.push(a.x, a.y, 0, a.r))
        while (blob_params.length % 20 != 0)
            blob_params.push(0);

        const blobShader =
            Renderer.blobs.length <= 5 ? Renderer.blobShader05 :
                Renderer.blobs.length <= 10 ? Renderer.blobShader10 :
                    Renderer.blobs.length <= 15 ? Renderer.blobShader15 : Renderer.blobShader20;

        Renderer.blobScr.clear(0, 0, 0, 0);
        Renderer.blobScr.noStroke();
        Renderer.blobScr.shader(blobShader);
        blobShader.setUniform('blobs', blob_params);
        Renderer.blobScr.quad(-1, 1, 1, 1, 1, -1, -1, -1);
    }

    // dot => blobScr
    static renderDot() {
        Renderer.dots.forEach(a => Renderer.mainScr.image(Asset.dot, a.x, a.y, a.r * 2, a.r * 2));
    }

    static renderEmission() {
        Renderer.mainScr.resetShader();
        Renderer.mainScr.blendMode(Renderer.p.ADD);
        Renderer.emissions.forEach(a => {
            Renderer.mainScr.image(Asset.emmision80, a.x, a.y, Asset.emmision80.width / 40 * a.r, Asset.emmision80.width / 40 * a.r);
        });
        Renderer.mainScr.blendMode(Renderer.p.BLEND);
    }

    // blobScr => fxaaScr => mainScr
    static renderFxaa() {
        Renderer.fxaaScr.clear(0, 0, 0, 0);
        Renderer.fxaaScr.noStroke();
        Renderer.fxaaScr.shader(Renderer.fxaaShader);
        Renderer.fxaaShader.setUniform('tex', Renderer.blobScr);
        Renderer.fxaaScr.quad(-1, 1, 1, 1, 1, -1, -1, -1);

        Renderer.mainScr.resetShader();
        Renderer.mainScr.image(Renderer.fxaaScr, 0, 0);
    }

    static renderNoFxaa() {
        Renderer.mainScr.resetShader();
        Renderer.mainScr.image(Renderer.blobScr, 0, 0);
    }

    static renderFilter() {
        Renderer.filterScr.clear(0, 0, 0, 0);
        Renderer.filterScr.noStroke();
        Renderer.filterScr.shader(Renderer.lensShader);
        Renderer.lensShader.setUniform('tex', Renderer.mainScr);
        Renderer.filterScr.quad(-1, 1, 1, 1, 1, -1, -1, -1);

        Renderer.mainScr.clear(0, 0, 0, 0)
        Renderer.mainScr.image(Renderer.filterScr, 0, 0, 0, 0);
    }

    static renderBlur() {
        Renderer.filterScr.clear(0, 0, 0, 0);
        Renderer.filterScr.noStroke();
        Renderer.filterScr.shader(Renderer.BlurShader);
        Renderer.BlurShader.setUniform('tex', Renderer.mainScr);
        Renderer.filterScr.quad(-1, 1, 1, 1, 1, -1, -1, -1);

        Renderer.mainScr.clear(0, 0, 0, 0)
        Renderer.mainScr.image(Renderer.filterScr, 0, 0, 0, 0);
    }

    static setBlobArea(width: number, height: number, smooth_scale: number) {
        Renderer.smooth_scale = smooth_scale;

        if (Renderer.blobScr.width == width && Renderer.blobScr.height == height)
            return;

        //does not work
        //Renderer.blobScr.size(width, height);
        //Renderer.fxaaScr.size(width, height);

        //*
        Renderer.blobScr.width = width;
        Renderer.blobScr.height = height;
        Renderer.blobScr.ortho(-width / 2, width / 2, -height / 2, height / 2);
        Renderer.fxaaScr.width = width;
        Renderer.fxaaScr.height = height;

        Renderer.blobScr.shader(Renderer.blobShader05);
        Renderer.blobShader05.setUniform('res', [width, height]);
        Renderer.blobShader05.setUniform('smooth_param', smooth_scale);

        Renderer.blobScr.shader(Renderer.blobShader10);
        Renderer.blobShader10.setUniform('res', [width, height]);
        Renderer.blobShader10.setUniform('smooth_param', smooth_scale);

        Renderer.blobScr.shader(Renderer.blobShader15);
        Renderer.blobShader15.setUniform('res', [width, height]);
        Renderer.blobShader15.setUniform('smooth_param', smooth_scale);

        Renderer.blobScr.shader(Renderer.blobShader20);
        Renderer.blobShader20.setUniform('res', [width, height]);
        Renderer.blobShader20.setUniform('smooth_param', smooth_scale);

        Renderer.fxaaScr.shader(Renderer.fxaaShader);
        Renderer.fxaaShader.setUniform('res', [width, height]);
        //*/
    }

    static resize(width: number, height: number) {
        Renderer.bgScr.width = width
        Renderer.bgScr.height = height

        Renderer.mainScr.width = width
        Renderer.mainScr.height = height

        Renderer.filterScr.width = width
        Renderer.filterScr.height = height
    }

    static setFade(fade: number) {
        Renderer.fade = fade;
        Renderer.lensShader.setUniform('fade', Renderer.fade);
    }
    static setOffset(x: number, y: number) {
        Renderer.offsetX = x;
        Renderer.offsetY = y;
        Renderer.lensShader.setUniform('offset', [Renderer.offsetX, Renderer.offsetY]);
    }
}