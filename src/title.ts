import { Direction, n_array } from "./algorithm";
import { Renderer } from "./renderer";
import { Level } from "./level";
import { TransitionManager, TransitionType, unit } from "./main";
import { Cell, Game } from "./game";
import { Menu } from "./menu";
import { Asset } from "./asset";
import { Button } from "./button";

export class Title {
    game: Game;
    
    muteButton: Button;
    
    constructor() {
        this.muteButton = new Button(87.5 * unit, 10 * unit, 6.25* unit, 6.25 * unit, Asset.muteButton);

        this.game = new Game([[Cell.Player], [Cell.Empty], [Cell.Empty], [Cell.Empty], [Cell.Free]]);
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
            case "KeyM": {
                Asset.toggleMute();
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
        if (this.muteButton.hit(x, y)) {
            Asset.toggleMute();
            return;
        }
    }

    draw(renderer: Renderer) {
        renderer.clear();
        
        renderer.bgScr.background(255);

        renderer.bgScr.fill(Asset.black);
        renderer.bgScr.textSize(7.5 * unit);
        renderer.bgScr.textFont(Asset.fontEB);
        renderer.bgScr.textAlign(renderer.p.CENTER);
        renderer.bgScr.text("LONELINESS", 50 * unit, 37.5 * unit);

        this.muteButton.draw(renderer);
        this.game.draw(renderer);
        
        if (1 < this.game.anim_queue.length || performance.now() < this.game.anim_starttime + 500)
            renderer.needUpdate = true;
    }
}