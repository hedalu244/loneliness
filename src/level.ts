import { Renderer } from "./renderer";
import { Game, Board } from "./game";
import { Title } from "./title";
import { TransitionManager, TransitionType, save, solved, unit } from "./main";
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
        
        this.undoButton = new Button(87.5 * unit, 10 * unit, 6.25 * unit, 6.25 * unit, Asset.iconUndo);
        this.initButton = new Button(77.5 * unit, 10 * unit, 6.25 * unit, 6.25 * unit, Asset.iconReset);
        this.quitButton = new Button(60 * unit, 10 * unit, 6.25 * unit, 6.25 * unit, Asset.iconQuit);

        this.prevLevelButton = new Button(7.5 * unit, 50 * unit, 10 * unit, 10 * unit, Asset.iconLeft);
        this.nextLevelButton = new Button(92.5 * unit, 50 * unit, 10 * unit, 10 * unit, Asset.iconRight);
    }

    complete(manager: TransitionManager) {
        solved[this.index] = true;
        save();
        Asset.playClearSound();
        if (this.index + 1 < solved.length && !solved[this.index + 1])
            manager.startTransiton(new Level(this.index + 1, leveldata[this.index + 1]), TransitionType.ClearRight);
        else
            manager.startTransiton(new Menu(this.index), TransitionType.ClearFade);
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
            case "KeyM": {
                Asset.toggleMute();
            } break;
            case "Escape": {
                manager.startTransiton(new Menu(this.index), TransitionType.Fade);
            } break;
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
            Asset.playButtonSound();
            this.game.undo();
            return;
        }
        if (this.initButton.hit(x, y)) {
            Asset.playButtonSound();
            this.game.init();
            return;
        }
        if (this.quitButton.hit(x, y)) {
            Asset.playLevelSelectSound();
            manager.startTransiton(new Menu(this.index), TransitionType.Fade);
            return;
        }
        
        const unlocked = solved.filter(x => x).length + 3;

        if (this.nextLevelButton.hit(x, y) && leveldata[this.index + 1] && this.index + 1 < unlocked) {
            Asset.playLevelSelectSound();
            manager.startTransiton(new Level(this.index + 1, leveldata[this.index + 1]), TransitionType.Right);
            return;
        }
        if (this.prevLevelButton.hit(x, y) && leveldata[this.index - 1] && this.index - 1 < unlocked) {
            Asset.playLevelSelectSound();
            manager.startTransiton(new Level(this.index - 1, leveldata[this.index - 1]), TransitionType.Left);
            return;
        }

        if (this.game.check()) {
            this.complete(manager);
        }
    }

    draw() {
        Renderer.clear();
        
        Renderer.bgScr.background(255);

        Renderer.bgScr.fill(Asset.black);
        Renderer.bgScr.textAlign(Renderer.p.LEFT);
        Renderer.bgScr.textSize(5.5 * unit);
        Renderer.bgScr.textFont(Asset.fontEB);
        Renderer.bgScr.text((this.index + 1 + ". ").padStart(4, "0"), 7.5 * unit, 10 * unit);
        Renderer.bgScr.text(this.title, 7.5 * unit, 16.25 * unit);
        
        Renderer.bgScr.textSize(3 * unit);
        Renderer.bgScr.textFont("sans-serif");
        Renderer.bgScr.text(this.description_ja, 7.5 * unit, 87.5 * unit);
        
        Renderer.bgScr.textSize(3 * unit);
        Renderer.bgScr.textFont(Asset.fontR);
        Renderer.bgScr.text(this.description_en, 7.5 * unit, 92.5 * unit);
        
        this.undoButton.draw();
        this.initButton.draw();
        this.quitButton.draw();

        const unlocked = solved.filter(x => x).length + 3;
        if (leveldata[this.index + 1] && this.index + 1 < unlocked) {
            this.nextLevelButton.draw();
        }
        if (leveldata[this.index - 1] && this.index - 1 < unlocked) {
            this.prevLevelButton.draw();
        }

        this.game.draw();

        if (1 < this.game.anim_queue.length || performance.now() < this.game.anim_starttime + 500)
            Renderer.needUpdate = true;
    }
}