import { Renderer } from "./renderer";
import { Game, Board } from "./game";
import { Title } from "./title";
import { TransitionManager } from "./main";
import { Direction } from "./algorithm";

export class Level {
    title: string;
    game: Game
    constructor(title: string, initialBoard: Board) {
        this.title = title
        this.game = new Game(initialBoard);
    }

    transition(manager: TransitionManager) {
        if (this.game.check()) {
            manager.startTransiton(new Title());
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
    }
    click(x: number, y:number) {
        
    }

    draw(renderer: Renderer, posX: number, posY: number, fadeRate: number) {
        renderer.clear();
        
        renderer.bgScr.background(220);

        renderer.bgScr.fill(180);
        renderer.bgScr.fill(30);
        renderer.bgScr.textSize(32);
        renderer.bgScr.text(this.title, 20, 50);

        this.game.draw(renderer);
        
        renderer.render(posX, posY, fadeRate);
    }
}