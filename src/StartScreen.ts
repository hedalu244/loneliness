import { Direction } from "./algorithm";
import { TransitionManager } from "./main";
import { Renderer } from "./renderer";

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