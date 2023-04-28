import p5 from "p5";

function n_array<T>(length: number, map: (v: unknown, k: number) => T): T[] {
    return Array.from({ length: length }, map)
}

class UnionFind {
    parent: number[];
    rank: number[];

    constructor(N: number) {
        this.rank = n_array(N, () => 0);
        this.parent = n_array(N, (v, k) => k);
    }
    root(i: number): number {
        if (this.parent[i] == i)
            return i;

        const root = this.root(this.parent[i]);
        this.parent[i] = root;
        return root;
    }
    unite(a: number, b: number): void {
        a = this.root(a);
        b = this.root(b);
        if (a == b)
            return;

        if (this.rank[a] < this.rank[b])
            this.parent[a] = b;
        else {
            this.parent[b] = a;
            if (this.rank[b] == this.rank[a])
                this.rank[a] += 1;
        }
    }
}

const Cell = {
    Empty: 0,
    Wall: 1,
    Free: 2,
    Fixed: 3,
} as const;
type Cell = typeof Cell[keyof typeof Cell];
type Board = readonly (readonly Cell[])[]

const Direction = {
    None: 0,
    Left: 1,
    Right: 2,
    Up: 3,
    Down: 4,
} as const;

type Direction = typeof Direction[keyof typeof Direction];

type BoardAnimation = {
    board: Board,
    move: Direction[][],
}

function isBlob(x: Cell): boolean {
    return x == Cell.Free || x == Cell.Fixed;
}

class Level {
    initial_board: Board;
    height: number;
    width: number;
    cell_size: number;

    board: Board; // 門番付き

    history: Board[];
    anim_queue: BoardAnimation[]
    anim_starttime: number

    title: string

    constructor(title: string, initial_board: Board) {
        this.title = title

        this.width = initial_board.length;
        this.height = initial_board[0].length;
        this.initial_board = initial_board;
        this.cell_size = 80;

        this.history = [];
        this.anim_queue = [];
        this.anim_starttime = performance.now();

        this.init()
    }

    // 門番を付けて初期化
    init() {
        const new_board: Cell[][] = n_array(this.width + 2, () => n_array(this.height + 2, () => Cell.Wall));

        for (let i = 0; i < this.width; i++)
            for (let j = 0; j < this.height; j++)
                new_board[i + 1][j + 1] = this.initial_board[i][j];

        if (this.board)
            this.history.push(this.board);
        this.board = new_board;

        this.anim_queue.push({
            board: this.board,
            move: n_array(this.width + 2, () => n_array(this.height + 2, () => Direction.None)),
        })
        this.show()
    }
    move(direction: Direction) {
        console.log("move", direction)
        const new_board: Cell[][] = n_array(this.width + 2, () => n_array(this.height + 2, () => Cell.Wall))
        const move_direction: Direction[][] = n_array(this.width + 2, () => n_array(this.height + 2, () => Direction.None))

        // 何かしらの更新があったらtrue
        let move_flag = false;

        for (let i = 1; i <= this.width; i++)
            for (let j = 1; j <= this.height; j++)
                new_board[i][j] = this.board[i][j];

        switch (direction) {
            case Direction.Up: {
                for (let i = 1; i <= this.width; i++)
                    for (let j = 1; j <= this.height; j++) // 左の行から決定
                        if (new_board[i][j - 1] == Cell.Empty && new_board[i][j] == Cell.Free) {
                            new_board[i][j - 1] = Cell.Free;
                            new_board[i][j] = Cell.Empty;
                            move_direction[i][j - 1] = Direction.Up
                            move_flag = true;
                        }
            } break;
            case Direction.Down: {
                for (let i = 1; i <= this.width; i++)
                    for (let j = this.height; 1 <= j; j--) // 右の行から決定
                        if (new_board[i][j + 1] == Cell.Empty && new_board[i][j] == Cell.Free) {
                            new_board[i][j + 1] = Cell.Free;
                            new_board[i][j] = Cell.Empty;
                            move_direction[i][j + 1] = Direction.Down
                            move_flag = true;
                        }
            } break;
            case Direction.Left: {
                for (let i = 1; i <= this.width; i++) // 上の行から決定
                    for (let j = 1; j <= this.height; j++)
                        if (new_board[i - 1][j] == Cell.Empty && new_board[i][j] == Cell.Free) {
                            new_board[i - 1][j] = Cell.Free;
                            new_board[i][j] = Cell.Empty;
                            move_direction[i - 1][j] = Direction.Left;
                            move_flag = true;
                        }
            } break;
            case Direction.Right: {
                for (let i = this.width; 1 <= i; i--) // 下の行から決定
                    for (let j = 1; j <= this.height; j++)
                        if (new_board[i + 1][j] == Cell.Empty && new_board[i][j] == Cell.Free) {
                            new_board[i + 1][j] = Cell.Free;
                            new_board[i][j] = Cell.Empty;
                            move_direction[i + 1][j] = Direction.Right;
                            move_flag = true;
                        }
            } break;
        }

        if (move_flag) {
            this.history.push(this.board);
            this.board = new_board;
            this.show()
        }
        else {
            console.log("can't move")
        }
        this.anim_queue.push({ board: this.board, move: move_direction })
    }

    undo() {
        console.log("undo")
        let history = this.history.pop()
        if (history == undefined) {
            console.log("cant undo")
            return;
        }

        this.board = history

        this.anim_queue.push({
            board: this.board,
            move: n_array(this.width + 2, () => n_array(this.height + 2, () => Direction.None)),
        })
        this.show()
    }

    check() {
        // DSU構築
        const uf = new UnionFind(this.width * this.height);
        let lastBlob = 0;
        for (let i = 0; i < this.width; i++)
            for (let j = 0; j < this.height; j++) {
                const x = this.board[i + 1][j + 1];
                const u = this.board[i + 2][j + 1];
                const l = this.board[i + 1][j + 2];

                const xid = i * this.height + j;
                const uid = (i + 1) * this.height + j;
                const lid = i * this.height + j + 1;

                if (isBlob(x)) lastBlob = xid;
                if (isBlob(x) && isBlob(u))
                    uf.unite(xid, uid);
                if (isBlob(x) && isBlob(l))
                    uf.unite(xid, lid);
            }

        // 1つでも lastBlobと連結していない blob があれば false
        for (let i = 0; i < this.width; i++)
            for (let j = 0; j < this.height; j++) {
                const x = this.board[i + 1][j + 1];
                const xid = i * this.height + j;
                if (isBlob(x) && uf.root(xid) != uf.root(lastBlob))
                    return false;
            }
        return true;
    }


    show() {
        console.log(this.history.map(x => JSON.stringify(x)).join("\n"))
        console.log(this.board.map(x => JSON.stringify(x)).join("\n"))
        console.log(this.anim_queue.map(x => JSON.stringify(x)).join("\n"))
    }

    draw(renderer: Renderer) {
        if (1 < this.anim_queue.length && this.anim_starttime + 200 < performance.now()) {
            this.anim_queue.shift()
            this.anim_starttime = performance.now()
        }
        const anim_elapsetime = performance.now() - this.anim_starttime;

        // t = アニメーション開始からの経過時間
        // t=0で-1, 60 < tで0, 間はsmoothstep
        function move_offset(t: number, dir: Direction) {
            if (dir == Direction.None) return [0, 0]
            if (200 < t) return [0, 0];
            const x = t / 200;
            const amount = x * x * (3 - 2 * x) - 1;

            switch (dir) {
                case Direction.Left:
                    return [-amount, 0];
                case Direction.Right:
                    return [amount, 0];
                case Direction.Up:
                    return [0, -amount];
                case Direction.Down:
                    return [0, amount];
            }
        }

        renderer.bgScr.noStroke()
        renderer.bgScr.background(this.check() ? 150 : 220);
        renderer.bgScr.fill(180);
        renderer.bgScr.rect(
            renderer.p.width / 2,
            renderer.p.height / 2,
            (this.width + 0.40) * this.cell_size,
            (this.height + 0.40) * this.cell_size);
            
        renderer.bgScr.fill(30);
        renderer.bgScr.textSize(32);
        renderer.bgScr.text(this.title, 20, 50);
        
        renderer.clear()

        for (let i = 1; i <= this.width; i++)
            for (let j = 1; j <= this.height; j++) {
                const [offsetx, offsety] = move_offset(anim_elapsetime, this.anim_queue[0].move[i][j])
                switch (this.anim_queue[0].board[i][j]) {
                    case Cell.Wall: {
                        renderer.addDot(
                            (i - this.width / 2 - 0.5) * this.cell_size,
                            (j - this.height / 2 - 0.5) * this.cell_size,
                            0, this.cell_size * 0.12, "white");
                    } break;
                    case Cell.Free: {
                        renderer.addBlob(
                            (i + offsetx - this.width / 2 - 0.5) * this.cell_size,
                            (j + offsety - this.height / 2 - 0.5) * this.cell_size,
                            0, this.cell_size * 0.42);
                    } break;
                    case Cell.Fixed: {
                        renderer.addBlob(
                            (i + offsetx - this.width / 2 - 0.5) * this.cell_size,
                            (j + offsety - this.height / 2 - 0.5) * this.cell_size,
                            0, this.cell_size * 0.42);
                        renderer.addDot(
                            (i - this.width / 2 - 0.5) * this.cell_size,
                            (j - this.height / 2 - 0.5) * this.cell_size,
                            0, this.cell_size * 0.12, "black");
                    } break;
                }
            }

        renderer.render();
    }
}

function test() {
    const level = new Level(
        "01.\nTUTRIAL", [
        [0, 3, 0, 3],
        [0, 2, 0, 0],
        [0, 0, 2, 3],
        [0, 0, 1, 0],
    ])

    level.move(Direction.Left);
    level.move(Direction.Right);
    level.move(Direction.Up);
    level.move(Direction.Down);
    level.undo()
}

test()

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

class Renderer {
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

const sketch = (p: p5) => {
    function keyDown(event: KeyboardEvent) {
        if (event.repeat) return;
        console.log(event.code);
        switch (event.code) {
            case "ArrowLeft": {
                level.move(Direction.Left);
            } break;
            case "ArrowRight": {
                level.move(Direction.Right);
            } break;
            case "ArrowUp": {
                level.move(Direction.Up);
            } break;
            case "ArrowDown": {
                level.move(Direction.Down);
            } break;
            case "KeyZ": {
                level.undo();
            } break;
            case "KeyR": {
                level.init();
            } break;
        }
    }

    let renderer: Renderer;
    const level = new Level(
        "01.\nTUTRIAL", [
        n_array(6, () => Math.floor(Math.random() * 4)),
        n_array(6, () => Math.floor(Math.random() * 4)),
        n_array(6, () => Math.floor(Math.random() * 4)),
        n_array(6, () => Math.floor(Math.random() * 4)),
        n_array(6, () => Math.floor(Math.random() * 4)),
        n_array(6, () => Math.floor(Math.random() * 4)),
    ])

    p.setup = () => {
        p.createCanvas(800, 800, p.WEBGL);
        renderer = new Renderer(p);
        renderer.setBlobArea(level.width * level.cell_size, level.height * level.cell_size, level.cell_size * 0.46)
        document.addEventListener("keydown", keyDown, false);
    };


    p.draw = () => {
        p.background(220);
        level.draw(renderer);
        //p.noLoop();
    }
};

new p5(sketch);