import { n_array, UnionFind, Direction, hermite } from "./algorithm";
import { Asset } from "./asset";
import { Renderer } from "./renderer";

export const Cell = {
    Empty: 0,
    Wall: 1,
    Free: 2,
    Fixed: 3,
} as const;
export type Cell = typeof Cell[keyof typeof Cell];
export type Board = readonly (readonly Cell[])[]

type BoardAnimation = {
    board: Board,
    move: Direction[][],
    type: Direction;
}

function isBlob(x: Cell): boolean {
    return x == Cell.Free || x == Cell.Fixed;
}

export class Game {
    initial_board: Board;
    height: number;
    width: number;
    cell_size: number;

    board: Board; // 門番付き

    history: Board[];
    anim_queue: BoardAnimation[]
    anim_starttime: number;

    constructor(initial_board: Board) {
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
            type: Direction.None,
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
        this.anim_queue.push({
            board: this.board, 
            move: move_direction,
            type: direction,
        })
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
            type: Direction.None
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
        const each_delay = 50;
        
        let total_delay;
        if (this.anim_queue[0].type == Direction.Left || this.anim_queue[0].type == Direction.Right)
            total_delay = each_delay * (this.width - 1);
        else if (this.anim_queue[0].type == Direction.Up || this.anim_queue[0].type == Direction.Down)
            total_delay = each_delay * (this.height - 1);
        else
            total_delay = 0;
        
        if (1 < this.anim_queue.length && this.anim_starttime + 200 + total_delay < performance.now()) {
            this.anim_queue.shift()
            this.anim_starttime = performance.now()
        }
        const anim_elapsetime = performance.now() - this.anim_starttime;

        // t = アニメーション開始からの経過時間
        // t=0で-1, 60 < tで0, 間はsmoothstep
        function move_offset(t: number, dir: Direction) {
            if (dir == Direction.None) return [0, 0]
            const amount = hermite(-1, 0, t / 200, 5.0, 1.0);

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

        renderer.setBlobArea(this.width * this.cell_size, this.height * this.cell_size, this.cell_size * 0.46);
        renderer.bgScr.noStroke()
        
        //*
        renderer.bgScr.fill(Asset.black);
        renderer.bgScr.rect(
            renderer.p.width / 2,
            renderer.p.height / 2,
            (this.width + 0.40) * this.cell_size,
            (this.height + 0.40) * this.cell_size);
        //*/
        
        renderer.clear()
        for (let i = 1; i <= this.width; i++)
            for (let j = 1; j <= this.height; j++) {
                const delay = [0, i, this.width - i - 1, j, this.height - j - 1][this.anim_queue[0].type] * 20;
                const [offsetx, offsety] = move_offset(anim_elapsetime - delay, this.anim_queue[0].move[i][j]);

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
    }
}