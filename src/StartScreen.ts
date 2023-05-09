import { Direction } from "./algorithm";
import { Asset } from "./asset";
import { TransitionManager, TransitionType, unit } from "./main";
import { Renderer } from "./renderer";
import { Title } from "./title";

export class EmptyState {
    constructor() {}

    draw(Renderer: Renderer) {
    }
    key(code: string, manager: TransitionManager) {
    }
    flick(direction: Direction, manager: TransitionManager) {
    }
    click(x: number, y: number, manager: TransitionManager) {
    }
}

export class StartScreen {
    constructor() {}

    draw() {
        Renderer.bgScr.background(255);
        Renderer.bgScr.fill(Asset.black);
        Renderer.bgScr.textAlign(Renderer.p.CENTER);
        Renderer.bgScr.textSize(3.25 * unit);

        Renderer.bgScr.textFont("sans-serif");
        Renderer.bgScr.text("このゲームは孤独を味わうゲームです。\n是非ひとりでプレイしてください。", 50 * unit, 35 * unit);

        Renderer.bgScr.textFont(Asset.fontR);
        Renderer.bgScr.text("This game is about finding pleasure in solitude.\nPlease play by yourself.", 50 * unit, 50 * unit);

        Renderer.bgScr.textSize(5 * unit);
        Renderer.bgScr.textFont(Asset.fontEB);
        Renderer.bgScr.text("Enter / Tap to Start", 50 * unit, 75 * unit);
    }
    key(code: string, manager: TransitionManager) {
        if (code == "Enter") {
            Asset.loop_head.play();
            manager.startTransiton(new Title(), TransitionType.Fade);
        }
    }
    flick(direction: Direction, manager: TransitionManager) {
    }
    click(x: number, y: number, manager: TransitionManager) {
        Asset.loop_head.play();
        manager.startTransiton(new Title(), TransitionType.Fade);
    }
}