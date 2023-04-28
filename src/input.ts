import { Direction } from "./algorithm";

interface TouchStroke {
    readonly id: number;
    readonly log: { x: number, y: number; }[];
}
const strokes: TouchStroke[] = [];

const flickRange = 50;
function isFrick(stroke: TouchStroke): Direction {
    const dx = stroke.log[stroke.log.length - 1].x - stroke.log[0].x;
    const dy = stroke.log[stroke.log.length - 1].y - stroke.log[0].y;

    if (dx * dx + dy * dy < flickRange * flickRange)
        return Direction.None;

    if (Math.abs(dy) < Math.abs(dx)) {
        return (0 < dx) ? Direction.Right : Direction.Left;
    }
    else {
        return (0 < dy) ? Direction.Down : Direction.Up;
    }
}

export function initInputEvent(element: HTMLElement,
    key: (code: string) => void,
    click: (x: number, y: number) => void,
    flick: (direction: Direction) => void) {
    element.addEventListener("touchstart", (event: TouchEvent) => {
        event.preventDefault();
        Array.from(event.changedTouches).forEach(touch => {
            const rect = element.getBoundingClientRect();
            const stroke = {
                id: touch.identifier,
                log: [{ x: touch.clientX - rect.left, y: touch.clientY - rect.top }],
            };;
            strokes.push(stroke);
        });
    }, false);
    element.addEventListener("touchmove", (event: TouchEvent) => {
        event.preventDefault();
        Array.from(event.changedTouches).forEach(touch => {
            const rect = element.getBoundingClientRect();
            const stroke = strokes.find(x => x.id === touch.identifier);
            if (stroke === undefined)
                return;
            stroke.log.push({ x: touch.clientX - rect.left, y: touch.clientY - rect.top });
        });
    }, false);
    element.addEventListener("touchend", (event: TouchEvent) => {
        event.preventDefault();
        Array.from(event.changedTouches).forEach(touch => {
            const strokeIndex = strokes.findIndex(x => x.id === touch.identifier);
            if (strokeIndex === -1)
                return;
            const stroke = strokes[strokeIndex];
            strokes.splice(strokeIndex, 1);  // remove it; we're done
            
            const result = isFrick(stroke);
            if (result != Direction.None)
                flick(result);
        });
    }, false);
    element.addEventListener("touchcancel", (event: TouchEvent) => {
        event.preventDefault();
        Array.from(event.changedTouches).forEach(touch => {
            const strokeIndex = strokes.findIndex(x => x.id === touch.identifier);
            if (strokeIndex === -1)
                return;
            strokes.splice(strokeIndex, 1);  // remove it; we're done
        });
    }, false);

    document.addEventListener("click", (event: MouseEvent) => {
        click(event.x, event.y)
    }, false);

    document.addEventListener("keydown", (event: KeyboardEvent) => {
        if (event.repeat) return;
        key(event.code)
    }, false);

    //const ua = navigator.userAgent;
    //inputStyle = /(iPhone|iPad|iPod|Android)/i.test(ua) ? "touch" : "keyboard";
}