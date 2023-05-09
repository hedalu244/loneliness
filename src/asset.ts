import p5 from "p5";
import { Renderer } from "./renderer"
import { n_array } from "./algorithm";
import { Button } from "./button";
import { unit } from "./main";

export class Asset {
    static shadow80: p5.Image;
    static emmision80: p5.Image;
    static dot: p5.Image;
    static lock: p5.Image;

    static fontR: p5.Font;
    static fontEB: p5.Font;
    static black = 90;

    static iconUndo: p5.Image;
    static iconReset: p5.Image;
    static iconQuit: p5.Image;
    static iconMute: p5.Image;
    static iconUnmute: p5.Image;

    static iconLeft: p5.Image;
    static iconRight: p5.Image;

    static loop_head: HTMLAudioElement;
    static loop_tail: HTMLAudioElement;

    static move_sound: HTMLAudioElement[];

    static level_select_sound: HTMLAudioElement;
    static clear_sound: HTMLAudioElement;
    static button_sound: HTMLAudioElement;

    static mute: boolean;
    static muteButton: Button;

    static preload(p: p5) {
        Asset.shadow80 = p.loadImage("./shadow80.png");
        Asset.emmision80 = p.loadImage("./emmision.png");
        Asset.dot = p.loadImage("./dot.png");
        Asset.lock = p.loadImage("./lock.png");
        
        Asset.fontR = p.loadFont("./DIN_2014_R.ttf");
        Asset.fontEB = p.loadFont("./DIN_2014_EB.ttf");

        Asset.iconUndo = p.loadImage("./button_undo.png");
        Asset.iconReset = p.loadImage("./button_reset.png");
        Asset.iconQuit = p.loadImage("./button_quit.png");
        Asset.iconLeft = p.loadImage("./button_left.png");
        Asset.iconRight = p.loadImage("./button_right.png");
        Asset.iconMute = p.loadImage("./button_mute.png");
        Asset.iconUnmute = p.loadImage("./button_unmute.png");
        
        Asset.loop_head = new Audio("./loop_head.mp3");
        Asset.loop_tail = new Audio("./loop_tail.mp3");
        
        Asset.loop_head.addEventListener('ended', function() { 
            Asset.loop_tail.play();
            Asset.loop_tail.loop = true;  // ループ再生
            console.log('ended');
        }, false);

        Asset.move_sound = n_array(8, (i) => new Audio(`./pop_${i}.wav`));

        Asset.clear_sound = new Audio("./clear.mp3");
        Asset.button_sound = new Audio("./cork.mp3");
        Asset.level_select_sound = new Audio("./levelselect.mp3");

        Asset.muteButton = new Button(87.5 * unit, 10 * unit, 6.25* unit, 6.25 * unit, Asset.iconUnmute);
    }

    static playMoveSound() {
        if (Asset.mute) return;
        const i = Math.floor(Math.random() * Asset.move_sound.length);
        Asset.move_sound[i].currentTime = 0;
        Asset.move_sound[i].play();
    }

    static playClearSound() {
        if (Asset.mute) return;
        Asset.clear_sound.currentTime = 0;
        Asset.clear_sound.play()
    }

    static playButtonSound() {
        if (Asset.mute) return;
        Asset.button_sound.currentTime = 0;
        Asset.button_sound.play();
    }

    static playLevelSelectSound() {
        if (Asset.mute) return;
        Asset.level_select_sound.currentTime = 0;
        Asset.level_select_sound.play();
    }

    static toggleMute() {
        if (Asset.mute) {
            Asset.loop_head.volume = 1;
            Asset.loop_tail.volume = 1;
            Asset.mute = false;
            Asset.muteButton.texture = Asset.iconUnmute;
            Renderer.lastNeedUpdate = true;
            console.log(this.muteButton.texture);
        } else {
            Asset.loop_head.volume = 0;
            Asset.loop_tail.volume = 0;
            Asset.mute = true;
            Asset.muteButton.texture = Asset.iconMute;
            Renderer.lastNeedUpdate = true;
            console.log(this.muteButton.texture);
        }
    }
}