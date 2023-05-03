import { n_array, UnionFind, Direction, elastic, rotate_matrix } from "./algorithm";
import { Asset } from "./asset";
import { Renderer } from "./renderer";

export const Cell = {
    Empty: 0,
    Wall: 1,
    Free: 2,
    Fixed: 3,
    Player: 4,
} as const;
export type Cell = typeof Cell[keyof typeof Cell];
export type Board = Cell[][]

type BoardAnimation = {
    board: Board,
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

        // 左の場合だけ書けばよい
        const [_width, _height] = direction == Direction.Up || direction == Direction.Down ? [this.width, this.height] : [this.height, this.width];
        const _board =
            direction == Direction.Right ? rotate_matrix(this.board, 1) :
                direction == Direction.Down ? rotate_matrix(this.board, 2) :
                    direction == Direction.Left ? rotate_matrix(this.board, 3) :
                        rotate_matrix(this.board, 4);

        const move_check: boolean[][] = n_array(_width + 2, () => n_array(_height + 2, () => false))
        let move_flag = false;

        for (let i = 1; i <= _width; i++) {
            for (let j = 1; j <= _height; j++) {
                if (_board[i][j] == Cell.Free && move_check[i][j - 1])
                    move_check[i][j] = move_flag = true;
                if (_board[i][j] == Cell.Player && (move_check[i][j - 1] || _board[i][j - 1] == Cell.Empty))
                    move_check[i][j] = move_flag = true;
            }
        }

        const new_board: Cell[][] = n_array(_width + 2, i => n_array(_height + 2, j => _board[i][j]));
        const move_direction: Direction[][] = n_array(_width + 2, () => n_array(_height + 2, () => Direction.None))

        for (let i = 1; i <= _width; i++)
            for (let j = 1; j <= _height; j++) {
                if (move_check[i][j + 1]) {
                    new_board[i][j] = _board[i][j + 1]
                    move_direction[i][j] = direction;
                }
                else if (move_check[i][j]) {
                    new_board[i][j] = Cell.Empty;
                }
            }

        if (move_flag) {
            this.history.push(this.board);
            this.board =
                direction == Direction.Right ? rotate_matrix(new_board, 3) :
                    direction == Direction.Down ? rotate_matrix(new_board, 2) :
                        direction == Direction.Left ? rotate_matrix(new_board, 1) :
                            rotate_matrix(new_board, 0);
            this.anim_queue.push({
                board: this.board,
                move:
                    direction == Direction.Right ? rotate_matrix(move_direction, 3) :
                        direction == Direction.Down ? rotate_matrix(move_direction, 2) :
                            direction == Direction.Left ? rotate_matrix(move_direction, 1) :
                                rotate_matrix(move_direction, 0),
                type: direction,
            });
            this.show()
        }
        else {
            console.log("can't move")
        }
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
            total_delay = 200 + each_delay * (this.width - 1);
        else if (this.anim_queue[0].type == Direction.Up || this.anim_queue[0].type == Direction.Down)
            total_delay = 200 + each_delay * (this.height - 1);
        else
            total_delay = 0;

        if (1 < this.anim_queue.length && this.anim_starttime + total_delay < performance.now()) {
            this.anim_queue.shift()
            this.anim_starttime = performance.now()
        }
        const anim_elapsetime = performance.now() - this.anim_starttime;

        renderer.setBlobArea(
            (this.width + 0.5) * this.cell_size,
            (this.height + 0.5) * this.cell_size,
            this.cell_size * 0.46
        );

        renderer.bgScr.noStroke();
        renderer.bgScr.fill(Asset.black);
        /*
        renderer.bgScr.noStroke()
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

                if (this.anim_queue[0].board[i][j] != Cell.Wall) {
                    renderer.bgScr.rect(
                        fixedX + renderer.p.width / 2,
                        fixedY + renderer.p.height / 2,
                        1.20 * this.cell_size,
                        1.20 * this.cell_size);
                }

                switch (this.anim_queue[0].board[i][j]) {
                    case Cell.Wall: {
                        // renderer.addDot(fixedX, fixedY, 0, this.cell_size * 0.12, "white");
                    } break;
                    case Cell.Free: {
                        renderer.addBlob(animX, animY, 0, this.cell_size * 0.42);
                    } break;
                    case Cell.Fixed: {
                        renderer.addBlob(animX, animY, 0, this.cell_size * 0.42);
                        renderer.addDot(animX, animY, 0, this.cell_size * 0.12, "black");
                    } break;
                    case Cell.Player: {
                        renderer.addBlob(animX, animY, 0, this.cell_size * 0.42);
                        renderer.addDot(animX, animY, 0, this.cell_size * 0.17, "black");
                    } break;
                }
            }
    }
}