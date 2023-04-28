import p5 from "p5";

import { n_array, UnionFind } from "./algorithm";
import { Level, Direction } from "./level";
import { Renderer } from "./renderer";

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
    const level = new Level(
        "01.\nTUTRIAL", [
        n_array(6, () => Math.floor(Math.random() * 4)),
        n_array(6, () => Math.floor(Math.random() * 4)),
        n_array(6, () => Math.floor(Math.random() * 4)),
        n_array(6, () => Math.floor(Math.random() * 4)),
        n_array(6, () => Math.floor(Math.random() * 4)),
        n_array(6, () => Math.floor(Math.random() * 4)),
    ])

    p.setup = () => {
        p.createCanvas(800, 800, p.WEBGL);
        renderer = new Renderer(p);
        renderer.setBlobArea(level.width * level.cell_size, level.height * level.cell_size, level.cell_size * 0.46)
        document.addEventListener("keydown", keyDown, false);
    };


    p.draw = () => {
        p.background(220);
        level.draw(renderer);
        //p.noLoop();
    }
};

new p5(sketch);