import { Direction, hermite, n_array } from "./algorithm";
import { Renderer } from "./renderer";
import { Level } from "./level";
import { TransitionManager } from "./main";
import { Cell, Game } from "./game";
import { leveldata } from "./leveldata";

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

    anim_queue: MenuAnimation[]
    anim_starttime: number;
    
    selected: boolean;

    constructor(selecting: number) {
        this.width = 5;
        this.height = 3;
        this.x = selecting % this.width;
        this.y = Math.floor(selecting / this.width);

        this.cell_size = 80;
        this.selected = false;

        this.anim_queue = [];
        this.anim_starttime = performance.now();

        this.anim_queue.push({
            x: this.x,
            y: this.y,
            type: Direction.None,
        });
    }

    move(direction: Direction) {
        let noMove = true;
        switch (direction) {
            case Direction.Left: {
                if (0 <= this.x - 1) {
                    this.x -= 1;
                    noMove = false;
                }
            } break;
            case Direction.Right: {
                if (this.x + 1 < this.width) {
                    this.x += 1;
                    noMove = false;
                }
            } break;
            case Direction.Up: {
                if (0 <= this.y - 1) {
                    this.y -= 1;
                    noMove = false;
                }
            } break;
            case Direction.Down: {
                if (this.y + 1 < this.height) {
                    this.y += 1;
                    noMove = false;
                }
            } break;
        }
        this.anim_queue.push({
            x: this.x,
            y: this.y,
            type: noMove ? Direction.None : direction,
        });

        console.log(this.x, this.y);
    }

    transition(manager: TransitionManager) {
        if (this.selected) {
            const selecting = this.y * this.width + this.x;
            console.log(selecting, leveldata[selecting]);
            manager.startTransiton(new Level(leveldata[selecting]))
        }
    }

    key(code: string) {
        if (this.selected)
            return;

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
                this.selected = true;
            }
        }
    }
    flick(direction: Direction) {
        if (this.selected)
            return;
        
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
    click(x: number, y: number) {
        if (this.selected)
            return;
    }

    draw(renderer: Renderer, posX: number, posY: number, fadeRate: number) {
        renderer.clear();

        renderer.bgScr.background(255);

        if (1 < this.anim_queue.length && this.anim_starttime + 200 < performance.now()) {
            this.anim_queue.shift()
            this.anim_starttime = performance.now()
        }
        const anim_elapsetime = performance.now() - this.anim_starttime;

        // t = アニメーション開始からの経過時間
        // t=0で-1, 60 < tで0, 間はsmoothstep
        function move_offset(t: number, dir: Direction) {
            if (dir == Direction.None) return [0, 0]
            const amount = hermite(-1, 0, t / 200, 5.0, 1.0);

            switch (dir) {
                case Direction.Left:
                    return [-amount, 0];
                case Direction.Right:
                    return [amount, 0];
                case Direction.Up:
                    return [0, -amount];
                case Direction.Down:
                    return [0, amount];
            }
        }

        renderer.clear();
        renderer.setBlobArea(this.width * this.cell_size, this.height * this.cell_size, this.cell_size * 0.46);
        renderer.bgScr.noStroke()

        renderer.bgScr.fill(90);
        renderer.bgScr.rect(
            renderer.p.width / 2,
            renderer.p.height / 2,
            (this.width + 0.40) * this.cell_size,
            (this.height + 0.40) * this.cell_size);

        const [offsetx, offsety] = move_offset(anim_elapsetime, this.anim_queue[0].type);
        renderer.addBlob(
            (this.anim_queue[0].x + offsetx - this.width / 2 + 0.5) * this.cell_size,
            (this.anim_queue[0].y + offsety - this.height / 2 + 0.5) * this.cell_size,
            0, this.cell_size * 0.42);

        renderer.render(posX, posY, fadeRate);
    }
}