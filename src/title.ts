import { Direction, n_array } from "./algorithm";
import { Renderer } from "./renderer";
import { Level } from "./level";
import { TransitionManager, TransitionType } from "./main";
import { Cell, Game } from "./game";
import { Menu } from "./menu";
import { Asset } from "./asset";

export class Title {
    game: Game;
    constructor() {
        this.game = new Game([[Cell.Free], [Cell.Empty], [Cell.Player], [Cell.Empty], [Cell.Fixed]]);
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
            manager.startTransiton(new Menu(0), TransitionType.Fade);
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
            manager.startTransiton(new Menu(0), TransitionType.Fade);
        }
    }
    click(x: number, y:number, manager: TransitionManager) {
    }

    draw(renderer: Renderer) {
        if (this.game.anim_queue.length <= 1 && this.game.anim_starttime + 1000 < performance.now()) return;

        renderer.needUpdate = true;
        renderer.clear();
        
        renderer.bgScr.background(255);

        renderer.bgScr.fill(Asset.black);
        renderer.bgScr.textSize(60);
        renderer.bgScr.textFont(Asset.fontEB);
        renderer.bgScr.textAlign(renderer.p.CENTER);
        renderer.bgScr.text("LONELINESS", 400, 300);

        this.game.draw(renderer);
    }
}