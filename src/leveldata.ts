import { Board } from "./game";

export interface LevelParam {
    title: string
    initial_board: Board;
    description_ja: string;
    description_en: string;
}

export const leveldata: LevelParam[] = [
    {
        title: "Tutrial",
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
        title: "Tutrial_2",
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
        title: "Castle",
        description_ja: "これはテストです。",
        description_en: "this is test text.",
        initial_board: [
            [1, 1, 4, 3],
            [1, 0, 0, 0],
            [0, 0, 4, 2],
            [1, 0, 0, 0],
            [1, 1, 4, 3],
        ]
    },
    {
        title: "Twin",
        description_ja: "これはテストです。",
        description_en: "this is test text.",
        initial_board: [
            [0, 1, 0],
            [2, 1, 0],
            [0, 4, 0],
            [3, 1, 2],
            [0, 1, 0],
        ]
    },
    {
        title: "Lumber",
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
    {
        title: "Raoundabout",
        description_ja: "これはテストです。",
        description_en: "this is test text.",
        initial_board: [
            [1, 1, 0, 0, 0],
            [1, 0, 3, 2, 1],
            [3, 0, 4, 3, 0],
            [1, 0, 0, 0, 0],
            [3, 0, 1, 0, 1],
        ]
    },
    {
        title: "Contact",
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
];