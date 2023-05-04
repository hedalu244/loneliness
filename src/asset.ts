import p5 from "p5";
import { n_array } from "./algorithm";

export class Asset {
    static shadow80: p5.Image;
    static emmision80: p5.Image;
    static fontR: p5.Font;
    static fontEB: p5.Font;
    static black = 90;

    static undoButton: p5.Image;
    static initButton: p5.Image;
    static quitButton: p5.Image;

    static leftButton: p5.Image;
    static rightButton: p5.Image;

    static loop_head: HTMLAudioElement;
    static loop_tail: HTMLAudioElement;

    static move_sound: HTMLAudioElement[];

    static clear_sound: HTMLAudioElement;
    static button_sound: HTMLAudioElement;

    static preload(p: p5) {
        Asset.shadow80 = p.loadImage("./shadow80.png");
        Asset.emmision80 = p.loadImage("./emmision.png");
        Asset.fontR = p.loadFont("./DIN_2014_R.ttf");
        Asset.fontEB = p.loadFont("./DIN_2014_EB.ttf");

        Asset.undoButton = p.loadImage("./button_undo.png");
        Asset.initButton = p.loadImage("./button_reset.png");
        Asset.quitButton = p.loadImage("./button_quit.png");
        Asset.leftButton = p.loadImage("./button_left.png");
        Asset.rightButton = p.loadImage("./button_right.png");
        
        
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

    static play_move_sound() {
        const i = Math.floor(Math.random() * Asset.move_sound.length);
        Asset.move_sound[i].currentTime = 0;
        Asset.move_sound[i].play();
    }

    static play_clear_sound() {
        Asset.clear_sound.currentTime = 0;
        Asset.clear_sound.play()
    }

    static play_button_sound() {
        Asset.button_sound.currentTime = 0;
        Asset.button_sound.play();
    }
}