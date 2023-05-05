import { Direction } from "./algorithm";
import { Asset } from "./asset";
import { TransitionManager, TransitionType, unit } from "./main";
import { Renderer } from "./renderer";
import { Title } from "./title";

export class EmptyState {
    constructor() {}

    draw(renderer: Renderer) {
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

    draw(renderer: Renderer) {
        renderer.bgScr.background(255);
        renderer.bgScr.fill(Asset.black);
        renderer.bgScr.textAlign(renderer.p.CENTER);
        renderer.bgScr.textSize(3.25 * unit);

        renderer.bgScr.textFont("sans-serif");
        renderer.bgScr.text("このゲームは孤独を味わうゲームです。\n是非ひとりでプレイしてください。", 50 * unit, 35 * unit);

        renderer.bgScr.textFont(Asset.fontR);
        renderer.bgScr.text("This game is about finding pleasure in solitude.\nPlease play by yourself.", 50 * unit, 50 * unit);

        renderer.bgScr.textSize(5 * unit);
        renderer.bgScr.textFont(Asset.fontEB);
        renderer.bgScr.text("Click / Tap to Start", 50 * unit, 75 * unit);
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