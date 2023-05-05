import p5 from "p5";
import { n_array } from "./algorithm";

export class Asset {
    static shadow80: p5.Image;
    static emmision80: p5.Image;
    static dot: p5.Image;
    static lock: p5.Image;

    static fontR: p5.Font;
    static fontEB: p5.Font;
    static black = 90;

    static undoButton: p5.Image;
    static initButton: p5.Image;
    static quitButton: p5.Image;
    static muteButton: p5.Image;

    static leftButton: p5.Image;
    static rightButton: p5.Image;

    static loop_head: HTMLAudioElement;
    static loop_tail: HTMLAudioElement;

    static move_sound: HTMLAudioElement[];

    static clear_sound: HTMLAudioElement;
    static button_sound: HTMLAudioElement;

    static mute: boolean;

    static preload(p: p5) {
        Asset.shadow80 = p.loadImage("./shadow80.png");
        Asset.emmision80 = p.loadImage("./emmision.png");
        Asset.dot = p.loadImage("./dot.png");
        Asset.lock = p.loadImage("./lock.png");
        
        Asset.fontR = p.loadFont("./DIN_2014_R.ttf");
        Asset.fontEB = p.loadFont("./DIN_2014_EB.ttf");

        Asset.undoButton = p.loadImage("./button_undo.png");
        Asset.initButton = p.loadImage("./button_reset.png");
        Asset.quitButton = p.loadImage("./button_quit.png");
        Asset.leftButton = p.loadImage("./button_left.png");
        Asset.rightButton = p.loadImage("./button_right.png");
        Asset.muteButton = p.loadImage("./button_mute.png");
        
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

    static toggleMute() {
        if (Asset.mute) {
            Asset.loop_head.volume = 1;
            Asset.loop_tail.volume = 1;
            Asset.mute = false;
        } else {
            Asset.loop_head.volume = 0;
            Asset.loop_tail.volume = 0;
            Asset.mute = true;
        }
    }
}