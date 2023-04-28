import p5 from "p5";

import { n_array, UnionFind } from "./algorithm";
import { Level, Direction } from "./level";
import { Title } from "./title"
import { Renderer } from "./renderer";

type State = Title | Level;

export class TransitionManager {
    state: State;
    oldState: State | undefined;
    start_time: number;

    constructor (state: State) {
        this.state = state
        this.oldState = undefined;

        this.start_time = performance.now();
    }

    draw(renderer: Renderer) {
        const elapsed_time = performance.now() - this.start_time;
        if (elapsed_time < 500) {
            if (this.oldState)
                this.oldState.draw(renderer);
        }
        else this.state.draw(renderer);
    }

    update() {
        this.state.transition(this);
    }

    // 状態遷移アニメーションをはじめる
    startTransiton(nextState: State, transitionType?: undefined) {
        this.oldState = this.state;
        this.state = nextState;
        this.start_time = performance.now();
    }
}

export let clicked = false;

const sketch = (p: p5) => {
    function keyDown(event: KeyboardEvent) {
        if (event.repeat) return;
        console.log(event.code);
        switch (event.code) {
            case "ArrowLeft": {
                level.move(Direction.Left);
            } break;
            case "ArrowRight": {
                level.move(Direction.Right);
            } break;
            case "ArrowUp": {
                level.move(Direction.Up);
            } break;
            case "ArrowDown": {
                level.move(Direction.Down);
            } break;
            case "KeyZ": {
                level.undo();
            } break;
            case "KeyR": {
                level.init();
            } break;
        }
    }

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

    p.setup = () => {
        p.createCanvas(800, 800, p.WEBGL);
        renderer = new Renderer(p);
        //renderer.setBlobArea(level.width * level.cell_size, level.height * level.cell_size, level.cell_size * 0.46)
        document.addEventListener("keydown", keyDown, false);

        document.addEventListener("click", () => {
            clicked = true;
        });
    };

    p.draw = () => {
        p.background(220);

        transition_manager.update();
        transition_manager.draw(renderer);

        //level.draw(renderer);
        //p.noLoop();
    }
};

new p5(sketch);