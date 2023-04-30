import { Direction, n_array } from "./algorithm";
import { Renderer } from "./renderer";
import { Level } from "./level";
import { TransitionManager } from "./main";
import { Cell, Game } from "./game";
import { Menu } from "./menu";

export class Title {
    game: Game;
    constructor() {
        this.game = new Game([[Cell.Free], [Cell.Empty], [Cell.Fixed]]);
    }

    key(code: string, manager: TransitionManager) {
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
        if (this.game.check()) {
            manager.startTransiton(new Menu(0));
        }
    }
    flick(direction: Direction, manager: TransitionManager) {
        switch (direction) {
            case Direction.Left: {
                this.game.move(Direction.Left);
            } break;
            case Direction.Right: {
                this.game.move(Direction.Right);
            } break;
            case Direction.Up: {
                this.game.move(Direction.Up);
            } break;
            case Direction.Down: {
                this.game.move(Direction.Down);
            } break;
        }
        if (this.game.check()) {
            manager.startTransiton(new Menu(0));
        }
    }
    click(x: number, y:number, manager: TransitionManager) {
        if (this.game.check()) {
            manager.startTransiton(new Menu(0));
        }
    }

    draw(renderer: Renderer, posX: number, posY: number, fadeRate: number) {
        renderer.clear();
        
        renderer.bgScr.background(255);

        renderer.bgScr.fill(30);
        renderer.bgScr.textSize(40);
        renderer.bgScr.text("Title", 300, 300);

        this.game.draw(renderer);

        renderer.render(posX, posY, fadeRate);
    }
}