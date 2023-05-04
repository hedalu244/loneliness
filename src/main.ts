import p5 from "p5";

import { n_array, UnionFind, Direction, elastic, hermite } from "./algorithm";
import { Title } from "./title"
import { Renderer } from "./renderer";
import { Level } from "./level";
import { initInputEvent } from "./input";
import { Menu } from "./menu";
import { Asset } from "./asset";
import { Cell } from "./game";
import { EmptyState } from "./StartScreen";
import { leveldata } from "./leveldata";

export let solved: boolean[];

type State = EmptyState | Title | Menu | Level;

export const TransitionType = {
    Fade: "fade",
    Left: "left",
    Right: "right"
} as const;
export type TransitionType = typeof TransitionType[keyof typeof TransitionType];

export class TransitionManager {
    state: State;
    oldState: State;
    start_time: number;
    type: TransitionType;

    constructor(state: State) {
        this.state = state
        this.oldState = new EmptyState();

        this.start_time = performance.now();
        this.type = TransitionType.Fade;
    }

    draw(renderer: Renderer) {
        const elapsed_time = performance.now() - this.start_time;
        
        switch (this.type) {
            case TransitionType.Fade: {
                const t = elapsed_time / 500 - 1;
                const fadeRate = Math.max(0, 1 - t * t);

                renderer.setFade(fadeRate);
                renderer.setOffset(0, 0);

                if (elapsed_time < 500)
                    this.oldState.draw(renderer);
                else
                    this.state.draw(renderer);
            } break;

            case TransitionType.Right: {
                const offset = elastic(0, 2, elapsed_time, 500, 0.001);
                renderer.setFade(0);

                if (offset < 1) {
                    renderer.setOffset(offset, 0);
                    this.oldState.draw(renderer);
                }
                else {
                    renderer.setOffset(offset - 2, 0);
                    this.state.draw(renderer);
                }
            } break;

            case TransitionType.Left: {
                const offset = elastic(0, -2, elapsed_time, 500, 0.001);
                renderer.setFade(0);

                if (-1 < offset) {
                    renderer.setOffset(offset, 0);
                    this.oldState.draw(renderer);
                }
                else {
                    renderer.setOffset(offset + 2, 0);
                    this.state.draw(renderer);
                }
            } break;
        }

        renderer.render();
        
        if (elapsed_time < 1000)
            renderer.needUpdate = true;
    }

    key(code: string) {
        const elapsed_time = performance.now() - this.start_time;
        if (elapsed_time < 1000)
            return;
        this.state.key(code, this);
    }
    flick(direction: Direction) {
        const elapsed_time = performance.now() - this.start_time;
        if (elapsed_time < 1000)
            return;
        this.state.flick(direction, this);
    }
    click(x: number, y: number, p: p5) {
        const elapsed_time = performance.now() - this.start_time;
        if (elapsed_time < 1000)
            return;
        this.state.click(p.mouseX, p.mouseY, this);
    }

    // 状態遷移アニメーションをはじめる
    startTransiton(nextState: State, type: TransitionType) {
        this.oldState = this.state;
        this.state = nextState;
        this.start_time = performance.now();
        this.type = type;
    }
}

const sketch = (p: p5) => {
    let renderer: Renderer;
    let transition_manager = new TransitionManager(new Title());
    /*
    const level = new Level(
        "01.\nTUTRIAL", [
        n_array(6, () => Math.floor(Math.random() * 4)),
        n_array(6, () => Math.floor(Math.random() * 4)),
        n_array(6, () => Math.floor(Math.random() * 4)),
        n_array(6, () => Math.floor(Math.random() * 4)),
        n_array(6, () => Math.floor(Math.random() * 4)),
        n_array(6, () => Math.floor(Math.random() * 4)),
    ])
    */

    p.preload = () => {
        Asset.preload(p);
    }

    p.setup = () => {
        const canvas = p.createCanvas(800, 800);
        canvas.parent("wrapper");
        renderer = new Renderer(p);
        initInputEvent(canvas.elt as HTMLCanvasElement,
            (code) => transition_manager.key(code),
            (x, y) => transition_manager.click(x, y, p),
            (dir) => transition_manager.flick(dir));

        solved = n_array(leveldata.length, () => false);
        
        // 以下製作用コード
        const levelEditor = document.getElementById("level_editor") as HTMLTextAreaElement;
        levelEditor.addEventListener("input", () => {
            function transpose<T>(a: T[][]): T[][] {
                return a[0].map((_, c) => a.map(r => r[c]));
            }

            function cell(x: number): Cell {
                for (let key in Cell)
                    if (x == Cell[key]) return Cell[key];
                return Cell.Empty;
            }

            const value = levelEditor.value;
            const initial_board = transpose(value.trim().split("\n").map(x => x.trim().split(" ").map(x => cell(+x))));
            const height = Math.max(...initial_board.map(x => x.length));

            initial_board.forEach(x => {
                while (x.length < height) x.push(0);
            });

            transition_manager.startTransiton(new Level(0, {
                title: "TEST LEVEL",
                description_ja: "これはテストステージです。",
                description_en: "This is test level.",
                initial_board: initial_board
            }), TransitionType.Fade);
        });
    };

    p.draw = () => {
        //transition_manager.update();
        transition_manager.draw(renderer);

        //level.draw(renderer);
        //p.noLoop();
    }
};

new p5(sketch);