import p5 from "p5";
import { Renderer } from "./renderer";
import { Asset } from "./asset";

export class Button{
    x: number;
    y: number;
    w: number
    h: number
    texture: p5.Image;

    constructor(x: number, y: number, w: number, h: number, texture: p5.Image) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.texture = texture;
    }

    draw(renderer: Renderer){
        renderer.bgScr.image(this.texture, this.x, this.y);
        //renderer.bgScr.fill(Asset.black);
        //renderer.bgScr.rect(this.x, this.y, this.w, this.h);
    }

    hit(mouseX: number, mouseY: number) {
        return (
            this.x - this.w / 2 <= mouseX && mouseX < this.x + this.w / 2 && 
            this.y - this.h / 2 <= mouseY && mouseY < this.y + this.h / 2
        );
    }
}