import { Board } from "./game";

export interface LevelParam {
    title: string
    initialBoard: Board;
}

export const leveldata: LevelParam[] = [
    {
        title: "01. aaa",
        initialBoard: [
            [1],
            [2],
            [0],
            [3],
        ]
    },
    {
        title: "02. bbb",
        initialBoard: [
            [1],
            [2],
            [0],
            [3],
        ]
    },
    {
        title: "03. ccc",
        initialBoard: [
            [1],
            [2],
            [0],
            [3],
        ]
    },
];
