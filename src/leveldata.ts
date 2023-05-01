import { Board } from "./game";

export interface LevelParam {
    title: string
    initial_board: Board;
    description_ja: string;
    description_en: string;
}

export const leveldata: LevelParam[] = [
    {
        title: "01.\nAAA",
        description_ja: "これはテストです。",
        description_en: "this is test text.",
        initial_board: [
            [1, 0, 2, 3],
            [2, 0, 0, 1],
            [0, 1, 3, 0],
            [2, 0, 0, 0],
        ]
    },
    {
        title: "02.\nBBB",
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
        title: "03.\nCCC",
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