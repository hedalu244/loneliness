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
        description_ja: "すべてのカタマリを繋いでください。",
        description_en: "Connect all the blobs.",
        initial_board: [
            [0, 0, 2],
            [3, 0, 1],
            [1, 0, 3],
            [0, 0, 0],
            [3, 0, 0]
        ]
    },
    {
        title: "BBB",
        description_ja: "固定されたカタマリは動かせません。",
        description_en: "A fixed blob cannot be moved.",
        initial_board: [
            [3, 2, 3],
            [0, 0, 0],
            [0, 0, 0],
            [1, 0, 1],
            [1, 4, 1],
        ]
    },
    {
        title: "CCC",
        description_ja: "これはテストです。",
        description_en: "this is test text.",
        initial_board: [
            [3, 0, 1, 4],
            [0, 0, 0, 0],
            [0, 1, 2, 1],
            [0, 1, 0, 0],
            [0, 0, 0, 3],
        ]
    },
    {
        title: "DDD",
        description_ja: "これはテストです。",
        description_en: "this is test text.",
        initial_board: [
            [2, 3, 3, 4],
            [0, 0, 0, 0],
            [0, 1, 0, 0],
            [0, 0, 0, 0],
            [0, 1, 0, 4],
        ]
    },
];