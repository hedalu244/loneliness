import p5 from "p5";

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

function n_array<T>(length: number, map: (v: unknown, k: number) => T): T[] {
    return Array.from({ length: length }, map)
}

class Level {
    initial_board: Board;
    height: number;
    width: number;

    board: Board; // 門番付き

    history: Board[];
    anim_queue: BoardAnimation[]
    anim_starttime: number

    constructor(initial_board: Board) {
        this.width = initial_board.length;
        this.height = initial_board[0].length;
        this.initial_board = initial_board;

        this.board = initial_board;

        this.history = []
        this.anim_queue = []
        this.anim_starttime = performance.now()

        this.init()
    }

    // 門番を付けて初期化
    init() {
        const new_board: Cell[][] = n_array(this.width + 2, () => n_array(this.height + 2, () => Cell.Wall));

        for (let i = 0; i < this.width; i++)
            for (let j = 0; j < this.height; j++)
                new_board[i + 1][j + 1] = this.initial_board[i][j];

        this.board = new_board;
        this.history.push(this.board);

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

    show() {
        console.log(this.history.map(x => JSON.stringify(x)).join("\n"))
        console.log(this.board.map(x => JSON.stringify(x)).join("\n"))
        console.log(this.anim_queue.map(x => JSON.stringify(x)).join("\n"))
    }

    draw(p: p5) {
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

        p.background(220);
        p.fill(0)
        p.rect(0, 0, (this.width + 1) * 30, (this.height + 1) * 30);
        for (let i = 1; i <= this.width; i++)
            for (let j = 1; j <= this.height; j++) {
                const [offsetx, offsety] = move_offset(anim_elapsetime, this.anim_queue[0].move[i][j])
                switch (this.anim_queue[0].board[i][j]) {
                    case Cell.Free: {
                        p.fill("white");
                        p.ellipse((i + offsetx) * 30, (j + offsety) * 30, 30);
                    } break;
                    case Cell.Wall: {
                        p.fill("White");
                        p.ellipse((i + offsetx) * 30, (j + offsety) * 30, 10);
                    } break;
                    case Cell.Fixed: {
                        p.fill("white");
                        p.ellipse((i + offsetx) * 30, (j + offsety) * 30, 30);
                        p.fill("Black");
                        p.ellipse((i + offsetx) * 30, (j + offsety) * 30, 10);
                    } break;
                }
            }
    }
}

function test() {
    const level = new Level([
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
        }
    }

    p.setup = () => {
        p.createCanvas(400, 400);
        document.addEventListener("keydown", keyDown, false);
    };

    const level = new Level([
        [0, 3, 0, 3],
        [0, 2, 0, 0],
        [0, 0, 2, 3],
    ])

    p.draw = () => {
        p.background(220);
        level.draw(p)
    }
};

new p5(sketch);