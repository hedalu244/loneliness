import { Renderer } from "./renderer";
import { Game, Board } from "./game";
import { Title } from "./title";
import { TransitionManager, TransitionType, solved } from "./main";
import { Direction } from "./algorithm";
import { LevelParam, leveldata } from "./leveldata";
import { Menu } from "./menu";
import { Button } from "./button";
import { Asset } from "./asset";

export class Level {
    index: number;
    
    title: string;
    description_ja: string;
    description_en: string;
    
    game: Game
    undoButton: Button;
    initButton: Button;
    quitButton: Button;
    
    prevLevelButton: Button;
    nextLevelButton: Button;    

    constructor(index: number, levelParam: LevelParam) {
        this.index = index;
        
        this.title = levelParam.title;
        this.description_ja = levelParam.description_ja;
        this.description_en = levelParam.description_en;
    
        this.game = new Game(levelParam.initial_board);
        
        this.undoButton = new Button(700, 80, 50, 50, Asset.undoButton);
        this.initButton = new Button(620, 80, 50, 50, Asset.initButton);
        this.quitButton = new Button(480, 80, 50, 50, Asset.quitButton);

        this.prevLevelButton = new Button(60, 400, 40, 40, Asset.leftButton);
        this.nextLevelButton = new Button(740, 400, 40, 40, Asset.rightButton);
    }

    complete(manager: TransitionManager) {
        solved[this.index] = true;
        Asset.play_clear_sound();
        if (this.index + 1 < solved.length && !solved[this.index + 1])
            manager.startTransiton(new Level(this.index + 1, leveldata[this.index + 1]), TransitionType.ClearRight);
        else
            manager.startTransiton(new Menu(0), TransitionType.ClearFade);
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
                manager.startTransiton(new Menu(0), TransitionType.Fade);
            }
        }

        if (this.game.check()) {
            this.complete(manager);
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
            this.complete(manager)
        }
    }

    click(x: number, y:number, manager: TransitionManager) {
        if (this.undoButton.hit(x, y)) {
            Asset.play_button_sound();
            this.game.undo();
            return;
        }
        if (this.initButton.hit(x, y)) {
            Asset.play_button_sound();
            this.game.init();
            return;
        }
        if (this.quitButton.hit(x, y)) {
            Asset.play_button_sound();
            manager.startTransiton(new Menu(0), TransitionType.Fade);
            return;
        }
        
        if (this.nextLevelButton.hit(x, y) && leveldata[this.index + 1]) {
            Asset.play_button_sound();
            manager.startTransiton(new Level(this.index + 1, leveldata[this.index + 1]), TransitionType.Right);
            return;
        }
        if (this.prevLevelButton.hit(x, y) && leveldata[this.index - 1]) {
            Asset.play_button_sound();
            manager.startTransiton(new Level(this.index - 1, leveldata[this.index - 1]), TransitionType.Left);
            return;
        }

        if (this.game.check()) {
            this.complete(manager);
        }
    }

    draw(renderer: Renderer) {
        renderer.clear();
        
        renderer.bgScr.background(255);

        renderer.bgScr.fill(Asset.black);
        renderer.bgScr.textAlign(renderer.p.LEFT);
        renderer.bgScr.textSize(44);
        renderer.bgScr.textFont(Asset.fontEB);
        renderer.bgScr.text((this.index + 1 + ". ").padStart(4, "0"), 60, 80);
        renderer.bgScr.text(this.title, 60, 130);
        
        renderer.bgScr.textSize(26);
        renderer.bgScr.textFont("sans-serif");
        renderer.bgScr.text(this.description_ja, 60, 700);
        
        renderer.bgScr.textSize(26);
        renderer.bgScr.textFont(Asset.fontR);
        renderer.bgScr.text(this.description_en, 60, 740);
        
        this.undoButton.draw(renderer);
        this.initButton.draw(renderer);
        this.quitButton.draw(renderer);

        if (leveldata[this.index + 1]) {
            this.nextLevelButton.draw(renderer);
        }
        if (leveldata[this.index - 1]) {
            this.prevLevelButton.draw(renderer);
        }

        this.game.draw(renderer);

        if (1 < this.game.anim_queue.length || performance.now() < this.game.anim_starttime + 500)
            renderer.needUpdate = true;
    }
}