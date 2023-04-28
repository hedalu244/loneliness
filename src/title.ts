import { Direction, n_array } from "./algorithm";
import { Renderer } from "./renderer";
import { Level } from "./level";
import { TransitionManager } from "./main";
import { Cell, Game } from "./game";

export class Title {
    game: Game;
    constructor() {
        this.game = new Game([[Cell.Free], [Cell.Empty], [Cell.Fixed]])
    }

    transition(manager: TransitionManager) {
        if (this.game.check()) {
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

    key(code: string) {
        switch (code) {
            case "ArrowLeft": {
                this.game.move(Direction.Left);
            } break;
            case "ArrowRight": {
                this.game.move(Direction.Right);
            } break;
            case "ArrowUp": {
                this.game.move(Direction.Up);
            } break;
            case "ArrowDown": {
                this.game.move(Direction.Down);
            } break;
            case "KeyZ": {
                this.game.undo();
            } break;
            case "KeyR": {
                this.game.init();
            } break;
        }
    }
    flick(direction: Direction) {

    }
    click(x: number, y:number) {
        
    }

    draw(renderer: Renderer) {
        renderer.clear();
        
        renderer.bgScr.background(220);
        
        renderer.bgScr.fill(30);
        renderer.bgScr.textSize(40);
        renderer.bgScr.text("Title", 300, 300);

        this.game.draw(renderer);

        renderer.render();
    }
}