import { Direction, elastic, n_array } from "./algorithm";
import { Renderer } from "./renderer";
import { Level } from "./level";
import { TransitionManager, TransitionType, solved, unit } from "./main";
import { Cell, Game } from "./game";
import { leveldata } from "./leveldata";
import { Asset } from "./asset";
import { Button } from "./button";

type MenuAnimation = {
    x: number,
    y: number,
    type: Direction;
}

export class Menu {
    x: number;
    y: number;
    width: number;
    height: number;

    cell_size: number;

    anim_queue: MenuAnimation[];
    anim_starttime: number;

    constructor(selecting: number) {
        this.width = 5;
        this.height = 3;
        this.x = selecting % this.width;
        this.y = Math.floor(selecting / this.width);

        this.cell_size = 10 * unit;

        this.anim_queue = [];
        this.anim_starttime = performance.now();

        this.anim_queue.push({
            x: this.x,
            y: this.y,
            type: Direction.None,
        });
    }

    move(direction: Direction) {
        if(navigator.vibrate) navigator.vibrate(120);

        const unlocked = solved.filter(x => x).length + 3;

        console.log(unlocked);

        let new_x =
            direction == Direction.Left ? this.x - 1 :
                direction == Direction.Right ? this.x + 1 : this.x;
        let new_y =
            direction == Direction.Up ? this.y - 1 :
                direction == Direction.Down ? this.y + 1 : this.y;

        if (new_x < 0 || this.width <= new_x || new_y < 0 || this.height <= new_y)
            return;

        this.x = new_x;
        this.y = new_y;

        this.anim_queue.push({
            x: this.x,
            y: this.y,
            type: direction,
        });

        console.log(this.x, this.y);
    }

    key(code: string, manager: TransitionManager) {
        switch (code) {
            case "ArrowLeft": {
                this.move(Direction.Left);
            } break;
            case "ArrowRight": {
                this.move(Direction.Right);
            } break;
            case "ArrowUp": {
                this.move(Direction.Up);
            } break;
            case "ArrowDown": {
                this.move(Direction.Down);
            } break;
            case "Enter": {
                const unlocked = solved.filter(x => x).length + 3;
                const selecting = this.y * this.width + this.x;
                if (selecting < unlocked)
                manager.startTransiton(new Level(selecting, leveldata[selecting]), TransitionType.Fade);
                Asset.playLevelSelectSound();
            } break;
            case "KeyM": {
                Asset.toggleMute();
            } break;
        }
    }
    flick(direction: Direction, manager: TransitionManager) {
        switch (direction) {
            case Direction.Left: {
                this.move(Direction.Left);
            } break;
            case Direction.Right: {
                this.move(Direction.Right);
            } break;
            case Direction.Up: {
                this.move(Direction.Up);
            } break;
            case Direction.Down: {
                this.move(Direction.Down);
            } break;
        }
    }
    click(x: number, y: number, manager: TransitionManager) {
        if (Asset.muteButton.hit(x, y)) {
            Asset.toggleMute();
            return;
        }

        const unlocked = solved.filter(x => x).length + 3;0
        const selecting = this.y * this.width + this.x;
        if (selecting < unlocked) {
            manager.startTransiton(new Level(selecting, leveldata[selecting]), TransitionType.Fade);
            Asset.playLevelSelectSound();
        }
    }

    draw() {
        const unlocked = solved.filter(x => x).length + 3;
        const selecting = this.y * this.width + this.x;

        Renderer.clear();

        Renderer.bgScr.background(255);

        Renderer.bgScr.fill(Asset.black);
        Renderer.bgScr.textAlign(Renderer.p.CENTER);
        Renderer.bgScr.textSize(5.5 * unit);
        Renderer.bgScr.textFont(Asset.fontEB);
        if (selecting < unlocked)
            Renderer.bgScr.text((selecting + 1 + ". ").padStart(4, "0") + leveldata[selecting]?.title, 50 * unit, 75 * unit);
        else
            Renderer.bgScr.text((selecting + 1 + ". ").padStart(4, "0") + "???", 50 * unit, 75 * unit);

        Asset.muteButton.draw();

        // 以下3D描画
        if (1 < this.anim_queue.length && this.anim_starttime + 200 < performance.now()) {
            this.anim_queue.shift();
            this.anim_starttime = performance.now();
            Asset.playMoveSound();
        }
        const anim_elapsetime = performance.now() - this.anim_starttime;

        Renderer.clear();
        Renderer.setBlobArea(
            (this.width + 0.5) * this.cell_size,
            (this.height + 0.5) * this.cell_size,
            this.cell_size * 0.46
        );

        Renderer.bgScr.noStroke()
        Renderer.bgScr.fill(Asset.black);
        Renderer.bgScr.rect(
            Math.floor(Renderer.p.width / 2),
            Math.floor(Renderer.p.height / 2),
            Math.floor((this.width + 0.40) * this.cell_size),
            Math.floor((this.height + 0.40) * this.cell_size));

        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                let index = y * this.width + x;
                let posX = (x - this.width / 2 + 0.5) * this.cell_size;
                let posY = (y - this.height / 2 + 0.5) * this.cell_size;

                if (index < unlocked) {
                    Renderer.bgScr.fill(solved[index] ? 180 : 255);
                    Renderer.bgScr.textAlign(Renderer.p.CENTER);
                    Renderer.bgScr.textSize(5 * unit);
                    Renderer.bgScr.textFont(Asset.fontEB);
                    Renderer.bgScr.text((index + 1 + "").padStart(2, "0"), posX + 50 * unit, posY + 52 * unit);
                } else {
                    Renderer.bgScr.image(Asset.lock, posX + 50 * unit, posY + 50 * unit, Asset.lock.width / 8 * unit, Asset.lock.height / 8 * unit);
                }
            }
        }

        // 以下選択中のblobのアニメーション
        const fixedX = (this.anim_queue[0].x - this.width / 2 + 0.5) * this.cell_size;
        const fixedY = (this.anim_queue[0].y - this.height / 2 + 0.5) * this.cell_size;

        const [prevX, prevY] =
            this.anim_queue[0].type == Direction.Left ? [fixedX + this.cell_size, fixedY] :
                this.anim_queue[0].type == Direction.Right ? [fixedX - this.cell_size, fixedY] :
                    this.anim_queue[0].type == Direction.Up ? [fixedX, fixedY + this.cell_size] :
                        this.anim_queue[0].type == Direction.Down ? [fixedX, fixedY - this.cell_size] :
                            [fixedX, fixedY];


        const animX = elastic(prevX, fixedX, anim_elapsetime);
        const animY = elastic(prevY, fixedY, anim_elapsetime);

        Renderer.addBlob(animX, animY, this.cell_size * 0.6, this.cell_size * 0.42);
        Renderer.addEmission(animX, animY, this.cell_size * 0.42);
        
        if (1 < this.anim_queue.length || performance.now() < this.anim_starttime + 500)
            Renderer.needUpdate = true;
    }
}