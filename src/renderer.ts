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
    p: p5;
    needUpdate: boolean;
    lastRenderTimestamp: number;

    blobShader05: p5.Shader;
    blobShader10: p5.Shader;
    blobShader15: p5.Shader;
    blobShader20: p5.Shader;
    dotShader: p5.Shader;
    blobScr: p5.Graphics;

    fxaaShader: p5.Shader;
    fxaaScr: p5.Graphics;

    floorShader: p5.Shader; // mainScr

    bgScr: p5.Graphics;
    mainScr: p5.Graphics;

    filterScr: p5.Graphics;
    BlurShader: p5.Shader;
    lensShader: p5.Shader;

    fade: number;
    offsetX: number;
    offsetY: number;

    static shadow80: p5.Image;

    static readonly lightingFS = `
    precision highp float;

    const vec3 light_dir = normalize(vec3(0.5, -0.5, -0.707));
    const vec3 directional = vec3(0.4);
    const vec3 ambient = vec3(0.6);

    vec3 lighting(vec3 color, vec3 normal, float shadow) {
        vec3 lambert = max(0., dot(normal, light_dir)) * shadow * directional;

        float f = min(1., 1. + normal.z);
        float f2 = f * f;
        vec3 fresnel = f * f2 * f2 * ambient * 0.3;

        return (lambert + ambient) * color + fresnel;
    }`;

    static readonly dotVS = `
    attribute vec3 aPosition;
    attribute vec3 aNormal;
    attribute vec2 aTexCoord;
    attribute vec4 aVertexColor;
    
    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;
    uniform mat3 uNormalMatrix;
    
    uniform vec4 uMaterialColor;
    uniform bool uUseVertexColor;
    
    varying vec3 vVertexNormal;
    varying vec4 vColor;
    
    void main(void) {
        vec4 positionVec4 = vec4(aPosition, 1.0);
        gl_Position = uProjectionMatrix * uModelViewMatrix * positionVec4;
        vVertexNormal = normalize(vec3( uNormalMatrix * aNormal ));
        vColor = (uUseVertexColor ? aVertexColor : uMaterialColor);
    }`;
    static readonly dotFS = `
    varying vec3 vVertexNormal;
    varying vec4 vColor;

    void main(void) {
        vec3 n = vVertexNormal * vec3(1, 1, -1);
        gl_FragColor = vec4(lighting(vColor.rgb, n, 1.0), 1.0);
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

        gl_FragColor = vec4((a + a + b + c + d).rgb * .2, 1);
    }`;

    blobs: Blob[];
    dots: Dot[];
    emissions: Emission[];
    smooth_scale: number;

    constructor(p: p5) {
        this.needUpdate = true;
        this.lastRenderTimestamp = performance.now();

        this.p = p;
        p.rectMode(p.CENTER);
        p.imageMode(p.CENTER);

        this.bgScr = p.createGraphics(p.width, p.height);
        this.bgScr.rectMode(p.CENTER);
        this.bgScr.imageMode(p.CENTER);

        this.blobScr = this.p.createGraphics(p.width, p.height, this.p.WEBGL);
        this.blobScr.setAttributes('alpha', true);
        this.blobShader05 = this.blobScr.createShader(Renderer.ScreenVS, Renderer.lightingFS + Renderer.blobFS.split("NUM_BLOBS").join("5"));
        this.blobShader10 = this.blobScr.createShader(Renderer.ScreenVS, Renderer.lightingFS + Renderer.blobFS.split("NUM_BLOBS").join("10"));
        this.blobShader15 = this.blobScr.createShader(Renderer.ScreenVS, Renderer.lightingFS + Renderer.blobFS.split("NUM_BLOBS").join("15"));
        this.blobShader20 = this.blobScr.createShader(Renderer.ScreenVS, Renderer.lightingFS + Renderer.blobFS.split("NUM_BLOBS").join("20"));
        this.dotShader = this.blobScr.createShader(Renderer.dotVS, Renderer.lightingFS + Renderer.dotFS);

        this.fxaaScr = this.p.createGraphics(p.width, p.height, this.p.WEBGL);
        this.fxaaScr.setAttributes("depth", false);
        this.fxaaScr.setAttributes('alpha', true);
        this.fxaaShader = this.fxaaScr.createShader(Renderer.ScreenVS, Renderer.fxaaFS);

        this.mainScr = p.createGraphics(p.width, p.height, this.p.WEBGL);
        this.mainScr.noStroke();
        this.mainScr.setAttributes("depth", false);
        this.mainScr.rectMode(p.CENTER);
        this.mainScr.imageMode(p.CENTER);

        this.filterScr = p.createGraphics(p.width, p.height, this.p.WEBGL);
        this.filterScr.rectMode(p.CENTER);
        this.filterScr.imageMode(p.CENTER);

        this.lensShader = this.filterScr.createShader(Renderer.ScreenVS, Renderer.lensFS);
        this.lensShader.setUniform('res', [this.mainScr.width, this.mainScr.height]);

        this.BlurShader = this.filterScr.createShader(Renderer.ScreenVS, Renderer.blurFS);
        this.BlurShader.setUniform('res', [this.mainScr.width, this.mainScr.height]);

        this.setBlobArea(p.width, p.height, 0);
        this.setFade(0);
        this.setOffset(0, 0);
        this.clear();
    }

    clear() {
        this.blobs = [];
        this.dots = [];
        this.emissions = [];
    }

    addBlob(x: number, y: number, z: number, r: number) {
        this.blobs.push({ x, y, z, r });
    }

    addDot(x: number, y: number, z: number, r: number, color: "black" | "white") {
        this.dots.push({ x, y, z, r, color });
    }

    addEmission(x: number, y: number, r: number) {
        this.emissions.push({ x, y, r });
    }

    /// fadeRate: 0～1の薄めぐあい
    render() {

        const lastFrameTime = performance.now() - this.lastRenderTimestamp;
        this.lastRenderTimestamp = performance.now();
        
        if (!this.needUpdate)
            return;

        this.p.background(255);

        this.renderFloor()
        this.renderBlob();
        this.renderDot();

        if (lastFrameTime < 60) this.renderFxaa();
        else this.renderNoFxaa();

        this.renderEmission();
        this.renderFilter();

        if (lastFrameTime < 30) this.renderBlur();

        this.p.image(this.filterScr, this.p.width / 2, this.p.height / 2);

        this.needUpdate = false;
    }

    // bgScr => mainScr
    renderFloor() {
        // (light_dir.z * directional * shadow + ambient) * color;
        // light　0.8828 225
        // shadow 0.6    153

        this.mainScr.clear(0, 0, 0, 0);
        this.mainScr.background(225);

        this.blobs.forEach(a => this.mainScr.image(
            Asset.shadow80,
            a.x - a.z, a.y + a.z,
            Asset.shadow80.width / 40 * a.r,
            Asset.shadow80.height / 40 * a.r)
        );

        this.mainScr.blendMode(this.p.MULTIPLY);
        this.mainScr.image(this.bgScr, 0, 0);
        this.mainScr.blendMode(this.p.BLEND);
    }

    // blob => blobScr
    renderBlob() {
        if (this.blobs.length == 0) {
            this.blobScr.clear(0, 0, 0, 0);
            return;
        }
        const blob_params: number[] = [];
        this.blobs.forEach(a => blob_params.push(a.x, a.y, 0, a.r))
        while (blob_params.length % 20 != 0)
            blob_params.push(0);

        const blobShader =
            this.blobs.length <= 5 ? this.blobShader05 :
                this.blobs.length <= 10 ? this.blobShader10 :
                    this.blobs.length <= 15 ? this.blobShader15 : this.blobShader20;

        this.blobScr.clear(0, 0, 0, 0);
        this.blobScr.noStroke();
        this.blobScr.shader(blobShader);
        blobShader.setUniform('blobs', blob_params);
        this.blobScr.quad(-1, 1, 1, 1, 1, -1, -1, -1);
    }

    // dot => blobScr
    renderDot() {
        this.blobScr.shader(this.dotShader);
        this.blobScr.noStroke();
        this.dots.forEach(a => {
            this.blobScr.fill(a.color == "black" ? Asset.black : 255);
            this.blobScr.push();
            this.blobScr.translate(a.x, a.y, a.z);
            this.blobScr.sphere(a.r, 8, 8);
            this.blobScr.pop();
        });
    }

    renderEmission() {
        this.mainScr.resetShader();
        this.mainScr.blendMode(this.p.ADD);
        this.emissions.forEach(a => {
            this.mainScr.image(Asset.emmision80, a.x, a.y, Asset.emmision80.width / 40 * a.r, Asset.emmision80.width / 40 * a.r);
        });
        this.mainScr.blendMode(this.p.BLEND);
    }

    // blobScr => fxaaScr => mainScr
    renderFxaa() {
        this.fxaaScr.clear(0, 0, 0, 0);
        this.fxaaScr.noStroke();
        this.fxaaScr.shader(this.fxaaShader);
        this.fxaaShader.setUniform('tex', this.blobScr);
        this.fxaaScr.quad(-1, 1, 1, 1, 1, -1, -1, -1);

        this.mainScr.resetShader();
        this.mainScr.image(this.fxaaScr, 0, 0);
    }

    renderNoFxaa() {
        this.mainScr.resetShader();
        this.mainScr.image(this.blobScr, 0, 0);
    }

    renderFilter() {
        this.filterScr.clear(0, 0, 0, 0);
        this.filterScr.noStroke();
        this.filterScr.shader(this.lensShader);
        this.lensShader.setUniform('tex', this.mainScr);
        this.filterScr.quad(-1, 1, 1, 1, 1, -1, -1, -1);

        this.mainScr.clear(0, 0, 0, 0)
        this.mainScr.image(this.filterScr, 0, 0, 0, 0);
    }

    renderBlur() {
        this.filterScr.clear(0, 0, 0, 0);
        this.filterScr.noStroke();
        this.filterScr.shader(this.BlurShader);
        this.BlurShader.setUniform('tex', this.mainScr);
        this.filterScr.quad(-1, 1, 1, 1, 1, -1, -1, -1);

        this.mainScr.clear(0, 0, 0, 0)
        this.mainScr.image(this.filterScr, 0, 0, 0, 0);
    }

    setBlobArea(width: number, height: number, smooth_scale: number) {
        this.smooth_scale = smooth_scale;

        if (this.blobScr.width == width && this.blobScr.height == height)
            return;

        //does not work
        //this.blobScr.size(width, height);
        //this.fxaaScr.size(width, height);

        //*
        this.blobScr.width = width;
        this.blobScr.height = height;
        this.blobScr.ortho(-width / 2, width / 2, -height / 2, height / 2);
        this.fxaaScr.width = width;
        this.fxaaScr.height = height;

        this.blobScr.shader(this.blobShader05);
        this.blobShader05.setUniform('res', [width, height]);
        this.blobShader05.setUniform('smooth_param', smooth_scale);

        this.blobScr.shader(this.blobShader10);
        this.blobShader10.setUniform('res', [width, height]);
        this.blobShader10.setUniform('smooth_param', smooth_scale);

        this.blobScr.shader(this.blobShader15);
        this.blobShader15.setUniform('res', [width, height]);
        this.blobShader15.setUniform('smooth_param', smooth_scale);

        this.blobScr.shader(this.blobShader20);
        this.blobShader20.setUniform('res', [width, height]);
        this.blobShader20.setUniform('smooth_param', smooth_scale);

        this.fxaaScr.shader(this.fxaaShader);
        this.fxaaShader.setUniform('res', [width, height]);
        //*/
    }

    resize(width: number, height: number) {
        this.bgScr.width = width
        this.bgScr.height = height

        this.mainScr.width = width
        this.mainScr.height = height

        this.filterScr.width = width
        this.filterScr.height = height
    }

    setFade(fade: number) {
        this.fade = fade;
        this.lensShader.setUniform('fade', this.fade);
    }
    setOffset(x: number, y: number) {
        this.offsetX = x;
        this.offsetY = y;
        this.lensShader.setUniform('offset', [this.offsetX, this.offsetY]);
    }
}