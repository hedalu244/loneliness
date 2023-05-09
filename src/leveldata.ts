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
    { // 1
        title: "First Step",
        description_ja: "カタマリは孤独を感じています。つなげてあげよう。",
        description_en: "Blobs feel lonely. Let's connect them.",
        initial_board:parseBoard(`
            03103
            00000
            21300`
        )
    },{ // 3
        title: "Obstinate",
        description_ja: "動かないカタマリもいます。",
        description_en: "Obstinate blobs cannot be moved.",
        initial_board: parseBoard(`
            30011
            00024
            30011`
        )
    },{ // 8
        title: "Breath", // かんたん、動きが面白い 
        description_ja: "焦りを感じたときは、深呼吸すると心が整います。",
        description_en: "If you feel impatient, take a deep breath.",
        initial_board: parseBoard(`
            11011
            10001
            40404
            30203
        `)
    },{ // 2
        title: "Isolated", // かんたん、面倒。プレボ
        description_ja: "孤独を感じるのは自然なことです。あなただけではありません。",
        description_en: "It is natural to feel lonely. It is not just your problem.",
        initial_board: parseBoard(`
            001003
            301000
            030300
            100200
            300010
            001033
        `)
    },{ // 5
        title: "Animals", // シンプル、ちょいかんたん
        description_ja: "ペットは癒しを与えてくれます。植物を育てるのも良いでしょう。",
        description_en: "Pets bring healing and security. So does growing plants.",
        initial_board: parseBoard(`
            03000
            10401
            40204
            00401
            03000
        `)
    },{ // 6
        title: "Hobbies", // まあまあ簡単 dotted
        description_ja: "興味を持てる趣味を見つけて、自分の時間を有意義にしよう。",
        description_en: "Find hobbies and make the most of your alone time.",
        initial_board: parseBoard(`
            03031
            40204
            10303
        `)
    },{ // 10
        title: "Roundabout", // まあまあむず
        description_ja: "自分の感情を表現する方法を見つけよう。日記、絵、音楽...",
        description_en: "Find ways to express your feelings. Diary, drawing, music...",
        initial_board: parseBoard(`
            11313
            10000
            03401
            02300
            01001
        `)
    },{ // 4
        title: "Crowded", // たくさん。
        description_ja: "友人が多いと別の問題が起きることもあります。",
        description_en: "Too many friends may cause other problems.",
        initial_board: parseBoard(`
            00413
            11000
            00000
            10024
            33333
        `)
    },{ // 7
        title: "Life", // シンプル、ちょいむず L
        description_ja: "適切な食事、簡単な運動、良い睡眠は、心を健康に保つ秘訣です。",
        description_en: "The right diet, exercise and sleep can keep your mind healthy.",
        initial_board: parseBoard(`
            20111
            30111
            30000
            40004
        `)
    },{ // 9
        title: "Contact", // かなりむず
        description_ja: "学びを追求しよう。学びはたくさんの刺激を与えてくれます。",
        description_en: "Let's pursue learning. Learning provides a lot of stimulation.",
        initial_board: parseBoard(`
            30000
            00110
            10200
            30103
        `)
    },{ // 11
        title: "Queue", // 激むず。
        description_ja: "目標を決めて努力してみよう。自己肯定につながります。",
        description_en: "Setting goals and making an effort for it is self-affirming.",
        initial_board: parseBoard(`
            11001111
            11000311
            11100411
            40020330
            11001411
            11031111
        `)
    },{ // 12
        title: "Trapped", // まあまあむず Trapped
        description_ja: "自分自身が何を求めているのか向き合ってみましょう。",
        description_en: "Face up to what you want from yourself.",
        initial_board: parseBoard(`
            100200
            001000
            310001
            300431
            110031
        `)
    },{ // 13
        title: "Loop", // シンプル、ちょいむず　大回り　Loop
        description_ja: "孤独を受け入れることが最初の一歩です。",
        description_en: "Accepting loneliness is the first step.",
        initial_board: parseBoard(`
            40004
            13230
            00101
            00000
        `)
    },{
        title: "",
        description_ja: "",
        description_en: "",
        initial_board: parseBoard(`
        `)
    },{
        title: "",
        description_ja: "",
        description_en: "",
        initial_board: parseBoard(`
        `)
    },
];