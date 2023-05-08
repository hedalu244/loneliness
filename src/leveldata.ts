import { Board, Cell } from "./game";

export interface LevelParam {
    title: string
    initial_board: Board;
    description_ja: string;
    description_en: string;
}

export function parseBoard(s : string): Board {
    function cell(x: number): Cell {
        for (let key in Cell)
            if (x == Cell[key]) return Cell[key];
        return Cell.Wall;
    }
    
    function transpose<T>(a: T[][]): T[][] {
        return a[0].map((_, c) => a.map(r => r[c]));
    }

    let initial_board = s.trim().split("\n").map(x => x.trim().split("").map(x => cell(+x)));
    const height = Math.max(...initial_board.map(x => x.length));
    initial_board.forEach(x => {
        while (x.length < height) x.push(1);
    });
    return transpose(initial_board);
}

export const leveldata: LevelParam[] = [
    {
        title: "Tutrial",
        description_ja: "すべてのカタマリを繋いでください。",
        description_en: "Connect all the blobs.",
        initial_board:parseBoard(`
            03103
            00000
            21300`
        )
    },{
        title: "Tutrial_2",
        description_ja: "固定されたカタマリは動かせません。",
        description_en: "A fixed blob cannot be moved.",
        initial_board: parseBoard(`
            30011
            20004
            30011`
        )
    },{
        title: "Castle", // かんたん、動きが面白い 
        description_ja: "これはテストです。",
        description_en: "this is test text.",
        initial_board: parseBoard(`
            11011
            10001
            40404
            30203
        `)
    },{
        title: "Raoundabout", // まあまあむず
        description_ja: "これはテストです。",
        description_en: "this is test text.",
        initial_board: parseBoard(`
            11313
            10000
            03401
            02300
            01001
        `)
    },{
        title: "Contact", // かなりむず
        description_ja: "これはテストです。",
        description_en: "this is test text.",
        initial_board: parseBoard(`
            30000
            00110
            10200
            30103
        `)
    },{
        title: "Line up", // 激むず。
        description_ja: "これはテストです。",
        description_en: "this is test text.",
        initial_board: parseBoard(`
            11001111
            11000311
            11100411
            40020330
            11001411
            11031111
        `)
    },{
        title: "Crowded", // たくさん。
        description_ja: "これはテストです。",
        description_en: "this is test text.",
        initial_board: parseBoard(`
            00413
            11000
            00000
            10024
            33333
        `)
    },{
        title: "Trapped", // まあまあむず 
        description_ja: "これはテストです。",
        description_en: "this is test text.",
        initial_board: parseBoard(`
            100200
            001000
            310001
            300431
            110031
        `)
    },{
        title: "Wing", // シンプル、ちょいかんたん
        description_ja: "これはテストです。",
        description_en: "this is test text.",
        initial_board: parseBoard(`
            03000
            10401
            40204
            00401
            03000
        `)
    },{
        title: "Presentation", // かんたん。プレボ
        description_ja: "これはテストです。",
        description_en: "this is test text.",
        initial_board: parseBoard(`
            001003
            301000
            030300
            100200
            300010
            001033
        `)
    },{
        title: "L", // シンプル、ちょいむず
        description_ja: "これはテストです。",
        description_en: "this is test text.",
        initial_board: parseBoard(`
            20111
            30111
            30000
            40004
        `)
    },{
        title: "Lumber", // シンプル、ちょいむず　大回り
        description_ja: "これはテストです。",
        description_en: "this is test text.",
        initial_board: parseBoard(`
            40004
            13230
            00101
            00000
        `)
    },{
        title: "3 Dotted", // まあまあ簡単
        description_ja: "これはテストです。",
        description_en: "this is test text.",
        initial_board: parseBoard(`
            03031
            40204
            10303
        `)
    },{
        title: "",
        description_ja: "これはテストです。",
        description_en: "this is test text.",
        initial_board: parseBoard(`
        `)
    },{
        title: "",
        description_ja: "これはテストです。",
        description_en: "this is test text.",
        initial_board: parseBoard(`
        `)
    },
];