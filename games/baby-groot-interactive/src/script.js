var sketchProc = function(processingInstance) {
  with (processingInstance) {
    size(600, 600); 
    frameRate(60);

    textFont(createFont("Trebuchet MS"));
    smooth();

    var scene;

    keyPressed = function () {
        scene.keys[keyCode] = true;
    };
    keyReleased = function () {
        scene.keys[keyCode] = false;
    };
    mouseClicked = function () {
        scene.clicked = true;
        scene.started = true;
    };
    mouseOut = function() {
        scene.over = false;
    };
    mouseMoved = function() {
        scene.over = true;
        scene.idle.time = millis();

        if(scene.idle.active) {
            scene.groot.action = scene.idle.action;
            scene.action.active = true;
            scene.action.timer = 240;
            scene.talkTimer = 50;
            scene.updateActionButtons();
            scene.idle.active = false;
        }
    };

    var Button = (function() {
        var Button = function(args) {
            this.x = args.x;
            this.y = args.y;
            this.w = args.w || 75;
            this.h = args.h || 35;
            this.content = args.content;
            this.textSize = args.textSize || this.w * 0.18; // 22;
            this.enabled = true;
            this.hover = false;
            this.selected = args.selected || false;
            this.func = args.func;
            this.backColor = args.backColor || color(240);
            this.textColor = color(25);
        };
        Button.prototype = {
            over: function() {
                return (mouseX > this.x && 
                        mouseX < this.x + this.w && 
                        mouseY > this.y && 
                        mouseY < this.y + this.h);
            },
            draw: function() {
                noStroke();

                this.hover = this.over();

                if(this.enabled && this.hover) {
                    scene.hover = true;
                }

                fill(this.backColor, this.selected ? 100 : this.enabled && this.hover ? 150 : 220);
                rect(this.x, this.y, this.w, this.h);

                pushStyle();
                    textAlign(CENTER, CENTER);
                    textSize(this.textSize);
                    fill(this.enabled ? this.textColor : color(this.textColor, 100));
                    text(this.content, this.x + this.w / 2, this.y + this.h / 2);
                popStyle();

                if(this.enabled && scene.clicked && this.hover) {
                    this.func();
                    if (window.parent && window.parent !== window) {
                        window.parent.postMessage({
                            type: 'groot_action_event',
                            action: this.content.toLowerCase(),
                            x: mouseX,
                            y: mouseY
                        }, '*');
                    }
                }
            }
        };
        return Button;
    })();

    var Groot = (function() {
        Groot = function() {
            this.themes = {
                summer: {
                    colors: {
                        outline: color(61, 38, 37),
                        dark: color(94, 132, 82),
                        medium: color(120, 159, 97),
                        light: color(151, 184, 126)
                    },
                    images: {
                        leafRight: undefined,
                        leafLeft: undefined
                    }
                },
                fall: {
                    colors: {
                        outline: color(61, 38, 37),
                        dark: color(211, 123, 43),
                        medium: color(217, 138, 70),
                        light: color(230, 181, 108)
                    },
                    images: {
                        leafRight: undefined,
                        leafLeft: undefined
                    }
                },
                winter: {
                    colors: {
                        outline: color(61, 38, 37),
                        dark: color(82, 122, 130),
                        medium: color(98, 153, 158),
                        light: color(127, 178, 184)
                    },
                    images: {
                        leafRight: undefined,
                        leafLeft: undefined
                    }
                },
                spring: {
                    colors: {
                        outline: color(61, 38, 37),
                        dark: color(94, 132, 82),
                        medium: color(120, 159, 97),
                        light: color(151, 184, 126)
                    },
                    images: {
                        leafRight: undefined,
                        leafLeft: undefined
                    }
                }
            };
            this.theme = this.themes.summer;
            this.colors = {
                outline: color(62, 39, 38),
                dark: color(144, 110, 76),
                medium: color(169, 135, 87),
                light: color(192, 174, 135),
            };
            this.character = "none";
            this.coords = {
                body: {
                    offset: 0
                },
                face: {
                    offset: 0,
                    angle: 0
                },
                arms: {
                    left: {
                        x1: 0,
                        y1: 0,
                        x2: 0,
                        y2: 0,
                        x3: 0,
                        y3: 0,
                        x4: 0,
                        y4: 0
                    },
                    right: {
                        x1: 0,
                        y1: 0,
                        x2: 0,
                        y2: 0,
                        x3: 0,
                        y3: 0,
                        x4: 0,
                        y4: 0
                    }
                },
                mouth: {
                    x1: 0, // left side
                    y1: 0, // left side
                    x2: 0, // bottom control point 1
                    y2: 0, // bottom control point 1
                    x3: 0, // bottom control point 2
                    y3: 0, // bottom control point 2
                    x4: 0, // right side
                    y4: 0, // right side
                    x5: 0, // top control point 1
                    y5: 0, // top control point 1
                    x6: 0, // top control point 2
                    y6: 0  // top control point 2
                },
                leaves: [
                    //head from left to right
                    {
                        scale: 1,
                        scaleMax: 1,
                    },
                    {
                        scale: 1,
                        scaleMax: 1,
                    },
                    {
                        scale: 1,
                        scaleMax: 1,
                    },
                    {
                        scale: 1,
                        scaleMax: 1,
                    },
                    {
                        scale: 1,
                        scaleMax: 1,
                    },
                    {
                        scale: 1,
                        scaleMax: 1,
                    },
                    //right arm
                    {
                        scale: 0.85,
                        scaleMax: 0.85,
                    },
                    //left arm from left to right
                    {
                        scale: 0.9,
                        scaleMax: 0.9,
                    },
                    {
                        scale: 0.9,
                        scaleMax: 0.9,
                    }
                ],
                flowers: [
                    //head from left to right
                    {
                        scale: 0,
                        scaleMax: 0.5,
                    },
                    {
                        scale: 0,
                        scaleMax: 0.5,
                    },
                    {
                        scale: 0,
                        scaleMax: 0.5,
                    },
                    //left hand
                    {
                        scale: 0,
                        scaleMax: 0.5,
                    }
                ],
                sticks: [
                    //head from left to right
                    {
                        scale: 0,
                        scaleMax: 0.5,
                    },
                    {
                        scale: 0,
                        scaleMax: 0.5,
                    },
                    {
                        scale: 0,
                        scaleMax: 0.5,
                    },
                    //left hand
                    {
                        scale: 0,
                        scaleMax: 0.5,
                    }
                ],
                snow: [
                    //head from left to right
                    {
                        x: 230,
                        y: 175,
                        diameter: 40,
                        opacity: 0
                    },
                    {
                        x: 280,
                        y: 160,
                        diameter: 30,
                        opacity: 0
                    },
                    {
                        x: 330,
                        y: 150,
                        diameter: 40,
                        opacity: 0
                    },
                    {
                        x: 370,
                        y: 195,
                        diameter: 25,
                        opacity: 0
                    }
                ]
            };
            this.action = "idle";
            this.idle = true;
            this.active = false;
            this.blink = {
                active: false,
                timer: 0,
                value: 0
            };
            this.eyeClose = 0;
            this.vel = 4;
            this.images = {};
            this.setup();
        };
        Groot.prototype = {
            setup: function() {
                //setup images

                // summer/spring leaf image
                pushStyle();
                    background(0, 0);
                    //main
                    noStroke();
                    fill(this.themes.summer.colors.outline);
                    beginShape();
                        vertex(195, 211);
                        bezierVertex(224, 184, 215, 148, 192, 138);
                        bezierVertex(170, 152, 164, 184, 195, 211);
                    endShape(CLOSE);
                    //inner full
                    fill(this.themes.summer.colors.medium);
                    beginShape();
                        vertex(194, 204);
                        bezierVertex(216, 181, 210, 161, 193, 144);
                        bezierVertex(174, 162, 175, 182, 194, 204);
                    endShape(CLOSE);
                    //inner half
                    fill(this.themes.summer.colors.dark);
                    beginShape();
                        vertex(194, 204);
                        bezierVertex(216, 181, 210, 161, 193, 144);
                        bezierVertex(199, 168, 198, 184, 194, 199);
                    endShape(CLOSE);
                    //line on leaf
                    noFill();
                    stroke(this.themes.summer.colors.outline);
                    strokeWeight(1);
                    bezier(198, 174, 198, 181, 198, 189, 194, 204);
                popStyle();

                // get image of the leaf
                this.images.leafRight = get(170, 135, 45, 78);

                background(0, 0);
                pushMatrix();
                    translate(45, 0);
                    scale(-1, 1);
                    image(this.images.leafRight, 0, 0);
                popMatrix();
                this.images.leafLeft = get(0, 0, 45, 78);


                // autumn leaf image
                pushStyle();
                    background(0, 0);
                    //main
                    noStroke();
                    fill(this.themes.fall.colors.outline);
                    beginShape();
                        vertex(195, 211);
                        bezierVertex(224, 184, 215, 148, 192, 138);
                        bezierVertex(170, 152, 164, 184, 195, 211);
                    endShape(CLOSE);
                    //inner full
                    fill(this.themes.fall.colors.medium);
                    beginShape();
                        vertex(194, 204);
                        bezierVertex(216, 181, 210, 161, 193, 144);
                        bezierVertex(174, 162, 175, 182, 194, 204);
                    endShape(CLOSE);
                    //inner half
                    fill(this.themes.fall.colors.dark);
                    beginShape();
                        vertex(194, 204);
                        bezierVertex(216, 181, 210, 161, 193, 144);
                        bezierVertex(199, 168, 198, 184, 194, 199);
                    endShape(CLOSE);
                    //line on leaf
                    noFill();
                    stroke(this.themes.fall.colors.outline);
                    strokeWeight(1);
                    bezier(198, 174, 198, 181, 198, 189, 194, 204);
                popStyle();

                // get image of the leaf
                this.images.leafRightAutumn = get(170, 135, 45, 78);

                background(0, 0);
                pushMatrix();
                    translate(45, 0);
                    scale(-1, 1);
                    image(this.images.leafRightAutumn, 0, 0);
                popMatrix();
                this.images.leafLeftAutumn = get(0, 0, 45, 78);

                this.themes.summer.images.leafRight = this.images.leafRight;
                this.themes.summer.images.leafLeft = this.images.leafLeft;
                this.themes.fall.images.leafRight = this.images.leafRightAutumn;
                this.themes.fall.images.leafLeft = this.images.leafLeftAutumn;
                this.themes.winter.images.leafRight = this.images.leafRightAutumn;
                this.themes.winter.images.leafLeft = this.images.leafLeftAutumn;
                this.themes.spring.images.leafRight = this.images.leafRight;
                this.themes.spring.images.leafLeft = this.images.leafLeft;

                //blossoms for spring
                background(0, 0);
                pushMatrix();
                    translate(300, 300);

                    noFill();
                    stroke(177, 33, 83);
                    strokeWeight(2);
                    bezier(0, 0, -10, 35, 10, 65, 0, 100);

                    noStroke();

                    rotate(radians(5));
                    for(var i = 0; i < 5; i++) {
                        rotate(radians(72));
                        fill(239, 180, 204);
                        ellipse(0, -20, 25, 60);
                        fill(177, 33, 83, random(150, 200));
                        ellipse(random(-7, 7), random(-20, -15), 4, 4);
                        ellipse(random(-7, 7), random(-20, -15), 4, 4);
                    }
                    fill(233, 110, 164);
                    ellipse(0, 0, 30, 30);
                    fill(177, 33, 83);
                    ellipse(0, 0, 15, 15);
                popMatrix();

                this.images.blossom = get(251, 248, 99, 154);

                //stick image for winter
                background(0, 0);
                pushMatrix();
                    translate(300, 300);
                    // rotate(0);

                    stroke(this.colors.outline);
                    strokeWeight(8);

                    line(0, 0, 0, -100);
                    line(0, -40, 30, -55);
                    line(0, -60, -20, -75);
                popMatrix();

                this.images.stick1 = get(276, 196, 57, 108);

                background(0, 0);
                pushMatrix();
                    translate(300, 300);
                    // rotate(0);

                    stroke(this.colors.dark);
                    strokeWeight(8);

                    line(0, 0, 0, -100);
                    line(0, -40, 30, -55);
                    line(0, -60, -20, -75);
                popMatrix();

                this.images.stick2 = get(276, 196, 57, 108);

            },
            draw: function() {
                pushStyle();
                    //shadow under pot
                    noStroke();
                    fill(40, 60);
                    ellipse(287, 550, 200, 30);

                    pushMatrix();
                        translate(this.coords.body.offset / 2, 0);

                        //leaves right arm
                        var px = bezierPoint(
                            292 + this.coords.arms.right.x1, 
                            250 + this.coords.arms.right.x2, 
                            210 + this.coords.arms.right.x3, 
                            183 + this.coords.arms.right.x4, 1.0);
                        var py = bezierPoint(
                            373 + this.coords.arms.right.y1, 
                            365 + this.coords.arms.right.y2, 
                            370 + this.coords.arms.right.y3, 
                            379 + this.coords.arms.right.y4, 1.0);
                        pushMatrix();
                            // translate(186 + 22, 301 + 78 + this.coords.body.offset / 2);
                            translate(px, py + this.coords.body.offset / 2);
                            rotate(radians(187 + this.coords.body.offset * 0.8));
                            scale(this.coords.leaves[6].scale);
                            translate(-22, -78);
                            image(this.theme.images.leafLeft, 0, 0);
                        popMatrix();

                        //right arm
                        noFill();
                        stroke(this.colors.outline);
                        strokeWeight(45);
                        bezier(
                            292 + this.coords.arms.right.x1, 373 + this.coords.arms.right.y1, 
                            250 + this.coords.arms.right.x2, 365 + this.coords.arms.right.y2, 
                            210 + this.coords.arms.right.x3, 370 + this.coords.arms.right.y3, 
                            183 + this.coords.arms.right.x4, 379 + this.coords.arms.right.y4);
                        stroke(this.colors.medium);
                        strokeWeight(30);
                        bezier(
                            292 + this.coords.arms.right.x1, 373 + this.coords.arms.right.y1, 
                            250 + this.coords.arms.right.x2, 365 + this.coords.arms.right.y2, 
                            210 + this.coords.arms.right.x3, 370 + this.coords.arms.right.y3, 
                            183 + this.coords.arms.right.x4, 379 + this.coords.arms.right.y4);
                        //light line on arm
                        stroke(this.colors.light);
                        strokeWeight(3);
                        bezier(
                            292 + this.coords.arms.right.x1, 363 + this.coords.arms.right.y1, 
                            250 + this.coords.arms.right.x2, 355 + this.coords.arms.right.y2, 
                            210 + this.coords.arms.right.x3, 360 + this.coords.arms.right.y3, 
                            183 + this.coords.arms.right.x4, 369 + this.coords.arms.right.y4);

                        //leaves left arm
                        var px = bezierPoint(
                            309 + this.coords.arms.left.x1, 
                            339 + this.coords.arms.left.x2, 
                            376 + this.coords.arms.left.x3, 
                            399 + this.coords.arms.left.x4, 1.0);
                        var py = bezierPoint(
                            378 - this.coords.arms.left.y1, 
                            392 - this.coords.arms.left.y2, 
                            396 - this.coords.arms.left.y3, 
                            393 - this.coords.arms.left.y4, 1.0);

                        //blossom
                        pushMatrix();
                            //99, 154
                            translate(px, py - this.coords.body.offset / 2);
                            rotate(radians(10 + this.coords.body.offset * 0.8));
                            scale(this.coords.flowers[3].scale);
                            translate(-45, -150);
                            image(this.images.blossom, 0, 0);
                        popMatrix();

                        //stick
                        pushMatrix();
                            translate(px, py - this.coords.body.offset * 0.2);
                            rotate(radians(10 + this.coords.body.offset * 0.8));
                            scale(this.coords.sticks[3].scale);
                            translate(-20, -130);
                            image(this.images.stick1, 0, 0);
                        popMatrix();

                        //leaves
                        pushMatrix();
                            translate(px, py - this.coords.body.offset / 2);
                            rotate(radians(45 + this.coords.body.offset * 0.8));
                            scale(this.coords.leaves[7].scale);
                            translate(-22, -78);
                            image(this.theme.images.leafRight, 0, 0);
                        popMatrix();
                        pushMatrix();
                            translate(px, py - this.coords.body.offset / 2);
                            rotate(radians(-17 + this.coords.body.offset * 0.8));
                            scale(this.coords.leaves[8].scale);
                            translate(-22, -78);
                            image(this.theme.images.leafLeft, 0, 0);
                        popMatrix();

                        //left arm
                        noFill();
                        stroke(this.colors.outline);
                        strokeWeight(45);
                        bezier(
                            309 + this.coords.arms.left.x1, 378 - this.coords.arms.left.y1, 
                            339 + this.coords.arms.left.x2, 392 - this.coords.arms.left.y2, 
                            376 + this.coords.arms.left.x3, 396 - this.coords.arms.left.y3, 
                            399 + this.coords.arms.left.x4, 393 - this.coords.arms.left.y4);
                        stroke(this.colors.dark);
                        strokeWeight(30);
                        bezier(
                            309 + this.coords.arms.left.x1, 378 - this.coords.arms.left.y1, 
                            339 + this.coords.arms.left.x2, 392 - this.coords.arms.left.y2, 
                            376 + this.coords.arms.left.x3, 396 - this.coords.arms.left.y3, 
                            399 + this.coords.arms.left.x4, 393 - this.coords.arms.left.y4);
                        strokeWeight(1);
                        noStroke();
                    popMatrix();

                    //body
                    //outline
                    noStroke();
                    fill(this.colors.outline);
                    beginShape();
                        vertex(262, 323);
                        bezierVertex(264 + this.coords.body.offset, 382, 260 + this.coords.body.offset, 421, 256, 463);
                        vertex(328, 463);
                        bezierVertex(332 + this.coords.body.offset, 421, 334 + this.coords.body.offset, 382, 331, 323);
                    endShape(CLOSE);
                    //dark
                    fill(this.colors.dark);
                    beginShape();
                        vertex(295, 323);
                        bezierVertex(297 + this.coords.body.offset, 382, 293 + this.coords.body.offset, 421, 284, 463);
                        vertex(318, 463);
                        bezierVertex(322 + this.coords.body.offset, 421, 324 + this.coords.body.offset, 382, 321, 323);
                    endShape(CLOSE);
                    //medium
                    fill(this.colors.medium);
                    beginShape();
                        vertex(272, 323);
                        bezierVertex(274 + this.coords.body.offset, 382, 270 + this.coords.body.offset, 421, 266, 463);
                        vertex(291, 463);
                        bezierVertex(295 + this.coords.body.offset, 421, 299 + this.coords.body.offset, 382, 297, 323);
                    endShape(CLOSE);
                    //light
                    stroke(this.colors.light);
                    strokeWeight(3);
                    noFill();
                    bezier(272, 323, 274 + this.coords.body.offset, 382, 270 + this.coords.body.offset, 421, 266, 463);

                    //translation of head section
                    pushMatrix();
                        translate(-5 + 300 + this.coords.face.offset / 2, 260);
                        //need to bundle rotates up into single call
                        rotate(radians(-4));
                        rotate(radians(-this.coords.face.offset / 2));
                        rotate(radians(this.coords.face.angle));
                        translate(-300, -260);

                        //flowers in spring
                        pushMatrix();
                            translate(205 + 17, 100 + 78);
                            rotate(radians(-41 - this.coords.face.angle * 0.2));
                            scale(this.coords.flowers[0].scale);
                            translate(-45, -150);
                            image(this.images.blossom, 0, 0);
                        popMatrix();
                        pushMatrix();
                            translate(281 + 16, 83 + 74);
                            rotate(radians(-7 - this.coords.face.angle * 0.2));
                            scale(this.coords.flowers[1].scale);
                            translate(-45, -150);
                            image(this.images.blossom, 0, 0);
                        popMatrix();
                        pushMatrix();
                            translate(375 + 21, 117 + 73);
                            rotate(radians(63 - this.coords.face.angle * 0.2));
                            scale(this.coords.flowers[2].scale);
                            translate(-45, -150);
                            image(this.images.blossom, 0, 0);
                        popMatrix();

                        //sticks in winter
                        pushMatrix();
                            translate(205 + 17, 100 + 78);
                            rotate(radians(-41 - this.coords.face.angle * 0.2));
                            scale(this.coords.sticks[3].scale);
                            translate(5, -109);
                            image(this.images.stick2, 0, 0);
                        popMatrix();
                        pushMatrix();
                            translate(281 + 16, 83 + 74);
                            rotate(radians(-7 - this.coords.face.angle * 0.2));
                            scale(this.coords.sticks[3].scale);
                            translate(5, -97);
                            image(this.images.stick1, 0, 0);
                        popMatrix();
                        pushMatrix();
                            translate(375 + 21, 117 + 73);
                            rotate(radians(63 - this.coords.face.angle * 0.2));
                            scale(this.coords.sticks[3].scale);
                            translate(-7, -101);
                            image(this.images.stick2, 0, 0);
                        popMatrix();

                        //leaves on head
                        //right side
                        pushMatrix();
                            translate(205 + 22, 100 + 78);
                            rotate(radians(-74 + this.coords.face.angle / 2));
                            scale(this.coords.leaves[0].scale);
                            translate(-22, -78);
                            image(this.theme.images.leafLeft, 0, 0);
                        popMatrix();
                        pushMatrix();
                            translate(205 + 22, 104 + 78);
                            rotate(radians(-14 - this.coords.face.angle / 2));
                            scale(this.coords.leaves[1].scale);
                            translate(-22, -78);
                            image(this.theme.images.leafRight, 0, 0);
                        popMatrix();
                        //center
                        pushMatrix();
                            translate(281 + 22, 83 + 78);
                            rotate(radians(-36 + this.coords.face.angle / 2));
                            scale(this.coords.leaves[2].scale);
                            translate(-22, -78);
                            image(this.theme.images.leafLeft, 0, 0);
                        popMatrix();
                        pushMatrix();
                            translate(279 + 22, 83 + 78);
                            rotate(radians(14 - this.coords.face.angle / 2));
                            scale(this.coords.leaves[3].scale);
                            translate(-22, -78);
                            image(this.theme.images.leafRight, 0, 0);
                        popMatrix();
                        //left side
                        pushMatrix();
                            translate(375 + 22, 117 + 78);
                            rotate(radians(26 + this.coords.face.angle / 2));
                            scale(this.coords.leaves[4].scale);
                            translate(-22, -78);
                            image(this.theme.images.leafLeft, 0, 0);
                        popMatrix();
                        pushMatrix();
                            translate(369 + 22, 110 + 78);
                            rotate(radians(97 - this.coords.face.angle / 2));
                            scale(this.coords.leaves[5].scale);
                            translate(-22, -78);
                            image(this.theme.images.leafRight, 0, 0);
                        popMatrix();

                        //head outline
                        noStroke();
                        fill(this.colors.outline);
                        beginShape();
                            vertex(217, 312);
                            vertex(222, 278);
                            vertex(204, 183);
                            vertex(257, 137);
                            vertex(267, 162);
                            vertex(290, 167);
                            vertex(295, 149);
                            vertex(369, 127);
                            vertex(363, 186);
                            vertex(382, 192);
                            vertex(395, 170);
                            vertex(415, 210);
                            vertex(389, 289);
                            vertex(385, 326);
                            bezierVertex(336, 380, 254, 365, 217, 312);
                        endShape(CLOSE);

                        //head inner
                        fill(this.colors.dark);
                        beginShape();
                            vertex(231, 308);
                            vertex(235, 281);
                            vertex(218, 189);
                            vertex(231, 175);
                            vertex(244, 213);
                            vertex(240, 166);
                            vertex(250, 157);
                            vertex(273, 220);
                            vertex(270, 176);
                            vertex(286, 178);
                            vertex(296, 201);
                            vertex(304, 164);
                            vertex(337, 152);
                            vertex(338, 188);
                            vertex(345, 151);
                            vertex(356, 146);
                            vertex(346, 229);
                            vertex(358, 200);
                            vertex(381, 203);
                            vertex(380, 216);
                            vertex(392, 199);
                            vertex(403, 216);
                            vertex(377, 284);
                            vertex(373, 322);
                            bezierVertex(367, 329, 360, 334, 352, 338);
                            vertex(353, 307);
                            vertex(343, 343);
                            vertex(336, 329);
                            vertex(333, 345);
                            bezierVertex(301, 352, 272, 344, 250, 329);
                            vertex(251, 288);
                            vertex(243, 322);
                            bezierVertex(239, 319, 236, 315, 231, 308);
                        endShape(CLOSE);

                        //head - light shading
                        fill(this.colors.medium);
                        beginShape();
                            vertex(231, 308);
                            vertex(235, 281);
                            vertex(218, 189);
                            vertex(231, 175);
                            vertex(245, 217);
                            vertex(240, 166);
                            vertex(247, 160);
                            vertex(274, 222);
                            vertex(270, 176);
                            vertex(283, 178);
                            vertex(296, 207);
                            vertex(304, 164);
                            vertex(324, 157);
                            vertex(300 + this.coords.face.offset, 235);
                            vertex(309 + this.coords.face.offset, 222);
                            vertex(302 + this.coords.face.offset, 315);
                            bezierVertex(288 + this.coords.face.offset, 330, 277 + this.coords.face.offset, 335, 266, 337);
                            vertex(263, 317);
                            vertex(255, 331);
                            vertex(250, 328);
                            vertex(251, 289);
                            vertex(251, 288);
                            vertex(243, 322);
                            bezierVertex(239, 319, 236, 315, 231, 308);
                        endShape();

                        //head - light line on right side
                        fill(this.colors.light);
                        beginShape();
                            vertex(235, 281);
                            vertex(217, 189);
                            vertex(231, 175);
                            vertex(220, 191);
                            bezierVertex(228, 224, 235, 258, 235, 281);
                        endShape(CLOSE);

                        //eyes
                        fill(this.colors.light);
                        ellipse(268 + this.coords.face.offset, 257, 33, 33);
                        ellipse(346 + this.coords.face.offset, 266, 33, 33);
                        fill(this.colors.outline);
                        ellipse(266 + this.coords.face.offset, 258, 33, 33);
                        ellipse(344 + this.coords.face.offset, 267, 33, 33);
                        fill(this.colors.light);
                        if(round(this.eyeClose) < 15) {
                            ellipse(271 + this.coords.face.offset, 252, 12, 12);
                            ellipse(349 + this.coords.face.offset, 261, 12, 12);
                        }

                        //eye actions
                        if(this.action === "sleep") {
                            this.eyeClose = lerp(this.eyeClose, 16, 0.075);
                            //right eye
                            fill(this.colors.medium);
                            rect(248 + this.coords.face.offset, 239, 38, 2 + this.eyeClose);
                            rect(248 + this.coords.face.offset, 275 - this.eyeClose, 38, 2 + this.eyeClose);
                            //left eye
                            fill(this.colors.dark);
                            rect(326 + this.coords.face.offset, 248, 38, 2 + this.eyeClose);
                            rect(326 + this.coords.face.offset, 284 - this.eyeClose, 38, 2 + this.eyeClose);
                        }
                        else if(this.blink.active) {
                            this.blink.timer++;
                            //right eye
                            fill(this.colors.medium);
                            rect(248 + this.coords.face.offset, 239, 38, 2 + abs(sin(radians(this.blink.timer * 10)) * 17));
                            rect(248 + this.coords.face.offset, 275 - abs(sin(radians(this.blink.timer * 10)) * 16), 38, 2 + abs(sin(radians(this.blink.timer * 10)) * 16));
                            //left eye
                            fill(this.colors.dark);
                            rect(326 + this.coords.face.offset, 249, 38, 2 + abs(sin(radians(this.blink.timer * 10)) * 17));
                            rect(326 + this.coords.face.offset, 283 - abs(sin(radians(this.blink.timer * 10)) * 16), 38, 2 + abs(sin(radians(this.blink.timer * 10)) * 16));
                        }

                        //mouth
                        stroke(this.colors.outline);
                        strokeWeight(6);
                        noStroke();
                        fill(this.colors.outline);

                        beginShape();
                            vertex(
                                283 + this.coords.mouth.x1 + this.coords.face.offset, 301 + this.coords.mouth.y1
                            );
                            bezierVertex(
                                295 + this.coords.mouth.x2 + this.coords.face.offset, 308 + this.coords.mouth.y2, 
                                308 + this.coords.mouth.x3 + this.coords.face.offset, 308 + this.coords.mouth.y3, 
                                320 + this.coords.mouth.x4 + this.coords.face.offset, 305 + this.coords.mouth.y4
                            );
                            vertex(
                                320 + this.coords.mouth.x4 + this.coords.face.offset, 302 + this.coords.mouth.y4
                            );
                            bezierVertex(
                                308 + this.coords.mouth.x5 + this.coords.face.offset, 304 + this.coords.mouth.y5, 
                                295 + this.coords.mouth.x6 + this.coords.face.offset, 304 + this.coords.mouth.y6,
                                283 + this.coords.mouth.x1 + this.coords.face.offset, 298 + this.coords.mouth.y1
                            );
                        endShape(CLOSE);

                        switch(this.character) {
                            case "pirate":
                                //patch on eye
                                stroke(this.colors.outline);
                                strokeWeight(3);
                                line(212, 219, 317 + this.coords.face.offset, 249);
                                line(358 + this.coords.face.offset, 255, 400, 252);
                                pushMatrix();
                                    translate(9 + this.coords.face.offset, -7);
                                    noStroke();
                                    fill(this.colors.outline);
                                    beginShape();
                                        vertex(336, 239);
                                        bezierVertex(352, 239, 364, 252, 365, 263);
                                        bezierVertex(364, 283, 350, 294, 336, 294);
                                        bezierVertex(322, 293, 306, 284, 307, 261);
                                        bezierVertex(309, 247, 324, 239, 336, 239);
                                    endShape(CLOSE);
                                popMatrix();
                                break;
                            case "star":
                                pushMatrix();
                                    translate(10 + this.coords.face.offset, 0);

                                    fill(168, 16, 168, 100);
                                    stroke(120, 9, 120);
                                    // stroke(this.colors.outline);
                                    strokeWeight(5);
                                    beginShape();
                                        vertex(255, 221);
                                        vertex(265, 242);
                                        vertex(291, 246);
                                        vertex(275, 264);
                                        vertex(280, 286);
                                        vertex(258, 280);
                                        vertex(234, 289);
                                        vertex(240, 266);
                                        vertex(221, 249);
                                        vertex(244, 244);
                                    endShape(CLOSE);
                                    beginShape();
                                        vertex(342, 227);
                                        vertex(349, 252);
                                        vertex(373, 262);
                                        vertex(353, 275);
                                        vertex(351, 297);
                                        vertex(333, 283);
                                        vertex(309, 289);
                                        vertex(317, 268);
                                        vertex(304, 246);
                                        vertex(329, 249);
                                    endShape(CLOSE);
                                popMatrix();
                                break;
                            case "love":
                                pushMatrix();
                                    translate(10 + this.coords.face.offset, 0);

                                    fill(253, 165, 177, 50);
                                    stroke(253, 165, 177, 200);
                                    strokeWeight(4);

                                    beginShape();
                                        vertex(336, 244);
                                        bezierVertex(345, 235, 360, 233, 366, 247);
                                        bezierVertex(369, 268, 356, 288, 333, 295);
                                        bezierVertex(306, 281, 300, 260, 306, 246);
                                        bezierVertex(313, 235, 326, 234, 336, 244);
                                    endShape(CLOSE);

                                    beginShape();
                                        vertex(259, 236);
                                        bezierVertex(269, 227, 286, 227, 290, 246);
                                        bezierVertex(289, 266, 273, 280, 256, 286);
                                        bezierVertex(232, 274, 222, 258, 227, 238);
                                        bezierVertex(233, 225, 248, 225, 259, 236);
                                    endShape(CLOSE);

                                    noFill();
                                    strokeWeight(2);
                                    line(206 - this.coords.face.offset, 246, 223, 243);
                                    bezier(290, 245, 295, 241, 300, 242, 304, 246);
                                    line(368, 252, 390 - this.coords.face.offset, 258);

                                popMatrix();
                                break;
                            case "ninja":
                                noFill();
                                stroke(this.colors.outline);
                                strokeWeight(10);
                                ellipse(266 + this.coords.face.offset, 258, 46, 46);
                                ellipse(344 + this.coords.face.offset, 267, 46, 46);

                                strokeWeight(1);
                                noStroke();
                                fill(this.colors.outline);
                                beginShape();
                                    vertex(212, 225);
                                    vertex(264 + this.coords.face.offset, 232);
                                    bezierVertex(242 + this.coords.face.offset, 240, 239 + this.coords.face.offset, 255, 253 + this.coords.face.offset, 281);
                                    vertex(222, 277);
                                endShape(CLOSE);
                                beginShape();
                                    vertex(277 + this.coords.face.offset, 235);
                                    vertex(341 + this.coords.face.offset, 241);
                                    bezierVertex(318 + this.coords.face.offset, 257, 318 + this.coords.face.offset, 268, 333 + this.coords.face.offset, 292);
                                    vertex(269 + this.coords.face.offset, 285);
                                    bezierVertex(289 + this.coords.face.offset, 264, 291 + this.coords.face.offset, 255, 279 + this.coords.face.offset, 233);
                                endShape(CLOSE);
                                beginShape();
                                    vertex(354 + this.coords.face.offset, 243);
                                    vertex(403, 246);
                                    vertex(390, 287);
                                    vertex(358 + this.coords.face.offset, 290);
                                    bezierVertex(369 + this.coords.face.offset, 273, 369 + this.coords.face.offset, 265, 354 + this.coords.face.offset, 243);
                                endShape(CLOSE);

                                break;
                            case "potter":
                                noFill();
                                stroke(this.colors.outline);
                                strokeWeight(5);

                                line(222, 243, 238 + this.coords.face.offset, 247);
                                line(297 + this.coords.face.offset, 254, 317 + this.coords.face.offset, 256);
                                line(370 + this.coords.face.offset, 259, 395, 258);

                                ellipse(266 + this.coords.face.offset, 258, 55, 55);
                                ellipse(344 + this.coords.face.offset, 267, 55, 55);

                                strokeWeight(2);
                                line(287, 202, 288, 212);
                                line(288, 212, 279, 207);
                                line(279, 207, 281, 219);

                                break;
                            case "pixel":
                                pushMatrix();
                                    translate(305, 245);
                                    rotate(radians(3));
                                    translate(-305, -245);
                                    translate(this.coords.face.offset, 3);

                                    fill(this.colors.outline);
                                    noStroke();

                                    //top frame
                                    rect(235, 240, 145, 7);

                                    //left
                                    rect(240, 246, 60, 10);
                                    rect(245, 255, 50, 10);
                                    rect(250, 261, 40, 10);
                                    rect(255, 268, 30, 10);
                                    //right
                                    rect(315, 246, 60, 10);
                                    rect(322, 255, 50, 10);
                                    rect(327, 261, 40, 10);
                                    rect(332, 268, 30, 10);

                                    fill(225);
                                    //left
                                    rect(248, 246, 8, 8);
                                    rect(253, 254, 8, 8);
                                    rect(258, 262, 8, 8);
                                    //right
                                    rect(325, 246, 8, 8);
                                    rect(330, 254, 8, 8);
                                    rect(335, 262, 8, 8);
                                popMatrix();

                                break;
                        }

                    popMatrix();

                    //pot
                    //outline
                    noStroke();
                    fill(this.theme.colors.outline);
                    beginShape();
                        vertex(348, 440);
                        bezierVertex(385, 438, 382, 482, 352, 489);
                        bezierVertex(358, 505, 351, 535, 333, 548);
                        bezierVertex(308, 550, 267, 550, 244, 548);
                        bezierVertex(214, 538, 214, 507, 215, 487);
                        bezierVertex(188, 476, 190, 445, 212, 440);
                    endShape(CLOSE);
                    //dark
                    fill(this.theme.colors.dark);
                    beginShape();
                        vertex(346, 448);
                        bezierVertex(367, 449, 366, 465, 359, 474);
                        bezierVertex(345, 481, 326, 480, 309, 481);
                        bezierVertex(329, 484, 344, 492, 343, 505);
                        bezierVertex(341, 522, 335, 533, 331, 538);
                        bezierVertex(299, 541, 264, 541, 245, 539);
                        bezierVertex(227, 527, 223, 505, 223, 480);
                        bezierVertex(201, 478, 198, 452, 210, 448);
                    endShape(CLOSE);
                    //medium
                    fill(this.theme.colors.medium);
                    beginShape();
                        vertex(294, 449);
                        bezierVertex(311, 449, 318, 456, 316, 467);
                        bezierVertex(311, 475, 300, 476, 290, 478);
                        bezierVertex(306, 492, 306, 522, 286, 540);
                        bezierVertex(268, 540, 257, 540, 245, 538);
                        bezierVertex(221, 522, 225, 498, 222, 480);
                        bezierVertex(200, 472, 199, 453, 211, 449);
                    endShape(CLOSE);
                    //light
                    fill(this.theme.colors.light);
                    beginShape();
                        vertex(275, 454);
                        bezierVertex(284, 454, 292, 455, 294, 461);
                        bezierVertex(295, 468, 285, 472, 275, 472);
                        bezierVertex(256, 473, 243, 473, 227, 472);
                        bezierVertex(214, 468, 213, 462, 213, 460);
                        bezierVertex(215, 454, 224, 455, 241, 454);
                    endShape(CLOSE);

                popStyle();
            },
            go: function() {
                this.draw();
            }
        };
        return Groot;
    })();

    var Scene = (function() {
        Scene = function() {
            this.clicked = false;
            this.hover = false;
            this.over = false;
            this.keys = [];
            this.started = false;
            this.timer = 0;
            this.talkTimer = 0;
            this.ball = {
                timer: 0,
                left: false,
                right: false,
                type: 0
            };
            this.idle = {
                value: 0,
                time: millis(),
                duration: 15,
                active: false,
                //previous action to go back to
                action: "idle"
            };
            this.vel = 0;
            this.shake = 0;
            this.shakedown = 0.1;
            this.selectedColor = color(0);
            this.action = {
                active: false,
                timer: 0
            };
            this.words = [
                {
                    content: "I",
                    x: 300,
                    y: 330,
                    opacity: 0,
                    dir: 1,
                    active: false
                },
                {
                    content: "AM",
                    x: 300,
                    y: 360,
                    opacity: 0,
                    dir: 1,
                    active: false
                },
                {
                    content: "GROOT",
                    x: 300,
                    y: 390,
                    opacity: 0,
                    dir: 1,
                    active: false
                }
            ];
            this.themes = {
                summer: {
                    back: color(93, 200, 220, 240),
                    ground: color(94, 132, 82)
                },
                fall: {
                    back: color(251, 170, 44, 200),
                    ground: color(211, 123, 43)
                },
                winter: {
                    back: color(93, 200, 210, 150),
                    ground: color(250)
                },
                spring: {
                    back: color(160, 187, 58, 200),
                    ground: color(94, 132, 82)
                }
            };
            this.theme = this.themes.summer;
            this.groot = new Groot();
            this.zzzs = [];
            this.snows = [];
            this.balls = [];
            this.crumbs = [];
            this.explosions = [];
            this.cup = {
                x: 300,
                y: 380,
                w: 115,
                h: 170,
                colors: [
                    color(212, 56, 53),     //red
                    color(65, 147, 156),    //blue
                    color(209, 200, 75)     //yellow
                ],
                color: color(212, 56, 53),
                total: 100 //how full the cup is in percentage
            };
            this.sun = {
                x: -150,
                y: -150,
                diameter: 300,
                colors: {
                    fill: color(225, 232, 90),
                    stroke: color(212, 217, 78)
                },
                opacity: 255
            };
            this.spots = [];
            this.spoon = {
                x: 400,
                y: 300,
                w: 80,
                h: 50,
                colors: {
                    dark: color(65, 150, 170),
                    medium: color(115, 200, 220),
                    light: color(170, 220, 230),
                    food: color(207, 126, 72)
                },
                enabled: false,
                hover: false
            };
            this.buttons = {
                actions: {
                    idle: new Button({
                        content: "Idle",
                        x: 525,
                        y: 20,
                        selected: true,
                        func: function() {
                            scene.groot.action = "idle";
                            scene.action.active = false;
                            scene.action.timer = 0;
                            scene.updateActionButtons();
                        }
                    }),
                    dance: new Button({
                        content: "Dance",
                        x: 525,
                        y: 60,
                        func: function() {
                            scene.groot.action = "dance";
                            scene.action.active = true;
                            scene.action.timer = 240;
                            scene.updateActionButtons();
                        }
                    }),
                    sleep: new Button({
                        content: "Sleep",
                        x: 525,
                        y: 100,
                        func: function() {
                            scene.groot.action = "sleep";
                            scene.action.active = true;
                            scene.action.timer = 240;
                            scene.updateActionButtons();
                        }
                    }),
                    wave: new Button({
                        content: "Wave",
                        x: 525,
                        y: 140,
                        func: function() {
                            scene.groot.action = "wave";
                            scene.action.active = true;
                            scene.action.timer = 240;
                            scene.updateActionButtons();
                        }
                    }),
                    eat: new Button({
                        content: "Eat",
                        x: 525,
                        y: 180,
                        func: function() {
                            scene.groot.action = "eat";
                            scene.action.active = true;
                            scene.action.timer = 240;
                            scene.spoon.x = mouseX;
                            scene.spoon.y = mouseY - 20;
                            scene.spoon.colors.food = color(random(150, 200), random(150, 200), random(150, 200));
                            scene.updateActionButtons();
                        }
                    }),
                    drink: new Button({
                        content: "Drink",
                        x: 525,
                        y: 220,
                        func: function() {
                            scene.groot.action = "drink";
                            scene.cup.x = -scene.cup.w;
                            scene.cup.color = scene.cup.colors[~~random(scene.cup.colors.length)];
                            scene.action.active = true;
                            scene.action.timer = 240;
                            // scene.idle.time = millis();
                            scene.updateActionButtons();
                        }
                    }),
                    talk: new Button({
                        content: "Talk",
                        x: 525,
                        y: 260,
                        func: function() {
                            scene.groot.action = "talk";
                            scene.action.active = true;
                            scene.action.timer = 240;
                            scene.talkTimer = 50;
                            scene.updateActionButtons();
                        }
                    }),
                    juggle: new Button({
                        content: "Juggle",
                        x: 525,
                        y: 300,
                        func: function() {
                            if(scene.groot.action !== "juggle") {
                                scene.setBalls();
                            }
                            scene.groot.action = "juggle";
                            scene.action.active = true;
                            scene.action.timer = 240;
                            scene.updateActionButtons();
                        }
                    })
                },
                juggles: {
                    balls: new Button({
                        content: "Balls",
                        x: 525,
                        y: 380,
                        selected: true,
                        func: function() {
                            scene.ball.type = 0;
                            scene.updateJuggleButtons("balls");
                        }
                    }),
                    knives: new Button({
                        content: "Knives",
                        x: 525,
                        y: 420,
                        func: function() {
                            scene.ball.type = 1;
                            scene.updateJuggleButtons("knives");
                        }
                    }),
                    stars: new Button({
                        content: "Stars",
                        x: 525,
                        y: 460,
                        func: function() {
                            scene.ball.type = 2;
                            scene.updateJuggleButtons("stars");
                        }
                    }),
                    cards: new Button({
                        content: "Cards",
                        x: 525,
                        y: 500,
                        func: function() {
                            scene.ball.type = 3;
                            scene.updateJuggleButtons("cards");
                        }
                    }),
                    penguins: new Button({
                        content: "Penguins",
                        x: 525,
                        y: 540,
                        func: function() {
                            scene.ball.type = 4;
                            scene.updateJuggleButtons("penguins");
                        }
                    })
                },
                themes: {
                    summer: new Button({
                        content: "Summer",
                        x: 0,
                        y: 20,
                        selected: true,
                        func: function() {
                            scene.theme = scene.themes.summer;
                            scene.groot.theme = scene.groot.themes.summer;
                            scene.updateThemeButtons("summer");
                        }
                    }),
                    fall: new Button({
                        content: "Fall",
                        x: 0,
                        y: 60,
                        func: function() {
                            scene.theme = scene.themes.fall;
                            scene.groot.theme = scene.groot.themes.fall;
                            scene.updateThemeButtons("fall");
                        }
                    }),
                    winter: new Button({
                        content: "Winter",
                        x: 0,
                        y: 100,
                        func: function() {
                            scene.theme = scene.themes.winter;
                            scene.groot.theme = scene.groot.themes.winter;
                            scene.updateThemeButtons("winter");
                        }
                    }),
                    spring: new Button({
                        content: "Spring",
                        x: 0,
                        y: 140,
                        func: function() {
                            scene.theme = scene.themes.spring;
                            scene.groot.theme = scene.groot.themes.spring;
                            scene.updateThemeButtons("spring");
                        }
                    })
                },
                characters: {
                    none: new Button({
                        content: "None",
                        x: 0,
                        y: 220,
                        selected: true,
                        func: function() {
                            scene.groot.character = "none";
                            scene.updateCharacterButtons("none");
                        }
                    }),
                    pirate: new Button({
                        content: "Pirate",
                        x: 0,
                        y: 260,
                        func: function() {
                            scene.groot.character = "pirate";
                            scene.updateCharacterButtons("pirate");
                        }
                    }),
                    ninja: new Button({
                        content: "Ninja",
                        x: 0,
                        y: 300,
                        func: function() {
                            scene.groot.character = "ninja";
                            scene.updateCharacterButtons("ninja");
                        }
                    }),
                    potter: new Button({
                        content: "Potter",
                        x: 0,
                        y: 340,
                        func: function() {
                            scene.groot.character = "potter";
                            scene.updateCharacterButtons("potter");
                        }
                    }),
                    star: new Button({
                        content: "Star",
                        x: 0,
                        y: 380,
                        func: function() {
                            scene.groot.character = "star";
                            scene.updateCharacterButtons("star");
                        }
                    }),
                    love: new Button({
                        content: "Love",
                        x: 0,
                        y: 420,
                        func: function() {
                            scene.groot.character = "love";
                            scene.updateCharacterButtons("love");
                        }
                    }),
                    pixel: new Button({
                        content: "Pixel",
                        x: 0,
                        y: 460,
                        func: function() {
                            scene.groot.character = "pixel";
                            scene.updateCharacterButtons("pixel");
                        }
                    })
                }
            };
            this.init();
        };
        Scene.prototype = {
            init: function() {
                for(var i = 0; i < 3; i++) {
                    this.balls.push({
                        x: 0,
                        y: 0,
                        diameter: 40,
                        vx: -1.4,
                        vy: 0,
                        delay: i * 240,
                        timer: 0,
                        gravity: 0.25,
                        color: color(random(180, 240), random(180, 240), random(180, 240)),
                        opacity: 255,
                        active: false,
                        started: false,
                        type: 0,
                        angle: 0,
                        angleDir: 1
                    });
                }
            },
            collisionColor: function(clr) {
                for (var property in this.groot.colors) {
                    if(clr === this.groot.colors[property]) {
                        this.selectedColor = color(clr);
                        return true;
                    }
                }
                return false;
            },
            shakeScreen: function() {
                if(this.shake > 0) {
                    this.shake = lerp(this.shake, 0, this.shakedown);
                    translate(round(random(-this.shake, this.shake)), round(random(-this.shake, this.shake)));
                }
            },
            runZs: function() {
                if(this.zzzs.length > 0) {
                    pushStyle();
                        textAlign(CENTER, CENTER);

                        for(var i = this.zzzs.length - 1; i >= 0; i--) {
                            var z = this.zzzs[i];

                            pushMatrix();
                                translate(z.x, z.y);
                                rotate(radians(frameCount * 2));

                                fill(0, z.opacity);
                                textSize(z.size);
                                text("Z", 0, 0);

                                z.opacity-=2;
                                z.y-= 2;

                                if(z.opacity <= 0) {
                                    this.zzzs.splice(i, 1);
                                }
                            popMatrix();
                        }
                    popStyle();
                }
            },
            setBalls: function() {
                //set the initial params for each ball
                for(var i = 0; i < this.balls.length; i++) {
                    var ball = this.balls[i];

                    ball.opacity = 50;
                    ball.color = color(random(180, 240), random(180, 240), random(180, 240));
                    ball.x = 183;
                    ball.y = 379;
                    ball.vx = -2.3;
                    ball.vy = 0;
                    ball.delay = 30 + (i * 60);
                    ball.timer = 0;
                    ball.active = false;
                    ball.started = false;
                    ball.angle = 0;
                    ball.angleDir = -1;
                }

                this.ball.timer = 0;
            },
            runBalls: function() {
                if(this.groot.action === "juggle") {
                    this.ball.timer++;

                    //run through each ball
                    noStroke();
                    for(var i = 0; i < this.balls.length; i++) {
                        var ball = this.balls[i];

                        if(ball.active) {
                            //fade in the balls

                            switch(this.ball.type) {
                                case 0:
                                    ball.opacity = constrain(ball.opacity + 5, 0, 255);
                                    stroke(this.groot.colors.outline, ball.opacity);
                                    strokeWeight(4);
                                    fill(ball.color, ball.opacity);
                                    ellipse(ball.x, ball.y, ball.diameter, ball.diameter);
                                    break;
                                case 1:
                                    ball.opacity = constrain(ball.opacity + 5, 0, 255);
                                    pushMatrix();
                                        ball.w = 37;
                                        ball.h = 67;

                                        translate(ball.x, ball.y);
                                        ball.angle += 5 * ball.angleDir;
                                        rotate(radians(ball.angle));

                                        //blade
                                        noStroke();
                                        fill(200, 200, 200);
                                        beginShape();
                                            vertex(-ball.w*0.25, -ball.h*0.2);
                                            vertex(ball.w*0.25, -ball.h*0.2);
                                            bezierVertex(ball.w*0.25, ball.h*0.3, ball.w*0.1, ball.h*0.5, 0, ball.h*0.65);
                                            bezierVertex(-ball.w*0.1, ball.h*0.5, -ball.w*0.25, ball.h*0.3, -ball.w*0.25, -ball.h*0.2);
                                        endShape(CLOSE);
                                        //cuff
                                        stroke(100);
                                        strokeWeight(2);
                                        line(-ball.w*0.6, -ball.h*0.2, ball.w*0.6, -ball.h*0.2);
                                        //handle
                                        noStroke();
                                        fill(100);
                                        beginShape();
                                            vertex(-ball.w*0.2, -ball.h*0.2);
                                            vertex(-ball.w*0.2, -ball.h*0.55);
                                            vertex(ball.w*0.2, -ball.h*0.55);
                                            vertex(ball.w*0.2, -ball.h*0.2);
                                        endShape(CLOSE);
                                    popMatrix();
                                    break;
                                case 2:
                                    pushMatrix();

                                        ball.w = 30;
                                        ball.h = 30;

                                        translate(ball.x, ball.y);
                                        ball.angle += 5 * ball.angleDir;
                                        rotate(radians(ball.angle));

                                        //star
                                        fill(
                                            i === 0 ?   this.groot.theme.colors.dark :
                                            i === 1 ?   this.groot.theme.colors.medium :
                                                        this.groot.theme.colors.light);
                                        stroke(255);
                                        strokeWeight(2);
                                        beginShape();
                                            vertex(0, -ball.h);
                                            vertex(ball.w*0.3, -ball.h*0.4);
                                            vertex(ball.w*0.9, -ball.h*0.3);
                                            vertex(ball.w*0.5, ball.h*0.15);
                                            vertex(ball.w*0.6, ball.h*0.8);
                                            vertex(0, ball.h*0.5);
                                            vertex(-ball.w*0.6, ball.h*0.8);
                                            vertex(-ball.w*0.5, ball.h*0.15);
                                            vertex(-ball.w*0.9, -ball.h*0.3);
                                            vertex(-ball.w*0.3, -ball.h*0.4);
                                        endShape(CLOSE);
                                    popMatrix();
                                    break;
                                case 3:
                                    pushMatrix();
                                        pushStyle();
                                        ball.w = 36;
                                        ball.h = 48;

                                        translate(ball.x, ball.y);
                                        ball.angle += 5 * ball.angleDir;
                                        rotate(radians(ball.angle));

                                        noStroke();
                                        fill(250, 250, 250);
                                        rectMode(CENTER);
                                        rect(0, 0, ball.w, ball.h);

                                        scale(0.35);

                                        textSize(30);
                                        fill(255, 0, 0);
                                        text("A", -ball.w * 1.25, -ball.h * 0.7);

                                        translate(0, ball.h*0.2);

                                        beginShape();
                                            vertex(0, -ball.h*0.5);
                                            bezierVertex(-ball.w*1.15, -ball.h*0.85, -ball.w*0.45, ball.h*0.25, 0, ball.h*0.5);
                                            bezierVertex(ball.w*0.45, ball.h*0.25, ball.w*1.15, -ball.h*0.85, 0, -ball.h*0.5);
                                        endShape(CLOSE);

                                        rotate(radians(180));
                                        text("A", -ball.w * 1.25, -ball.h * 0.65);
                                        popStyle();
                                    popMatrix();
                                    break;
                                case 4:
                                    pushMatrix();

                                        ball.w = 45;
                                        ball.h = 45;

                                        translate(ball.x, ball.y);
                                        ball.angle += 5 * ball.angleDir;
                                        rotate(radians(ball.angle));

                                        noStroke();

                                        //legs
                                        fill(243, 57, 0, 200);
                                        //left
                                        beginShape();
                                            vertex(ball.w*0.1, ball.h*0.48);
                                            vertex(ball.w*0.12, ball.h*0.65);
                                            bezierVertex(ball.w*0.2, ball.h*0.62,ball.w*0.35, ball.h*0.57, ball.w*0.4, ball.h*0.73);
                                            vertex(ball.w*0.06, ball.h*0.72);
                                            vertex(ball.w*0.05, ball.h*0.48);
                                            vertex(ball.w*0.1, ball.h*0.48);
                                        endShape();
                                        //right
                                        beginShape();
                                            vertex(-ball.w*0.1, ball.h*0.48);
                                            vertex(-ball.w*0.12, ball.h*0.65);
                                            bezierVertex(-ball.w*0.2, ball.h*0.62,-ball.w*0.35, ball.h*0.57, -ball.w*0.4, ball.h*0.72);
                                            vertex(-ball.w*0.06, ball.h*0.72);
                                            vertex(-ball.w*0.05, ball.h*0.48);
                                            vertex(-ball.w*0.1, ball.h*0.48);
                                        endShape();

                                        //body
                                        //outer
                                        fill(33, 33, 33);
                                        beginShape();
                                            vertex(0, -ball.h*0.5);
                                            bezierVertex(-ball.w*0.5, -ball.h*0.5, -ball.w*0.8, ball.h*0.5, 0, ball.h*0.5);
                                            bezierVertex(ball.w*0.8, ball.h*0.5, ball.w*0.5, -ball.h*0.5, 0, -ball.h*0.5);
                                        endShape();
                                        //inner
                                        fill(250, 250, 250);
                                        beginShape();
                                            vertex(0, -ball.h*0.45);
                                            bezierVertex(-ball.w*0.45, -ball.h*0.45, -ball.w*0.65, ball.h*0.45, 0, ball.h*0.48);
                                            bezierVertex(ball.w*0.65, ball.h*0.48, ball.w*0.45, -ball.h*0.45, 0, -ball.h*0.45);
                                        endShape();

                                        //arms
                                        //left
                                        fill(33, 33, 33);
                                        beginShape();
                                            vertex(-ball.w*0.4, -ball.h*0.23);
                                            bezierVertex(-ball.w*0.6, -ball.h*0.28, -ball.w*0.53, -ball.h*0.3, -ball.w*0.6, -ball.h*0.3);
                                            bezierVertex(-ball.w*0.6, -ball.h*0.15, -ball.w*0.5, -ball.h*0.08, -ball.w*0.48, -ball.h*0.05);
                                            vertex(-ball.w*0.4, -ball.h*0.23);
                                        endShape();
                                        //right
                                        beginShape();
                                            vertex(ball.w*0.4, -ball.h*0.23);
                                            bezierVertex(ball.w*0.6, -ball.h*0.28, ball.w*0.53, -ball.h*0.3, ball.w*0.6, -ball.h*0.3);
                                            bezierVertex(ball.w*0.6, -ball.h*0.15, ball.w*0.5, -ball.h*0.08, ball.w*0.48, -ball.h*0.05);
                                            vertex(ball.w*0.4, -ball.h*0.23);
                                        endShape();

                                        //eyes
                                        fill(33, 33, 33);
                                        ellipse(-ball.w*0.12, -ball.h*0.3, ball.w*0.04, ball.h*0.07);
                                        ellipse(ball.w*0.12, -ball.h*0.3, ball.w*0.04, ball.h*0.07);

                                        //beak
                                        fill(234, 156, 16);
                                        beginShape();
                                            vertex(ball.w*0.1, -ball.h*0.22);
                                            bezierVertex(ball.w*0.05, -ball.h*0.12, ball.w*0.01, -ball.h*0.12, 0, -ball.h*0.12);
                                            bezierVertex(-ball.w*0.01, -ball.h*0.12, -ball.w*0.05, -ball.h*0.12, -ball.w*0.1, -ball.h*0.22);
                                            bezierVertex(-ball.w*0.02, -ball.h*0.25, ball.w*0.02, -ball.h*0.25, ball.w*0.1, -ball.h*0.22);
                                        endShape();

                                        //flush cheeks
                                        fill(232, 118, 161, 100);
                                        ellipse(-ball.w*0.2, -ball.h*0.2, ball.w/12, ball.h/12);
                                        ellipse(ball.w*0.2, -ball.h*0.2, ball.w/12, ball.h/12);
                                    popMatrix();
                                    break;
                            }

                            ball.x += ball.vx;

                            if(ball.y === 379) {
                                ball.angleDir*= -1;
                                ball.vy = 0;
                                if(ball.vx > 0) {
                                    this.ball.left = true;
                                }
                                else {
                                    this.ball.right = true;
                                }
                            }

                            if(ball.timer === 0 || ball.timer % 95 === 0) {
                                ball.vy+= -12;
                                ball.vx = -ball.vx;
                            }

                            ball.timer++;

                            ball.vy+= ball.gravity;
                            ball.y = constrain(ball.y + ball.vy, 0, 379);
                        }
                        else if(this.ball.timer > ball.delay) {
                            ball.active = true;
                        }
                    }
                }
            },
            runExplosions: function() {
                stroke(this.groot.colors.light);
                strokeWeight(1);
                for(var i = this.explosions.length - 1; i >= 0; i--) {
                    var explosion = this.explosions[i];

                    pushMatrix();
                        translate(explosion.x, explosion.y);
                        rotate(radians(explosion.angle));
                        fill(explosion.color, explosion.opacity);
                        rect(-explosion.size / 2, -explosion.size / 2, explosion.size, explosion.size);
                    popMatrix();

                    explosion.x+= explosion.vx;
                    explosion.y+= explosion.vy;
                    explosion.angle += explosion.rot;
                    explosion.opacity-= explosion.opacitySpeed;

                    if(explosion.opacity <= 0) {
                        this.explosions.splice(i, 1);
                    }
                }
            },
            resetArmsX: function() {
                //left arm
                this.groot.coords.arms.left.x1 = lerp(this.groot.coords.arms.left.x1, 0, 0.1);
                this.groot.coords.arms.left.x2 = lerp(this.groot.coords.arms.left.x2, 0, 0.1);
                this.groot.coords.arms.left.x3 = lerp(this.groot.coords.arms.left.x3, 0, 0.1);
                this.groot.coords.arms.left.x4 = lerp(this.groot.coords.arms.left.x4, 0, 0.1);

                //right arm
                this.groot.coords.arms.right.x1 = lerp(this.groot.coords.arms.right.x1, 0, 0.1);
                this.groot.coords.arms.right.x2 = lerp(this.groot.coords.arms.right.x2, 0, 0.1);
                this.groot.coords.arms.right.x3 = lerp(this.groot.coords.arms.right.x3, 0, 0.1);
                this.groot.coords.arms.right.x4 = lerp(this.groot.coords.arms.right.x4, 0, 0.1);
            },
            resetArmsY: function() {
                //left arm
                this.groot.coords.arms.left.y1 = lerp(this.groot.coords.arms.left.y1, 0, 0.1);
                this.groot.coords.arms.left.y2 = lerp(this.groot.coords.arms.left.y2, 0, 0.1);
                this.groot.coords.arms.left.y3 = lerp(this.groot.coords.arms.left.y3, 0, 0.1);
                this.groot.coords.arms.left.y4 = lerp(this.groot.coords.arms.left.y4, 0, 0.1);

                //right arm
                this.groot.coords.arms.right.y1 = lerp(this.groot.coords.arms.right.y1, 0, 0.1);
                this.groot.coords.arms.right.y2 = lerp(this.groot.coords.arms.right.y2, 0, 0.1);
                this.groot.coords.arms.right.y3 = lerp(this.groot.coords.arms.right.y3, 0, 0.1);
                this.groot.coords.arms.right.y4 = lerp(this.groot.coords.arms.right.y4, 0, 0.1);
            },
            resetMouth: function() {
                this.groot.coords.mouth.x1 = lerp(this.groot.coords.mouth.x1, 0, 0.1);
                this.groot.coords.mouth.x2 = lerp(this.groot.coords.mouth.x2, 0, 0.1);
                this.groot.coords.mouth.x3 = lerp(this.groot.coords.mouth.x3, 0, 0.1);
                this.groot.coords.mouth.x4 = lerp(this.groot.coords.mouth.x4, 0, 0.1);
                this.groot.coords.mouth.x5 = lerp(this.groot.coords.mouth.x5, 0, 0.1);
                this.groot.coords.mouth.x6 = lerp(this.groot.coords.mouth.x6, 0, 0.1);
                this.groot.coords.mouth.y1 = lerp(this.groot.coords.mouth.y1, 0, 0.1);
                this.groot.coords.mouth.y2 = lerp(this.groot.coords.mouth.y2, 0, 0.1);
                this.groot.coords.mouth.y3 = lerp(this.groot.coords.mouth.y3, 0, 0.1);
                this.groot.coords.mouth.y4 = lerp(this.groot.coords.mouth.y4, 0, 0.1);
                this.groot.coords.mouth.y5 = lerp(this.groot.coords.mouth.y5, 0, 0.1);
                this.groot.coords.mouth.y6 = lerp(this.groot.coords.mouth.y6, 0, 0.1);
            },
            runAction: function() {
                switch(this.groot.action) {
                    case "idle":
                        //do nothing
                        break;
                    case "dance":
                        this.groot.vel = 7;

                        this.groot.coords.face.offset = cos(radians(this.timer * this.groot.vel)) * 10;
                        this.groot.coords.face.angle = sin(radians(this.timer * this.groot.vel)) * 5;
                        this.groot.coords.body.offset = sin(radians(this.timer * this.groot.vel)) * 12;
                        this.groot.coords.arms.left.y2 = lerp(this.groot.coords.arms.left.y2, this.groot.coords.body.offset, 0.2);
                        this.groot.coords.arms.left.y3 = lerp(this.groot.coords.arms.left.y3, this.groot.coords.body.offset, 0.2);
                        this.groot.coords.arms.right.y2 = lerp(this.groot.coords.arms.right.y2, this.groot.coords.body.offset, 0.2);
                        this.groot.coords.arms.right.y3 = lerp(this.groot.coords.arms.right.y3, this.groot.coords.body.offset, 0.2);
                        this.groot.coords.arms.left.y4 = lerp(this.groot.coords.arms.left.y4, 0, 0.2);
                        this.groot.coords.arms.right.y4 = lerp(this.groot.coords.arms.right.y4, 0, 0.2);

                        this.resetArmsX();
                        this.resetMouth();

                        break;
                    case "sleep":
                        this.groot.vel = 4;

                        this.groot.coords.face.offset = lerp(this.groot.coords.face.offset, cos(radians(this.timer * this.groot.vel)) * 0.5, 0.1);
                        this.groot.coords.face.angle = lerp(this.groot.coords.face.angle, sin(radians(this.timer * this.groot.vel)) * 0.25, 0.1);

                        this.groot.coords.body.offset = lerp(this.groot.coords.body.offset, 0, 0.1);

                        this.groot.coords.arms.left.y2 = lerp(this.groot.coords.arms.left.y2, 12, 0.1);
                        this.groot.coords.arms.left.y3 = lerp(this.groot.coords.arms.left.y3, 6, 0.1);
                        this.groot.coords.arms.left.y4 = lerp(this.groot.coords.arms.left.y4, -25, 0.1);

                        this.groot.coords.arms.right.y2 = lerp(this.groot.coords.arms.right.y2, 5, 0.1);
                        this.groot.coords.arms.right.y3 = lerp(this.groot.coords.arms.right.y3, 15, 0.1);
                        this.groot.coords.arms.right.y4 = lerp(this.groot.coords.arms.right.y4, 30, 0.1);

                        this.resetArmsX();
                        this.resetMouth();

                        if(this.timer % 120 < 60) {
                            this.groot.coords.mouth.y2 = lerp(this.groot.coords.mouth.y2, 10, 0.1);
                            this.groot.coords.mouth.y3 = lerp(this.groot.coords.mouth.y3, 10, 0.1);
                            this.groot.coords.mouth.y5 = lerp(this.groot.coords.mouth.y5, -20, 0.1);
                            this.groot.coords.mouth.y6 = lerp(this.groot.coords.mouth.y6, -20, 0.1);

                            this.groot.coords.mouth.x1 = lerp(this.groot.coords.mouth.x1, 16, 0.1);
                            this.groot.coords.mouth.x4 = lerp(this.groot.coords.mouth.x4, -16, 0.1);
                        }
                        else {
                            this.groot.coords.mouth.y2 = lerp(this.groot.coords.mouth.y2, 5, 0.1);
                            this.groot.coords.mouth.y3 = lerp(this.groot.coords.mouth.y3, 5, 0.1);
                            this.groot.coords.mouth.y5 = lerp(this.groot.coords.mouth.y5, -15, 0.1);
                            this.groot.coords.mouth.y6 = lerp(this.groot.coords.mouth.y6, -15, 0.1);

                            this.groot.coords.mouth.x1 = lerp(this.groot.coords.mouth.x1, 8, 0.1);
                            this.groot.coords.mouth.x4 = lerp(this.groot.coords.mouth.x4, -8, 0.1);
                        }

                        //add zzzs when sleeping
                        if(frameCount % 60 === 0) {
                            this.zzzs.push({
                               x: random(270, 330),
                               y: 180,
                               size: 40,
                               opacity: 200
                            });
                        }
                        break;
                    case "wave":
                        this.groot.vel = 4;

                        this.groot.coords.face.offset = lerp(this.groot.coords.face.offset, cos(radians(this.timer * this.groot.vel)) * 1, 0.1);
                        this.groot.coords.face.angle = lerp(this.groot.coords.face.angle, sin(radians(this.timer * this.groot.vel)) * 1, 0.1);

                        this.groot.coords.body.offset = lerp(this.groot.coords.body.offset, 0, 0.1);

                        //left arm
                        this.groot.coords.arms.left.x4 = lerp(this.groot.coords.arms.left.x4, sin(radians(this.timer * this.groot.vel * 3)) * 15, 0.1);
                        this.groot.coords.arms.left.y4 = lerp(this.groot.coords.arms.left.y4, 40 + sin(radians(this.timer * this.groot.vel * 3)) * -10, 0.1);
                        this.groot.coords.arms.left.x2 = lerp(this.groot.coords.arms.left.x2, this.groot.coords.body.offset, 0.1);
                        this.groot.coords.arms.left.x3 = lerp(this.groot.coords.arms.left.x3, this.groot.coords.body.offset, 0.1);
                        this.groot.coords.arms.left.y2 = lerp(this.groot.coords.arms.left.y2, this.groot.coords.body.offset, 0.1);
                        this.groot.coords.arms.left.y3 = lerp(this.groot.coords.arms.left.y3, this.groot.coords.body.offset, 0.1);

                        //right arm
                        this.groot.coords.arms.right.x4 = lerp(this.groot.coords.arms.right.x4, 30, 0.1);
                        this.groot.coords.arms.right.y2 = lerp(this.groot.coords.arms.right.y2, 5, 0.1);
                        this.groot.coords.arms.right.y3 = lerp(this.groot.coords.arms.right.y3, 15, 0.1);
                        this.groot.coords.arms.right.y4 = lerp(this.groot.coords.arms.right.y4, 45, 0.1);
                        this.groot.coords.arms.right.x2 = lerp(this.groot.coords.arms.right.x2, this.groot.coords.body.offset, 0.1);
                        this.groot.coords.arms.right.x3 = lerp(this.groot.coords.arms.right.x3, this.groot.coords.body.offset, 0.1);

                        this.resetMouth();

                        break;
                    case "eat":
                        this.groot.vel = 4;

                        this.groot.coords.face.offset = lerp(this.groot.coords.face.offset, cos(radians(this.timer * this.groot.vel)) * 1, 0.1);
                        this.groot.coords.face.angle = lerp(this.groot.coords.face.angle, sin(radians(this.timer * this.groot.vel)) * 1, 0.1);

                        this.groot.coords.body.offset = lerp(this.groot.coords.body.offset, 0, 0.1);

                        this.resetArmsX();
                        this.resetArmsY();

                        this.resetMouth();

                        //move mouth
                        if(this.spoon.x > 277 && this.spoon.x < 322 && this.spoon.y > 310 && this.spoon.y < 320) {
                            this.groot.coords.mouth.x1 = abs(sin(radians(this.talkTimer * this.groot.vel * 1.4)) * 7);
                            this.groot.coords.mouth.x4 = -abs(sin(radians(this.talkTimer * this.groot.vel * 1.4)) * 7);

                            this.groot.coords.mouth.y5 = -abs(sin(radians(this.talkTimer * this.groot.vel * 1.4)) * 12);
                            this.groot.coords.mouth.y6 = -abs(sin(radians(this.talkTimer * this.groot.vel * 1.4)) * 12);

                            this.groot.coords.mouth.y2 = abs(sin(radians(this.talkTimer * this.groot.vel * 1.4)) * 12);
                            this.groot.coords.mouth.y3 = abs(sin(radians(this.talkTimer * this.groot.vel * 1.4)) * 12);

                            //add crumbs to the array
                            if(random() < 0.02) {
                                this.crumbs.push({
                                    x: random(295, 305),
                                    y: random(300, 305),
                                    diameter: random(3, 6),
                                    color: this.spoon.colors.food, // color(random(160, 230)),
                                    opacity: ~~random(200, 240),
                                    vx: random(-0.5, 0.5),
                                    vy: random(4, 6)
                                });
                            }
                        }

                        //show crumbs
                        noStroke();
                        for(var i = this.crumbs.length - 1; i >= 0; i--) {
                            var crumb = this.crumbs[i];
                            fill(crumb.color);
                            ellipse(crumb.x, crumb.y, crumb.diameter, crumb.diameter);
                        }

                        //draw spoon
                        if(this.spoon.active) {
                            noStroke();
                            fill(this.spoon.colors.dark);
                            rect(this.spoon.x - this.spoon.w * 2.2, this.spoon.y, this.spoon.w * 2.2, this.spoon.h * 0.25, 5, 0, 0, 5);
                            fill(this.spoon.colors.medium);
                            rect(this.spoon.x - this.spoon.w * 2.2, this.spoon.y, this.spoon.w * 2.2, this.spoon.h * 0.15, 5, 0, 0, 0);
                            fill(this.spoon.colors.dark);
                            arc(this.spoon.x, this.spoon.y, this.spoon.w, this.spoon.h, 0, radians(180));
                            fill(this.spoon.colors.medium);
                            arc(this.spoon.x, this.spoon.y, this.spoon.w, this.spoon.h * 0.85, 0, radians(180));
                            fill(this.spoon.colors.light);
                            ellipse(this.spoon.x, this.spoon.y, this.spoon.w * 1.0, this.spoon.h * 0.4);
                            fill(this.spoon.colors.dark);
                            ellipse(this.spoon.x, this.spoon.y, this.spoon.w * 0.8, this.spoon.h * 0.30);

                            //draw food inside spoon
                            fill(this.spoon.colors.food);
                            ellipse(this.spoon.x, this.spoon.y - this.spoon.h * -0.00, this.spoon.w * 0.7, this.spoon.h * 0.30);
                            ellipse(this.spoon.x, this.spoon.y - this.spoon.h * 0.05, this.spoon.w * 0.6, this.spoon.h * 0.35);
                        }

                        break;
                    case "drink":
                        this.groot.vel = 4;

                        this.cup.x = constrain(ceil(lerp(this.cup.x, 300, 0.05)), -this.cup.w, 300);

                        //mouth
                        if(this.cup.x === 300) {
                            this.groot.coords.face.angle = lerp(this.groot.coords.face.angle, sin(radians(this.timer * this.groot.vel)) * 0.5, 0.1);
                            this.groot.coords.face.offset = lerp(this.groot.coords.face.offset,0, 0.1);
                            this.groot.coords.body.offset = lerp(this.groot.coords.body.offset, 0, 0.1);

                            this.resetMouth();

                            if(this.timer % 60 < 45) {
                                this.groot.coords.mouth.y2 = lerp(this.groot.coords.mouth.y2, 10, 0.1);
                                this.groot.coords.mouth.y3 = lerp(this.groot.coords.mouth.y3, 10, 0.1);
                                this.groot.coords.mouth.y5 = lerp(this.groot.coords.mouth.y5, -25, 0.1);
                                this.groot.coords.mouth.y6 = lerp(this.groot.coords.mouth.y6, -25, 0.1);

                                this.groot.coords.mouth.x1 = lerp(this.groot.coords.mouth.x1, 16, 0.1);
                                this.groot.coords.mouth.x4 = lerp(this.groot.coords.mouth.x4, -16, 0.1);
                            }
                            else {
                                this.groot.coords.mouth.y2 = lerp(this.groot.coords.mouth.y2, 5, 0.1);
                                this.groot.coords.mouth.y3 = lerp(this.groot.coords.mouth.y3, 5, 0.1);
                                this.groot.coords.mouth.y5 = lerp(this.groot.coords.mouth.y5, -20, 0.1);
                                this.groot.coords.mouth.y6 = lerp(this.groot.coords.mouth.y6, -20, 0.1);

                                this.groot.coords.mouth.x1 = lerp(this.groot.coords.mouth.x1, 8, 0.1);
                                this.groot.coords.mouth.x4 = lerp(this.groot.coords.mouth.x4, -8, 0.1);
                            }

                            //right arm
                            this.groot.coords.arms.right.x4 = lerp(this.groot.coords.arms.right.x4, 40, 0.1);
                            this.groot.coords.arms.right.y2 = lerp(this.groot.coords.arms.right.y2, 5, 0.1);
                            this.groot.coords.arms.right.y3 = lerp(this.groot.coords.arms.right.y3, 15, 0.1);
                            this.groot.coords.arms.right.y4 = lerp(this.groot.coords.arms.right.y4, 45, 0.1);

                            this.groot.coords.arms.right.x2 = lerp(this.groot.coords.arms.right.x2, this.groot.coords.body.offset, 0.1);
                            this.groot.coords.arms.right.x3 = lerp(this.groot.coords.arms.right.x3, this.groot.coords.body.offset, 0.1);

                            //left arm
                            this.groot.coords.arms.left.x4 = lerp(this.groot.coords.arms.left.x4, -24, 0.1);
                            this.groot.coords.arms.left.y2 = lerp(this.groot.coords.arms.left.y2, 16, 0.1);
                            this.groot.coords.arms.left.y3 = lerp(this.groot.coords.arms.left.y3, 4, 0.1);
                            this.groot.coords.arms.left.y4 = lerp(this.groot.coords.arms.left.y4, -28, 0.1);

                            this.groot.coords.arms.left.x2 = lerp(this.groot.coords.arms.left.x2, this.groot.coords.body.offset, 0.1);
                            this.groot.coords.arms.left.x3 = lerp(this.groot.coords.arms.left.x3, this.groot.coords.body.offset, 0.1);
                        }
                        else {
                            this.groot.coords.face.offset = lerp(this.groot.coords.face.offset,0, 0.1);
                            this.groot.coords.face.angle = lerp(this.groot.coords.face.angle, 0, 0.1);
                            this.groot.coords.body.offset = lerp(this.groot.coords.body.offset, 0, 0.1);

                            this.resetArmsX();
                            this.resetArmsY();
                            this.resetMouth();
                        }

                        //draw cup and slide it in
                        //cup body
                        stroke(this.groot.colors.outline);
                        strokeWeight(8);
                        fill(this.cup.color);
                        beginShape();
                            vertex(this.cup.x - this.cup.w * 0.5, this.cup.y);
                            vertex(this.cup.x + this.cup.w * 0.5, this.cup.y);
                            vertex(this.cup.x + this.cup.w * 0.4, this.cup.y + this.cup.h);
                            bezierVertex(
                                this.cup.x + this.cup.w * 0.1, this.cup.y + this.cup.h * 1.03,
                                this.cup.x - this.cup.w * 0.1, this.cup.y + this.cup.h * 1.03,
                                this.cup.x - this.cup.w * 0.4, this.cup.y + this.cup.h);
                        endShape(CLOSE);
                        //white line on cup
                        stroke(240, 40);
                        strokeWeight(20);
                        noFill();
                        line(
                            this.cup.x + this.cup.w * 0.26, this.cup.y + this.cup.h * 0.15,
                            this.cup.x + this.cup.w * 0.20, this.cup.y + this.cup.h * 0.85);

                        //cup lid - lower
                        stroke(this.groot.colors.outline);
                        strokeWeight(4);
                        fill(230);
                        quad(
                            this.cup.x - this.cup.w * 0.6, this.cup.y - this.cup.h * 0.1,
                            this.cup.x + this.cup.w * 0.6, this.cup.y - this.cup.h * 0.1,
                            this.cup.x + this.cup.w * 0.6, this.cup.y,
                            this.cup.x - this.cup.w * 0.6, this.cup.y);
                        //cup lid - upper
                        quad(
                            this.cup.x - this.cup.w * 0.48, this.cup.y - this.cup.h * 0.2,
                            this.cup.x + this.cup.w * 0.48, this.cup.y - this.cup.h * 0.2,
                            this.cup.x + this.cup.w * 0.5, this.cup.y - this.cup.h * 0.1,
                            this.cup.x - this.cup.w * 0.5, this.cup.y - this.cup.h * 0.1);
                        //cup lid shading - lower
                        fill(40, 25);
                        noStroke();
                        beginShape();
                            vertex(this.cup.x + this.cup.w * 0.1, this.cup.y - this.cup.h * 0.1);
                            vertex(this.cup.x + this.cup.w * 0.6, this.cup.y - this.cup.h * 0.1);
                            vertex(this.cup.x + this.cup.w * 0.6, this.cup.y);
                            vertex(this.cup.x + this.cup.w * 0.16, this.cup.y);
                            bezierVertex(
                                this.cup.x + this.cup.w * 0.19, this.cup.y - this.cup.h * 0.03,
                                this.cup.x + this.cup.w * 0.19, this.cup.y - this.cup.h * 0.07,
                                this.cup.x + this.cup.w * 0.1, this.cup.y - this.cup.h * 0.1);
                        endShape();
                        //cup lid shading - upper
                        beginShape();
                            vertex(this.cup.x + this.cup.w * 0.05, this.cup.y - this.cup.h * 0.2);
                            vertex(this.cup.x + this.cup.w * 0.48, this.cup.y - this.cup.h * 0.2);
                            vertex(this.cup.x + this.cup.w * 0.5, this.cup.y - this.cup.h * 0.1);
                            vertex(this.cup.x + this.cup.w * 0.16, this.cup.y - this.cup.h * 0.1);
                            bezierVertex(
                                this.cup.x + this.cup.w * 0.19, this.cup.y - this.cup.h * 0.13,
                                this.cup.x + this.cup.w * 0.19, this.cup.y - this.cup.h * 0.17,
                                this.cup.x + this.cup.w * 0.05, this.cup.y - this.cup.h * 0.2);
                        endShape();
                        //shading cup
                        fill(80, 15);
                        beginShape();
                            vertex(this.cup.x + this.cup.w * 0.5, this.cup.y);
                            vertex(this.cup.x + this.cup.w * 0.4, this.cup.y + this.cup.h);
                            bezierVertex(
                                this.cup.x + this.cup.w * 0.1, this.cup.y + this.cup.h * 1.03,
                                this.cup.x - this.cup.w * 0.1, this.cup.y + this.cup.h * 1.03,
                                this.cup.x - this.cup.w * 0.4, this.cup.y + this.cup.h);
                        endShape(CLOSE);
                        //straw
                        fill(230);
                        stroke(this.groot.colors.outline);
                        strokeWeight(4);
                        beginShape();
                            vertex(this.cup.x + this.cup.w * 0.05, this.cup.y - this.cup.h * 0.2);
                            vertex(this.cup.x + this.cup.w * 0.25, this.cup.y - this.cup.h * 0.44);
                            vertex(this.cup.x + this.cup.w * -0.02, this.cup.y - this.cup.h * 0.43);
                            vertex(this.cup.x + this.cup.w * -0.02, this.cup.y - this.cup.h * 0.48);
                            vertex(this.cup.x + this.cup.w * 0.38, this.cup.y - this.cup.h * 0.50);
                            vertex(this.cup.x + this.cup.w * 0.14, this.cup.y - this.cup.h * 0.2);
                        endShape();

                        strokeWeight(1);

                        break;
                    case "talk":
                        this.groot.vel = 4;

                        this.groot.coords.face.offset = lerp(this.groot.coords.face.offset, cos(radians(this.talkTimer * this.groot.vel)) * 1, 0.1);
                        this.groot.coords.face.angle = lerp(this.groot.coords.face.angle, sin(radians(this.talkTimer * this.groot.vel)) * 1, 0.1);

                        this.groot.coords.body.offset = lerp(this.groot.coords.body.offset, 0, 0.1);

                        this.resetArmsX();
                        this.resetArmsY();

                        if(this.talkTimer % 360 < 120) {
                            this.resetMouth();
                        }
                        else {
                            this.groot.coords.mouth.x1 = abs(sin(radians(this.talkTimer * this.groot.vel * 0.9)) * 5);
                            this.groot.coords.mouth.x4 = -abs(sin(radians(this.talkTimer * this.groot.vel * 1.28)) * 5);

                            this.groot.coords.mouth.y5 = -abs(sin(radians(this.talkTimer * this.groot.vel * 2.2)) * 15);
                            this.groot.coords.mouth.y6 = -abs(cos(radians(this.talkTimer * this.groot.vel * 1.23)) * 15);

                            this.groot.coords.mouth.y2 = abs(sin(radians(this.talkTimer * this.groot.vel * 1)) * 5);
                            this.groot.coords.mouth.y3 = abs(cos(radians(this.talkTimer * this.groot.vel * 1)) * 5);

                            //show words
                            if(this.talkTimer % 360 === 140) {
                                // I
                                this.words[0].active = true;
                            }
                            else if(this.talkTimer % 360 === 210) {
                                //Am
                                this.words[1].active = true;
                            }
                            else if(this.talkTimer % 360 === 280) {
                                // Groot
                                this.words[2].active = true;
                            }
                        }

                        break;
                    case "juggle":
                        this.groot.vel = 4;

                        this.groot.coords.face.offset = lerp(this.groot.coords.face.offset, cos(radians(this.timer * this.groot.vel)) * 1, 0.1);
                        this.groot.coords.face.angle = lerp(this.groot.coords.face.angle, sin(radians(this.timer * this.groot.vel)) * 1, 0.1);

                        this.groot.coords.body.offset = lerp(this.groot.coords.body.offset, 0, 0.1);

                        this.resetArmsX();
                        this.resetArmsY();

                        this.resetMouth();

                        this.groot.coords.arms.left.y2 = lerp(this.groot.coords.arms.left.y2, this.groot.coords.body.offset, 0.2);
                        this.groot.coords.arms.left.y3 = lerp(this.groot.coords.arms.left.y3, this.groot.coords.body.offset, 0.2);
                        this.groot.coords.arms.right.y2 = lerp(this.groot.coords.arms.right.y2, this.groot.coords.body.offset, 0.2);
                        this.groot.coords.arms.right.y3 = lerp(this.groot.coords.arms.right.y3, this.groot.coords.body.offset, 0.2);

                        if(this.balls[0].active) {
                            this.groot.coords.body.offset = sin(radians(this.timer * this.groot.vel * 1.4)) * 12;
                        }

                        if(this.ball.left === true) {
                            this.groot.coords.arms.left.y4 = lerp(this.groot.coords.arms.left.y4, 40, 0.2);

                            if(this.ball.timer % 15 === 0) {
                                this.ball.left = false;
                            }
                        }

                        if(this.ball.right === true) {
                            this.groot.coords.arms.right.y4 = lerp(this.groot.coords.arms.right.y4, -40, 0.2);

                            if(this.ball.timer % 15 === 0) {
                                this.ball.right = false;
                            }
                        }

                        this.runBalls();

                        break;
                    case "hop":

                        break;
                }

                //eyes move left/right based on mouse position
                if(this.groot.action === "idle") {
                    this.groot.vel = 4;

                    this.resetMouth();

                    if(!this.over) {
                        this.groot.coords.face.offset = lerp(this.groot.coords.face.offset, 0, 0.1);
                        this.groot.coords.face.angle = lerp(this.groot.coords.face.angle, 0, 0.1);
                        this.groot.coords.body.offset = lerp(this.groot.coords.body.offset, 0, 0.1);

                        this.resetArmsX();
                        this.resetArmsY();
                    }
                    else {
                        this.groot.coords.face.offset = lerp(this.groot.coords.face.offset, map(mouseX, 0, 600, -10, 10), 0.1);
                        this.groot.coords.face.angle = lerp(this.groot.coords.face.angle, map(mouseX, 0, 600, 8, -8), 0.1);
                        this.groot.coords.body.offset = lerp(this.groot.coords.body.offset, map(mouseX, 0, 600, -10, 10), 0.1);
                        this.groot.coords.arms.left.y2 = lerp(this.groot.coords.arms.left.y2, this.groot.coords.body.offset, 0.1);
                        this.groot.coords.arms.left.y3 = lerp(this.groot.coords.arms.left.y3, this.groot.coords.body.offset, 0.1);
                        this.groot.coords.arms.right.y2 = lerp(this.groot.coords.arms.right.y2, this.groot.coords.body.offset, 0.1);
                        this.groot.coords.arms.right.y3 = lerp(this.groot.coords.arms.right.y3, this.groot.coords.body.offset, 0.1);
                        this.groot.coords.arms.left.y4 = lerp(this.groot.coords.arms.left.y4, 0, 0.1);
                        this.groot.coords.arms.right.y4 = lerp(this.groot.coords.arms.right.y4, 0, 0.1);

                        this.resetArmsX();
                    }
                }

                //reset eyes closed if finished sleeping
                if(this.groot.action !== "sleep") {
                    this.groot.eyeClose = 0;
                }
            },
            updateJuggleButtons: function(juggleObject) {
                for (var i in this.buttons.juggles) {
                    if(this.buttons.juggles[i].content.toLowerCase() === juggleObject) {
                        this.buttons.juggles[i].selected = true;
                    }
                    else {
                        this.buttons.juggles[i].selected = false;
                    }
                }
            },
            updateThemeButtons: function(themeName) {
                for (var i in this.buttons.themes) {
                    if(this.buttons.themes[i].content.toLowerCase() === themeName) {
                        this.buttons.themes[i].selected = true;
                    }
                    else {
                        this.buttons.themes[i].selected = false;
                    }
                }
            },
            updateCharacterButtons: function(character) {
                for (var i in this.buttons.characters) {
                    if(this.buttons.characters[i].content.toLowerCase() === character) {
                        this.buttons.characters[i].selected = true;
                    }
                    else {
                        this.buttons.characters[i].selected = false;
                    }
                }
            },
            updateActionButtons: function() {
                for(var i in this.buttons.actions) {
                    if(this.buttons.actions[i].content.toLowerCase() === this.groot.action) {
                        this.buttons.actions[i].selected = true;
                    }
                    else {
                        this.buttons.actions[i].selected = false;
                    }
                }
            },
            update: function() {
                this.timer++;
                this.talkTimer++;

                //blinking
                if(this.groot.blink.active === false) {
                    if(random() < 0.005) {
                        this.groot.blink.active = true;
                        this.groot.blink.timer = 0;
                    }
                }
                else if(this.groot.blink.timer > 15) {
                    this.groot.blink.active = false;
                }

                //move the spoon to the current mouse position
                scene.spoon.x = mouseX;
                scene.spoon.y = mouseY - 20;

                //set spoon as active if current action is eat and not over button or out of screen
                this.spoon.active = this.over && (!this.hover || this.buttons.actions.eat.hover) && this.groot.action === "eat";

                //handle moving and removing crumbs
                for(var i = this.crumbs.length - 1; i >= 0; i--) {
                    var crumb = this.crumbs[i];

                    crumb.x+= crumb.vx;
                    crumb.y+= crumb.vy;

                    if(crumb.y + crumb.diameter > height) {
                        this.crumbs.splice(i, 1);
                    }
                }

                //get current duration since idle
                this.idle.value = ~~((millis() - this.idle.time) / 1000);

                //if idle for appropriate time then go to sleep
                if(this.idle.value === this.idle.duration) {
                    if(!this.idle.active) {
                        //if last action was sleep then to go idle, otherwise go to last action
                        this.idle.action = this.groot.action === "sleep" ? "idle" : this.groot.action;
                        this.groot.action = "sleep";
                        this.action.active = true;
                        this.action.timer = 240;
                        this.updateActionButtons();
                        this.idle.active = true;
                    }
                }
            },
            draw: function() {
                background(scene.theme.back);

                noStroke();
                fill(scene.theme.ground);
                beginShape();
                    vertex(0, 510);
                    bezierVertex(200, 490, 400, 490, 600, 510);
                    vertex(600, 600);
                    vertex(0, 600);
                endShape(CLOSE);

                if(this.theme === this.themes.winter) {
                    if(frameCount % 20 === 0) {
                        var diameter = random(5, 20);
                        this.snows.push({
                            x: random(600),
                            y: random(-50, -20),
                            vy: random(2, 4),
                            diameter: diameter,
                            color: color(240 + diameter),
                            opacity: random(100, 150)
                        });
                    }

                    //snow on groot's head
                    for(var i = 0; i < this.groot.coords.snow.length; i++) {
                        this.groot.coords.snow[i].opacity = lerp(this.groot.coords.snow[i].opacity, 240, 0.1);
                    }
                }
                else { //fade snow out an remove if not winter
                    for(var i = this.snows.length - 1; i >= 0; i--) {
                        this.snows[i].opacity-= 2;
                        if(this.snows[i].opacity <= 0) {
                            this.snows.splice(i, 1);
                        }
                    }

                    //snow on groot's head
                    for(var i = 0; i < this.groot.coords.snow.length; i++) {
                        this.groot.coords.snow[i].opacity = lerp(this.groot.coords.snow[i].opacity, 0, 0.1);
                    }
                }

                //sun
                // noStroke();
                // fill(this.sun.colors.fill, this.sun.opacity);
                // stroke(this.sun.colors.stroke, this.sun.opacity);
                // strokeWeight(6);
                // ellipse(this.sun.x, this.sun.y, this.sun.diameter, this.sun.diameter);

                //snow
                noStroke();
                for(var i = this.snows.length - 1; i >= 0; i--) {
                    var snow = this.snows[i];

                    if(snow.diameter > 15) {
                        continue;
                    }

                    fill(snow.color, snow.opacity);
                    ellipse(snow.x, snow.y, snow.diameter, snow.diameter);
                    snow.y+= snow.vy;

                    if(snow.y- snow.diameter > 600) {
                        this.snows.splice(i, 1);
                    }
                }

                //handle differences between seasons

                //show leaves and hide snow
                if(this.theme === this.themes.summer) {
                    for(var i = 0; i < this.groot.coords.leaves.length; i++) {
                        this.groot.coords.leaves[i].scale = lerp(this.groot.coords.leaves[i].scale, this.groot.coords.leaves[i].scaleMax, 0.1);
                    }
                    for(var i = 0; i < this.groot.coords.flowers.length; i++) {
                        this.groot.coords.flowers[i].scale = lerp(this.groot.coords.flowers[i].scale, 0, 0.1);
                    }
                    for(var i = 0; i < this.groot.coords.sticks.length; i++) {
                        this.groot.coords.sticks[i].scale = lerp(this.groot.coords.sticks[i].scale, 0, 0.1);
                    }

                    // this.sun.x = lerp(this.sun.x, 0, 0.1);
                    // this.sun.y = lerp(this.sun.y, 0, 0.1);
                    this.sun.x = lerp(this.sun.x, -this.sun.diameter * 0.5, 0.1);
                    this.sun.y = lerp(this.sun.y, -this.sun.diameter * 0.5, 0.1);
                }
                //show leaves (autumn) and hide snow
                //also show falling autumn leaves similar to falling snow in winter
                else if(this.theme === this.themes.fall) {
                    for(var i = 0; i < this.groot.coords.leaves.length; i++) {
                        this.groot.coords.leaves[i].scale = lerp(this.groot.coords.leaves[i].scale, this.groot.coords.leaves[i].scaleMax, 0.1);
                    }
                    for(var i = 0; i < this.groot.coords.flowers.length; i++) {
                        this.groot.coords.flowers[i].scale = lerp(this.groot.coords.flowers[i].scale, 0, 0.1);
                    }
                    for(var i = 0; i < this.groot.coords.sticks.length; i++) {
                        this.groot.coords.sticks[i].scale = lerp(this.groot.coords.sticks[i].scale, 0, 0.1);
                    }
                    this.sun.x = lerp(this.sun.x, -this.sun.diameter * 0.5, 0.1);
                    this.sun.y = lerp(this.sun.y, -this.sun.diameter * 0.5, 0.1);
                }
                //hide leaves and show snow on groot and falling snow
                else if(this.theme === this.themes.winter) {
                    for(var i = 0; i < this.groot.coords.leaves.length; i++) {
                        this.groot.coords.leaves[i].scale = lerp(this.groot.coords.leaves[i].scale, 0, 0.1);
                    }
                    for(var i = 0; i < this.groot.coords.flowers.length; i++) {
                        this.groot.coords.flowers[i].scale = lerp(this.groot.coords.flowers[i].scale, 0, 0.5);
                    }
                    for(var i = 0; i < this.groot.coords.sticks.length; i++) {
                        this.groot.coords.sticks[i].scale = lerp(this.groot.coords.sticks[i].scale, this.groot.coords.sticks[i].scaleMax, 0.1);
                    }

                    this.sun.x = lerp(this.sun.x, -this.sun.diameter * 0.5, 0.1);
                    this.sun.y = lerp(this.sun.y, -this.sun.diameter * 0.5, 0.1);
                }
                //show smaller leaves and spring flowers
                else if(this.theme === this.themes.spring) {
                    for(var i = 0; i < this.groot.coords.leaves.length; i++) {
                        this.groot.coords.leaves[i].scale = lerp(this.groot.coords.leaves[i].scale, this.groot.coords.leaves[i].scaleMax * 0.7, 0.1);
                    }
                    for(var i = 0; i < this.groot.coords.flowers.length; i++) {
                        this.groot.coords.flowers[i].scale = lerp(this.groot.coords.flowers[i].scale, this.groot.coords.flowers[i].scaleMax, 0.1);
                    }
                    for(var i = 0; i < this.groot.coords.sticks.length; i++) {
                        this.groot.coords.sticks[i].scale = lerp(this.groot.coords.sticks[i].scale, 0, 0.1);
                    }

                    this.sun.x = lerp(this.sun.x, -this.sun.diameter * 0.5, 0.1);
                    this.sun.y = lerp(this.sun.y, -this.sun.diameter * 0.5, 0.1);
                }

                //action buttons
                for(var i in this.buttons.actions) {
                    this.buttons.actions[i].draw();
                }
                //juggle buttons
                if(this.buttons.actions.juggle.selected) {
                    //show triangle point to buttons
                    noStroke();
                    fill(40, 50);
                    triangle(
                        550, 350,
                        565, 370,
                        580, 350
                    );
                    for(var i in this.buttons.juggles) {
                        this.buttons.juggles[i].draw();
                    }
                }
                //theme buttons
                for(var i in this.buttons.themes) {
                    this.buttons.themes[i].draw();
                }
                //character buttons
                for(var i in this.buttons.characters) {
                    this.buttons.characters[i].draw();
                }
            },
            go: function(fr) {
                this.draw();
                this.update();
                this.runZs();
                pushMatrix();
                    this.shakeScreen();
                    this.groot.go();
                    this.runAction();
                popMatrix();

                //display snow falling in front of groot
                noStroke();
                for(var i = this.snows.length - 1; i >= 0; i--) {
                    var snow = this.snows[i];

                    if(snow.diameter <= 15) {
                        continue;
                    }

                    fill(snow.color, snow.opacity);
                    ellipse(snow.x, snow.y, snow.diameter, snow.diameter);
                    snow.y+= snow.vy;

                    if(snow.y- snow.diameter > 600) {
                        this.snows.splice(i, 1);
                    }
                }

                //words
                for(var i = 0; i < this.words.length; i++) {
                    var word = this.words[i];

                    if(word.active) {
                        pushStyle();
                            textFont(createFont("ARIAL BLACK"));
                            textAlign(CENTER, CENTER);
                            textSize(30);
                            fill(220, word.opacity);
                            text(word.content, word.x, word.y);

                            word.opacity = constrain(word.opacity + (word.dir * 4), 0, 220);

                            if(word.opacity === 220) {
                                word.dir = -1;
                            }
                            else if(word.opacity === 0) {
                                word.opacity = 0;
                                word.active = false;
                                word.dir = 1;
                            }
                        popStyle();
                    }
                }

                //check if clicked on groot
                if(this.clicked && !this.hover && this.collisionColor(get(mouseX, mouseY))) {
                    this.shake = 10;

                    //add some other animation here
                    for(var i = 0; i < 10; i++) {
                        this.explosions.push({
                           x: mouseX,
                           y: mouseY,
                           size: random(5, 10),
                           color: this.selectedColor,
                           vx: random(-2, 2),
                           vy: random(-2, 2),
                           angle: 0,
                           rot: random(-5, 5),
                           opacity: 255,
                           opacitySpeed: random(3, 6)
                        });
                    }

                    if (window.parent && window.parent !== window) {
                        window.parent.postMessage({
                            type: 'groot_action_event',
                            action: 'groot_clicked',
                            x: mouseX,
                            y: mouseY
                        }, '*');
                    }
                }

                this.runExplosions();

                if(!this.started) {
                    pushStyle();
                        textAlign(CENTER, CENTER);
                        textSize(22);
                        fill(20, 150);
                        text("Check the comments for some\ntips like clicking directly on Groot.", 300, 40);
                    popStyle();
                }

                cursor(this.hover ? 'pointer' : 'default');    
                this.hover = false;
                this.clicked = false;
                 this.spoon.hover = false;
             }
         };
         return Scene;
     })();

     Scene.prototype.applyAction = function(action, x, y) {
         // ─── Actions ───
         if (action === "idle") {
             this.groot.action = "idle";
             this.action.active = false;
             this.action.timer = 0;
             this.updateActionButtons();
         } else if (action === "dance") {
             this.groot.action = "dance";
             this.action.active = true;
             this.action.timer = 240;
             this.updateActionButtons();
         } else if (action === "sleep") {
             this.groot.action = "sleep";
             this.action.active = true;
             this.action.timer = 240;
             this.updateActionButtons();
         } else if (action === "wave") {
             this.groot.action = "wave";
             this.action.active = true;
             this.action.timer = 240;
             this.updateActionButtons();
         } else if (action === "eat") {
             this.groot.action = "eat";
             this.action.active = true;
             this.action.timer = 240;
             if (x !== undefined && y !== undefined) {
                 this.spoon.x = x;
                 this.spoon.y = y - 20;
             }
             this.spoon.colors.food = color(random(150, 200), random(150, 200), random(150, 200));
             this.updateActionButtons();
         } else if (action === "drink") {
             this.groot.action = "drink";
             this.cup.x = -this.cup.w;
             this.cup.color = this.cup.colors[~~random(this.cup.colors.length)];
             this.action.active = true;
             this.action.timer = 240;
             this.updateActionButtons();
         } else if (action === "talk") {
             this.groot.action = "talk";
             this.action.active = true;
             this.action.timer = 240;
             this.talkTimer = 50;
             this.updateActionButtons();
         } else if (action === "juggle") {
             if (this.groot.action !== "juggle") {
                 this.setBalls();
             }
             this.groot.action = "juggle";
             this.action.active = true;
             this.action.timer = 240;
             this.updateActionButtons();
         // ─── Juggle types ───
         } else if (action === "balls") {
             this.ball.type = 0;
             this.updateJuggleButtons("balls");
         } else if (action === "knives") {
             this.ball.type = 1;
             this.updateJuggleButtons("knives");
         } else if (action === "stars") {
             this.ball.type = 2;
             this.updateJuggleButtons("stars");
         } else if (action === "cards") {
             this.ball.type = 3;
             this.updateJuggleButtons("cards");
         } else if (action === "penguins") {
             this.ball.type = 4;
             this.updateJuggleButtons("penguins");
         // ─── Themes ───
         } else if (action === "summer") {
             this.theme = this.themes.summer;
             this.groot.theme = this.groot.themes.summer;
             this.updateThemeButtons("summer");
         } else if (action === "fall") {
             this.theme = this.themes.fall;
             this.groot.theme = this.groot.themes.fall;
             this.updateThemeButtons("fall");
         } else if (action === "winter") {
             this.theme = this.themes.winter;
             this.groot.theme = this.groot.themes.winter;
             this.updateThemeButtons("winter");
         } else if (action === "spring") {
             this.theme = this.themes.spring;
             this.groot.theme = this.groot.themes.spring;
             this.updateThemeButtons("spring");
         // ─── Characters ───
         } else if (action === "none") {
             this.groot.character = "none";
             this.updateCharacterButtons("none");
         } else if (action === "pirate") {
             this.groot.character = "pirate";
             this.updateCharacterButtons("pirate");
         } else if (action === "ninja") {
             this.groot.character = "ninja";
             this.updateCharacterButtons("ninja");
         } else if (action === "potter") {
             this.groot.character = "potter";
             this.updateCharacterButtons("potter");
         } else if (action === "star") {
             this.groot.character = "star";
             this.updateCharacterButtons("star");
         } else if (action === "love") {
             this.groot.character = "love";
             this.updateCharacterButtons("love");
         } else if (action === "pixel") {
             this.groot.character = "pixel";
             this.updateCharacterButtons("pixel");
         // ─── Direct click on Groot body ───
         } else if (action === "groot_clicked") {
             this.shake = 10;
             for (var i = 0; i < 10; i++) {
                 this.explosions.push({
                    x: x || 300,
                    y: y || 300,
                    size: random(5, 10),
                    color: this.groot.selectedColor || color(151, 184, 126),
                    vx: random(-2, 2),
                    vy: random(-2, 2),
                    angle: 0,
                    rot: random(-5, 5),
                    opacity: 255,
                    opacitySpeed: random(3, 6)
                 });
             }
         }
     };

     scene = new Scene();
     window.grootScene = scene;

     draw = function() {
         scene.go();
     };
     
   }
}

var canvas = document.getElementById("canvas"); 
var processingInstance = new Processing(canvas, sketchProc);

window.addEventListener('message', function(e) {
    var data = e.data;
    if (!data) return;
    if (data.type === 'apply_groot_game_state') {
        if (window.grootScene) {
            window.grootScene.applyAction(data.action, data.x, data.y);
        }
    }
});