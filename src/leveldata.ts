import { Board } from "./game";

interface LevelData {
    title: string
    initialBoard: Board;
}

export const leveldata: LevelData[] = [
    {
        title: "01. aaa",
        initialBoard: [
            [0, 1, 2, 3]
        ]
    },
    {
        title: "02. bbb",
        initialBoard: [
            [0, 1, 2, 3],
            [0, 1, 2, 3],
        ]
    },
    {
        title: "03. bbb",
        initialBoard: [
            [0, 1, 2, 3],
            [0, 1, 2, 3],
            [0, 1, 2, 3],
        ]
    },
];
