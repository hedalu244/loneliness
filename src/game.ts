import { n_array, UnionFind, Direction, elastic, rotate_matrix } from "./algorithm";
import { Asset } from "./asset";
import { unit } from "./main";
import { Renderer } from "./renderer";

export const Cell = {
    Empty: 0,
    Wall: 1,
    Player: 2,
    Free: 3,
    Fixed: 4,
} as const;
export type Cell = typeof Cell[keyof typeof Cell];
export type Board = Cell[][]

type BoardAnimation = {
    board: Board,
    delay: number[][],
    move: Direction[][],
    type: Direction;
}

function isBlob(x: Cell): boolean {
    return x == Cell.Free || x == Cell.Player || x == Cell.Fixed;
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

        this.cell_size = Math.min(65 / this.width * unit, 50 / this.height * unit, 10 * unit);

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
            delay: n_array(this.width + 2, () => n_array(this.height + 2, () => 0)),
            move: n_array(this.width + 2, () => n_array(this.height + 2, () => Direction.None)),
            type: Direction.None,
        })
        this.show()
    }

    move(direction: Direction) {
        navigator.vibrate(120);

        console.log("move", direction)

        // 左の場合だけ書けばよい
        const [_width, _height] = direction == Direction.Up || direction == Direction.Down ? [this.width, this.height] : [this.height, this.width];
        const _board =rotate_matrix(this.board,
            direction == Direction.Right ? 1 :
                direction == Direction.Down ? 2 :
                    direction == Direction.Left ? 3 : 0);

        // 各セルが動くのか判定
        const move_check: number[][] = n_array(_width + 2, () => n_array(_height + 2, () => -1))
        let move_flag = false;

        for (let i = 1; i <= _width; i++) {
            let room = false; // 左端に余裕があるか
            for (let j = 1; j <= _height; j++) {
                if (_board[i][j] == Cell.Empty) room = true;
                if (_board[i][j] == Cell.Fixed || _board[i][j] == Cell.Wall) room = false;

                if (_board[i][j] == Cell.Player && room) {
                    move_flag = true;
                    move_check[i][j] = 0;
                    // 左が動く
                    for (let k = 1; _board[i][j - k] == Cell.Free; k++)
                        move_check[i][j - k] = k;
                    // 右が動く
                    for (let k = 1; _board[i][j + k] == Cell.Free; k++)
                        move_check[i][j + k] = k;
                }
            }
        }

        if (!move_flag) {
            console.log("can't move");
            return
        }

        // 判定に基づき、移動後の盤面を生成
        const new_board: Cell[][] = n_array(_width + 2, i => n_array(_height + 2, j => _board[i][j]));
        const move_direction: Direction[][] = n_array(_width + 2, () => n_array(_height + 2, () => Direction.None))
        const move_delay: number[][] = n_array(_width + 2, () => n_array(_height + 2, () => 0))

        for (let i = 1; i <= _width; i++)
            for (let j = 1; j <= _height; j++) {
                if (move_check[i][j + 1] != -1) {
                    new_board[i][j] = _board[i][j + 1]
                    move_direction[i][j] = direction;
                    move_delay[i][j] = move_check[i][j + 1];
                }
                else if (move_check[i][j] != -1) {
                    new_board[i][j] = Cell.Empty;
                }
            }

            
        // 履歴、アニメーションを更新
        this.history.push(this.board);
        this.board = rotate_matrix(new_board, 
            direction == Direction.Right ? 3 :
                direction == Direction.Down ? 2 :
                    direction == Direction.Left ? 1 : 0);
        this.anim_queue.push({
            board: this.board,
            delay:rotate_matrix(move_delay,
                direction == Direction.Right ? 3 :
                    direction == Direction.Down ? 2 :
                        direction == Direction.Left ? 1 : 0), 
            move: rotate_matrix(move_direction, 
                direction == Direction.Right ? 3 :
                    direction == Direction.Down ? 2 :
                        direction == Direction.Left ? 1 : 0),
            type: direction,
        });

        this.show()
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
            delay: n_array(this.width + 2, () => n_array(this.height + 2, () => 0)),
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

    draw() {
        const each_delay = 50;
        const total_delay = 250;

        if (1 < this.anim_queue.length && this.anim_starttime + total_delay < performance.now()) {
            this.anim_queue.shift();
            this.anim_starttime = performance.now();
            Asset.playMoveSound();
        }
        const anim_elapsetime = performance.now() - this.anim_starttime;

        Renderer.setBlobArea(
            (this.width + 0.5) * this.cell_size,
            (this.height + 0.5) * this.cell_size,
            this.cell_size * 0.46
        );

        Renderer.bgScr.noStroke();
        Renderer.bgScr.fill(Asset.black);
        /*
        Renderer.bgScr.noStroke()
        Renderer.bgScr.fill(Asset.black);
        Renderer.bgScr.rect(
            Renderer.p.width / 2,
            Renderer.p.height / 2,
            (this.width + 0.40) * this.cell_size,
            (this.height + 0.40) * this.cell_size);
        //*/

        Renderer.clear()
        for (let i = 1; i <= this.width; i++)
            for (let j = 1; j <= this.height; j++) {
                const delay = this.anim_queue[0].delay[i][j] * 20;

                const fixedX = (i - this.width / 2 - 0.5) * this.cell_size;
                const fixedY = (j - this.height / 2 - 0.5) * this.cell_size;

                const [prevX, prevY] =
                    this.anim_queue[0].move[i][j] == Direction.Left ? [fixedX + this.cell_size, fixedY] :
                        this.anim_queue[0].move[i][j] == Direction.Right ? [fixedX - this.cell_size, fixedY] :
                            this.anim_queue[0].move[i][j] == Direction.Up ? [fixedX, fixedY + this.cell_size] :
                                this.anim_queue[0].move[i][j] == Direction.Down ? [fixedX, fixedY - this.cell_size] :
                                    [fixedX, fixedY];

                const animX = elastic(prevX, fixedX, anim_elapsetime - delay);
                const animY = elastic(prevY, fixedY, anim_elapsetime - delay);
                
                //*
                if (this.anim_queue[0].board[i][j] != Cell.Wall) {
                    Renderer.bgScr.rect(
                        Math.floor(fixedX + Renderer.p.width / 2),
                        Math.floor(fixedY + Renderer.p.height / 2),
                        Math.floor(1.20 * this.cell_size),
                        Math.floor(1.20 * this.cell_size));
                }
                //*/

                switch (this.anim_queue[0].board[i][j]) {
                    case Cell.Wall: {
                        //Renderer.addDot(fixedX, fixedY, 0, this.cell_size * 0.12, "white");
                    } break;
                    case Cell.Free: {
                        Renderer.addBlob(animX, animY, this.cell_size * 0.6, this.cell_size * 0.42);
                    } break;
                    case Cell.Fixed: {
                        Renderer.addBlob(animX, animY, this.cell_size * 0.6, this.cell_size * 0.42);
                        Renderer.addDot(fixedX, fixedY, 0, this.cell_size * 0.12, "black");
                    } break;
                    case Cell.Player: {
                        Renderer.addBlob(animX, animY, this.cell_size * 0.6, this.cell_size * 0.42);
                        Renderer.addEmission(animX, animY, this.cell_size * 0.42);
                    } break;
                }
            }
    }
}