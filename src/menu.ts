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
    
    muteButton: Button;

    constructor(selecting: number) {
        this.width = 5;
        this.height = 3;
        this.x = selecting % this.width;
        this.y = Math.floor(selecting / this.width);

        this.muteButton = new Button(87.5 * unit, 10 * unit, 6.25* unit, 6.25 * unit, Asset.muteButton);

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
        if (this.muteButton.hit(x, y)) {
            Asset.toggleMute();
            return;
        }

        const unlocked = solved.filter(x => x).length + 3;
        const selecting = this.y * this.width + this.x;
        if (selecting < unlocked) {
            manager.startTransiton(new Level(selecting, leveldata[selecting]), TransitionType.Fade);
            Asset.playLevelSelectSound();
        }
    }

    draw(renderer: Renderer) {
        const unlocked = solved.filter(x => x).length + 3;
        const selecting = this.y * this.width + this.x;

        renderer.clear();

        renderer.bgScr.background(255);

        renderer.bgScr.fill(Asset.black);
        renderer.bgScr.textAlign(renderer.p.CENTER);
        renderer.bgScr.textSize(5.5 * unit);
        renderer.bgScr.textFont(Asset.fontEB);
        renderer.bgScr.text((selecting + 1 + ". ").padStart(4, "0") + leveldata[selecting]?.title, 50 * unit, 75 * unit);

        this.muteButton.draw(renderer);

        // 以下3D描画
        if (1 < this.anim_queue.length && this.anim_starttime + 200 < performance.now()) {
            this.anim_queue.shift();
            this.anim_starttime = performance.now();
            Asset.playMoveSound();
        }
        const anim_elapsetime = performance.now() - this.anim_starttime;

        renderer.clear();
        renderer.setBlobArea(
            (this.width + 0.5) * this.cell_size,
            (this.height + 0.5) * this.cell_size,
            this.cell_size * 0.46
        );

        renderer.bgScr.noStroke()
        renderer.bgScr.fill(Asset.black);
        renderer.bgScr.rect(
            renderer.p.width / 2,
            renderer.p.height / 2,
            (this.width + 0.40) * this.cell_size,
            (this.height + 0.40) * this.cell_size);

        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                let index = y * this.width + x;
                let posX = (x - this.width / 2 + 0.5) * this.cell_size;
                let posY = (y - this.height / 2 + 0.5) * this.cell_size;

                if (index < unlocked) {
                    renderer.bgScr.fill(solved[index] ? 180 : 255);
                    renderer.bgScr.textAlign(renderer.p.CENTER);
                    renderer.bgScr.textSize(5 * unit);
                    renderer.bgScr.textFont(Asset.fontEB);
                    renderer.bgScr.text((index + 1 + "").padStart(2, "0"), posX + 50 * unit, posY + 52 * unit);
                } else {
                    renderer.bgScr.image(Asset.lock, posX + 50 * unit, posY + 50 * unit, Asset.lock.width / 8 * unit, Asset.lock.height / 8 * unit);
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

        renderer.addBlob(animX, animY, this.cell_size * 0.6, this.cell_size * 0.42);
        renderer.addEmission(animX, animY, this.cell_size * 0.42);
        
        if (1 < this.anim_queue.length || performance.now() < this.anim_starttime + 500)
            renderer.needUpdate = true;
    }
}