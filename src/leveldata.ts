import { Board } from "./game";

export interface LevelParam {
    title: string
    initial_board: Board;
    description_ja: string;
    description_en: string;
}

export const leveldata: LevelParam[] = [
    {
        title: "AAA",
        description_ja: "これはテストです。",
        description_en: "this is test text.",
        initial_board: [
            [1, 0, 2, 3],
            [2, 0, 0, 1],
            [0, 1, 3, 0],
            [4, 0, 0, 0],
        ]
    },
    {
        title: "BBB",
        description_ja: "これはテストです。",
        description_en: "this is test text.",
        initial_board: [
            [1],
            [2],
            [0],
            [3],
        ]
    },
    {
        title: "CCC",
        description_ja: "これはテストです。",
        description_en: "this is test text.",
        initial_board: [
            [1],
            [2],
            [0],
            [3],
        ]
    },
];