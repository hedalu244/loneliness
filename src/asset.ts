import p5 from "p5";

export class Asset {
    static shadow80: p5.Image;

    static preload(p: p5) {
        this.shadow80 = p.loadImage("./shadow80.png");
    }
}