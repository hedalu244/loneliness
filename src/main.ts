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
    Top: 3,
    Bottom: 4,
} as const;

type Direction = typeof Direction[keyof typeof Direction];

/*
const CellMove = {
    None: 0,
    Left: 1,
    Right: 2,
    Top: 3,
    Bottom: 4,
}
type CellMove = typeof CellMove[keyof typeof CellMove];

type BoardAnimation = {
    board: Cell[][],
    move: CellMove[][]
}
*/

function n_array<T>(length: number, map: (v: unknown, k: number) => T): T[] {
    return Array.from({ length: length }, map)
}

class Level {
    initial_board: Board;
    width: number;
    height: number;
    board: Board; // 門番付き
    history: Board[];

    constructor(initial_board: Board) {
        this.height = initial_board.length;
        this.width = initial_board[0].length;
        this.initial_board = initial_board;

        this.board = initial_board;
        this.history = []
        
        this.init()
    }

    // 門番を付けて初期化
    init() {
        const new_board: Cell[][] = n_array(this.height + 2, () => n_array(this.width + 2, () => Cell.Wall));

        for (let i = 0; i < this.height; i++)
            for (let j = 0; j < this.width; j++)
                new_board[i + 1][j + 1] = this.initial_board[i][j];

        this.board = new_board;
        this.history.push(this.board);
        this.show()
    }
    move(direction: Direction) {
        console.log("move", direction)
        const new_board: Cell[][] = n_array(this.height + 2, () => n_array(this.width + 2, () => Cell.Wall))

        // 何かしらの更新があったらtrue
        let move_flag = false;
        
        for (let i = 1; i <= this.height; i++)
            for (let j = 1; j <= this.width; j++)
                new_board[i][j] = this.board[i][j];
        
        switch (direction) {
            case Direction.Left: {
                for (let i = 1; i <= this.height; i++)
                    for (let j = 1; j <= this.width; j++) // 左の行から決定
                        if (new_board[i][j - 1] == Cell.Empty && new_board[i][j] == Cell.Free) {
                            new_board[i][j - 1] = Cell.Free;
                            new_board[i][j] = Cell.Empty;
                            move_flag = true;
                        }
            } break;
            case Direction.Right: {
                for (let i = 1; i <= this.height; i++)
                    for (let j = this.width; 1 <= j; j--) // 右の行から決定
                        if (new_board[i][j + 1] == Cell.Empty && new_board[i][j] == Cell.Free) {
                            new_board[i][j + 1] = Cell.Free;
                            new_board[i][j] = Cell.Empty;
                            move_flag = true;
                        }
            } break;
            case Direction.Top: {
                for (let i = 1; i <= this.height; i++) // 上の行から決定
                    for (let j = 1; j <= this.width; j++)
                        if (new_board[i - 1][j] == Cell.Empty && new_board[i][j] == Cell.Free) {
                            new_board[i - 1][j] = Cell.Free;
                            new_board[i][j] = Cell.Empty;
                            move_flag = true;
                        }
            } break;
            case Direction.Bottom: {
                for (let i = this.height; 1 <= i; i--) // 下の行から決定
                    for (let j = 1; j <= this.width; j++)
                        if (new_board[i + 1][j] == Cell.Empty && new_board[i][j] == Cell.Free) {
                            new_board[i + 1][j] = Cell.Free;
                            new_board[i][j] = Cell.Empty;
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
    }
    undo() {
        console.log("undo")
        let history = this.history.pop()
        if (history == undefined){
            console.log("cant undo")
            return;
        } 

        this.board = history
        this.show()
    }

    show() {
        console.log(this.history.map(x => JSON.stringify(x)).join("\n"))
        console.log(this.board.map(x => JSON.stringify(x)).join("\n"))
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
    level.move(Direction.Top);
    level.move(Direction.Bottom);
    level.undo()
}

test()

const sketch = (p: p5) => {
    p.setup = () => {
        p.createCanvas(400, 400);
    };

    p.draw = () => {
        p.background(220);
        p.ellipse(50, 50, 80, 80);
    };
};

new p5(sketch);