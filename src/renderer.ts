import p5 from "p5";

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

export class Renderer {
    p: p5;
    blobShader: p5.Shader;
    blobScr: p5.Graphics;
    fxaaShader: p5.Shader;
    fxaaScr: p5.Graphics;

    bgScr: p5.Graphics;

    static readonly VS = `
    precision highp float;

    attribute vec3 aPosition;
    attribute vec2 aTexCoord;
    varying vec2 uv;

    void main() {
        vec4 position = vec4(aPosition, 1.0);

        gl_Position = position;
        uv = aTexCoord;
    }`;
    static readonly blobFS = `
    precision highp float;

    varying vec2 uv;
    uniform vec2 res;
    uniform float smooth_param;

    const vec3 light_dir = normalize(vec3(2.0, -4.0, -3.0));

    const int 	NUM_BLOBS			= 20;
    const int 	TRACE_STEPS 		= 100;
    const float TRACE_EPSILON 		= 0.001;
    const float TRACE_DISTANCE		= 200.0;
    const float NORMAL_EPSILON		= 0.01;

    uniform vec4 blobs[NUM_BLOBS];

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
        vec3 eye = vec3((uv - 0.5) * res, -100);
        vec3 dir = vec3(0, 0, 1);
        
        vec4 pos = raymarch(eye, dir);

        if (pos.w >= TRACE_DISTANCE) {
            gl_FragColor = vec4(0, 0, 0, 0);
            return;
        }
        else {
            gl_FragColor = vec4(1, 1, 1, 1);
            vec3 n = normal(pos.xyz);
            float lambert = max(0., dot(n, light_dir)) * 0.5;
            float ambient = 0.5;
            float f = min(1., 1. + n.z);
            float f2 = f * f;
            float fresnel = f * f2 * f2 * ambient;
            
            gl_FragColor = vec4(vec3(lambert + ambient + fresnel), 1.);
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

    blobs: Blob[];
    dots: Dot[];
    smooth_scale: number;

    constructor(p: p5) {
        this.p = p
        p.rectMode(p.CENTER);
        p.imageMode(p.CENTER);
        this.bgScr = p.createGraphics(p.width, p.height);
        this.bgScr.rectMode(p.CENTER);
        this.bgScr.imageMode(p.CENTER);

        this.setBlobArea(p.width, p.height, 0);

        this.blobs = []
    }

    clear() {
        this.blobs = [];
        this.dots = [];
    }

    addBlob(x: number, y: number, z: number, r: number) {
        this.blobs.push({ x, y, z, r });
    }

    addDot(x: number, y: number, z: number, r: number, color: "black" | "white") {
        this.dots.push({ x, y, z, r, color });
    }

    render() {
        this.p.image(this.bgScr, 0, 0);
        this.renderBlob();
        this.renderDot();
    }

    renderDot() {
        this.dots.forEach(a => {
            this.p.fill(a.color);
            this.p.noStroke();
            this.p.push();
            this.p.translate(a.x, a.y, a.z);
            this.p.sphere(a.r);
            this.p.pop();
        })
    }

    renderBlob() {
        const blob_params: number[] = [];
        this.blobs.forEach(a => blob_params.push(a.x, a.y, a.z, a.r))
        while (blob_params.length < 80)
            blob_params.push(0);

        this.blobScr.clear(0, 0, 0, 0);
        this.blobScr.shader(this.blobShader);
        this.blobShader.setUniform('blobs', blob_params);
        this.blobShader.setUniform('res', [this.blobScr.width, this.blobScr.height]);
        this.blobShader.setUniform('smooth_param', this.smooth_scale);
        this.blobScr.quad(-1, 1, 1, 1, 1, -1, -1, -1);
        
        this.fxaaScr.clear(0, 0, 0, 0);
        this.fxaaScr.shader(this.fxaaShader);
        this.fxaaShader.setUniform('res', [this.blobScr.width, this.blobScr.height]);
        this.fxaaShader.setUniform('tex', this.blobScr);
        this.fxaaScr.quad(-1, 1, 1, 1, 1, -1, -1, -1);
        
        this.p.image(this.fxaaScr, 0, 0)
    }

    setBlobArea(width: number, height: number, smooth_scale: number) {
        this.smooth_scale = smooth_scale;

        if (this.blobScr && this.blobScr.width == width && this.blobScr.height == height)
            return;

        if (this.blobScr) this.blobScr.remove()
        this.blobScr = this.p.createGraphics(width, height, this.p.WEBGL);
        this.blobScr.setAttributes('alpha', true);
        this.blobShader = this.blobScr.createShader(Renderer.VS, Renderer.blobFS);
        this.blobScr.shader(this.blobShader);

        if (this.fxaaScr) this.fxaaScr.remove()
        this.fxaaScr = this.p.createGraphics(width, height, this.p.WEBGL);
        this.fxaaScr.setAttributes('alpha', true);
        this.fxaaShader = this.fxaaScr.createShader(Renderer.VS, Renderer.fxaaFS);
        this.fxaaScr.shader(this.fxaaShader);
    }
}