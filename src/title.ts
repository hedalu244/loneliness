import { n_array } from "./algorithm";
import { Renderer } from "./renderer";
import { Level } from "./level";
import { TransitionManager, clicked } from "./main";

export class Title {
    constructor() {

    }

    transition(manager: TransitionManager) {
        if (clicked) {
            manager.startTransiton(new Level(
                "01.\nTUTRIAL", [
                n_array(6, () => Math.floor(Math.random() * 4)),
                n_array(6, () => Math.floor(Math.random() * 4)),
                n_array(6, () => Math.floor(Math.random() * 4)),
                n_array(6, () => Math.floor(Math.random() * 4)),
                n_array(6, () => Math.floor(Math.random() * 4)),
                n_array(6, () => Math.floor(Math.random() * 4)),
            ]));
        }
    }

    draw(renderer: Renderer) {
        renderer.clear();
        
        renderer.bgScr.textSize(40);
        renderer.bgScr.text("Title", 300, 300);

        renderer.render();
        console.log("hello")
    }
}