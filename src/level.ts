import { Renderer } from "./renderer";
import { Game, Board } from "./game";
import { Title } from "./title";
import { TransitionManager } from "./main";
import { Direction } from "./algorithm";
import { LevelParam } from "./leveldata";
import { Menu } from "./menu";
import { Button } from "./button";

export class Level {
    title: string;
    game: Game
    undoButton: Button;
    initButton: Button;
    quitButton: Button;

    constructor(levelparam: LevelParam) {
        this.title = levelparam.title
        this.game = new Game(levelparam.initialBoard);
        this.undoButton = new Button(700, 100, 40, 40);
        this.initButton = new Button(640, 100, 40, 40);
        this.quitButton = new Button(520, 100, 40, 40);
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
            case "KeyR": {
                this.game.init();
            } break;
            case "Escape": {
                manager.startTransiton(new Menu(0));
            }
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
        if (this.undoButton.hit(x, y)) {
            this.game.undo();
            return;
        }
        if (this.initButton.hit(x, y)) {
            this.game.init();
            return;
        }
        if (this.quitButton.hit(x, y)) {
            manager.startTransiton(new Menu(0));
            return;
        }

        if (this.game.check()) {
            manager.startTransiton(new Menu(0));
        }
    }

    draw(renderer: Renderer, posX: number, posY: number, fadeRate: number) {
        renderer.clear();
        
        renderer.bgScr.background(255);

        renderer.bgScr.fill(180);
        renderer.bgScr.fill(30);
        renderer.bgScr.textSize(32);
        renderer.bgScr.text(this.title, 20, 50);
        
        this.undoButton.draw(renderer);
        this.initButton.draw(renderer);
        this.quitButton.draw(renderer);

        this.game.draw(renderer);
        
        renderer.render(posX, posY, fadeRate);
    }
}