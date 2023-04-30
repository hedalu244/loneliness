import p5 from "p5";

import { n_array, UnionFind, Direction} from "./algorithm";
import { Title } from "./title"
import { Renderer } from "./renderer";
import { Level } from "./level";
import { initInputEvent } from "./input";
import { Menu } from "./menu";
import { leveldata } from "./leveldata";
import { Asset } from "./asset";

type State = Title | Menu | Level;

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
        const fadeRate = Math.max(0, 1 - Math.abs(elapsed_time - 500) / 500 * Math.abs(elapsed_time - 500) / 500);
    
        if (elapsed_time < 500) {
            if (this.oldState)
                this.oldState.draw(renderer, 0, 0, fadeRate);
        }
        else this.state.draw(renderer, 0, 0, fadeRate);
    }

    key(code: string) {
        const elapsed_time = performance.now() - this.start_time;
        if (elapsed_time < 1000)
            return;
        this.state.key(code);
    }
    flick(direction: Direction) {
        const elapsed_time = performance.now() - this.start_time;
        if (elapsed_time < 1000)
            return;
        this.state.flick(direction);
    }
    click(x: number, y:number, p: p5) {
        const elapsed_time = performance.now() - this.start_time;
        if (elapsed_time < 1000)
            return;
        this.state.click(p.mouseX, p.mouseY);
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
        const canvas = p.createCanvas(800, 800).elt as HTMLCanvasElement;
        renderer = new Renderer(p);
        initInputEvent(canvas,
            (code) => transition_manager.key(code),
            (x, y) => transition_manager.click(x, y, p),
            (dir) => transition_manager.flick(dir));
        console.log(leveldata)
    };

    p.draw = () => {
        transition_manager.update();
        transition_manager.draw(renderer);

        //level.draw(renderer);
        //p.noLoop();
    }
};

new p5(sketch);