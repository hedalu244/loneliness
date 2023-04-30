import p5 from "p5";

export class Asset {
    static shadow80: p5.Image;
    static fontR: p5.Font;
    static fontEB: p5.Font;
    static black = 90;

    static preload(p: p5) {
        this.shadow80 = p.loadImage("./shadow80.png");
        this.fontR = p.loadFont("./DIN_2014_R.ttf");
        this.fontEB = p.loadFont("./DIN_2014_EB.ttf");

        /*
        const loop_head = new Audio("./loop_head.mp3");
        const loop_tail = new Audio("./loop_tail.mp3");
        
        document.addEventListener("click", (event) => {
            loop_head.play();
        });
        
        loop_head.addEventListener('ended', function() { 
            loop_tail.play();
            loop_tail.loop = true;  // ループ再生
            console.log('ended');
        }, false);
        */
    }
}