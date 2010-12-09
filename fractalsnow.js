/*
 * The snowflake() function below is the cool part of this hack.
 * It draws a fractal, but includes only a single line-drawing command.
 * A 4th order Koch snowflake consists of 768 connected line segments,
 * and this function draws them all with c.lineTo(0,len). The secret
 * is the way it manipulates the transformation matrix before drawing
 * each line.  Probably not the most efficient way to write the code
 * but a fun exercise in <canvas> transformations.
 *
 * The code to make the snowflakes fall is pretty standard CSS animation.
 * Not the cleanest code I've written, but I need to get back to finishing
 * the 6th edition of JavaScript: The Definitive Guide.
 * 
 * This ought to work in IE9 beta, since that browser supports <canvas>.
 * But it doesn't seem to.  I took the shortcut of using window.innerHeight
 * and window.pageYOffset, and I'm guess that is what is breaking it.
 * 
 * Copyright 2010 by David Flanagan
 * http://creativecommons.org/licenses/by-nc-sa/3.0/
 */
(function() {
    // If we don't have a working <canvas> element, apologize and quit
    if (!document.createElement("canvas").getContext) {
        alert("Your browser doesn't support <canvas>\n" +
              "No snow for you!\n" +
              "Please try a recent version of Firefox, Chrome or Safari");
        return;
    }

    // Draw a level-n Koch Snowflake fractal in the context c,
    // with lower-left corner at (x,y) and side length len.
    function snowflake(c, n, x, y, len) {
        c.save();           // Save current transformation
        c.translate(x,y);   // Translate to starting point
        c.moveTo(0,0);      // Begin a new subpath there
        leg(n);             // Draw the first leg of the fractal
        c.rotate(-120*deg); // Rotate 120 degrees anticlockwise
        leg(n);             // Draw the second leg
        c.rotate(-120*deg); // Rotate again.
        leg(n);             // Draw the final leg
        c.closePath();      // Close the subpath
        c.restore();        // Restore original transformation

        // Draw a single leg of a level-n Koch snowflake.
        // This function leaves the current point at the end of
        // the leg it has drawn and translates the coordinate
        // system so the current point is (0,0). This means you
        // can easily call rotate() after drawing a leg.
        function leg(n) {
            c.save();               // Save current transform
            if (n == 0) {           // Non-recursive case:
                c.lineTo(len, 0);   //   Just a horizontal line
            }
            else { // Recursive case:           _  _
                   //     draw 4 sub-legs like:  \/
                c.scale(1/3,1/3);   // Sub-legs are 1/3rd size
                leg(n-1);           // Draw the first sub-leg
                c.rotate(60*deg);   // Turn 60 degrees clockwise
                leg(n-1);           // Draw the second sub-leg
                c.rotate(-120*deg); // Rotate 120 degrees back
                leg(n-1);           // Third sub-leg
                c.rotate(60*deg);   // Back to original heading
                leg(n-1);           // Final sub-leg
            }
            c.restore();            // Restore the transform
            c.translate(len, 0);    // Translate to end of leg
        }
    }

    var deg = Math.PI/180;         // For converting degrees to radians
    var sqrt3_2 = Math.sqrt(3)/2;  // Height of an equilateral triangle
    var flakes = [];               // Things that are dropping
    var cover = new Image();
    cover.src = "http://covers.oreilly.com/images/0636920016045/cat.gif";
    var coverwidth = 180, coverheight = 296;
    var scrollspeed = 80;   // How often we animate things
    var snowspeed = 500;    // How often we add a new snowflake
    var rand = function(n) { return Math.floor(n*Math.random()); }

    // Add a new snowflake at the top of the viewport
    function createSnowflake() {
        var order = 2 + rand(3);    // 2nd, 3rd, or 4th order fractal
        var size = 10 + rand(90);   
        var x = rand(window.innerWidth - size);
        var y = window.pageYOffset;

        // Create a <canvas> element
        var canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size*sqrt3_2*4/3;
        canvas.style.position = "absolute";
        canvas.style.left = x + "px";
        canvas.style.top = y + "px";
        canvas.style.zIndex = 100 + rand(100);

        // Draw a translucent snowflake into the transparent canvas
        var c = canvas.getContext("2d");
        c.strokeStyle = "rgba(0,0,0,0.5)";
        c.fillStyle = "rgba(255,255,255,0.75)";
        snowflake(c,order,0,Math.floor(sqrt3_2*size),size);
        c.fill();
        c.stroke();

        // Add the canvas to the document and to our array of snowflakes
        document.body.appendChild(canvas);
        flakes.push({elt:canvas, x: x, y:y, vy:3+rand(3)});

        // Once in a while, add something different to the mix
        if (rand(100) == 1) {
            // drop the cover image
            var img = document.createElement("img");
            img.src = cover.src;
            var scale = Math.random()/2 + .25;
            img.width = Math.round(coverwidth * scale);
            img.height = Math.round(coverheight*scale);
            img.style.position = "absolute";
            var x = rand(window.innerWidth - img.width - 150);
            var y = window.pageYOffset;
            img.style.top = y + "px";
            img.style.left = x + "px";
            img.style.zIndex = 200;
            document.body.appendChild(img);
            flakes.push({elt:img, x:x, y:y, vy:4});

            // and drop a message, too
            var div = document.createElement("div");
            div.style.width = "120px";
            div.style.height = "40px";
            div.style.position = "absolute";
            x = x + img.width + 20;
            y = y + 30;
            div.style.top =  y + "px";
            div.style.left = x + "px";
            div.style.zIndex = 200;
            document.body.appendChild(div);

            div.innerHTML = "<a style='color:#fff' href='http://oreilly.com/catalog/0636920016045/'>Save 40% with code AUTHD</a>";
            div.style.border = "solid red 2px";
            div.style.backgroundColor = "#c00";
            div.style.border = "solid black 1px";
            div.style.font = "bold 10pt sans-serif";
            div.style.color = "#fff";
            div.style.textAlign = "center";
            div.style.padding = "3px";

            flakes.push({elt:div, x:x, y:y, vy:4});
        }
    }

    // This function animates the flakes falling down the screen
    function moveSnowflakes() {
        var maxy = window.pageYOffset + window.innerHeight;
        var i = 0;
        while(i < flakes.length) {  // Loop through the array of flakes
            var flake = flakes[i];
            flake.y += flake.vy;
            if (flake.y > maxy) {
                // The flake has scrolled off, so get rid of it
                document.body.removeChild(flake.elt);
                flakes.splice(i, 1);
                continue;
            }

            flake.elt.style.top = flake.y + "px";    // Move the flake down

            // Move the flake side to side 
            if (flake.vx == undefined) flake.vx = 0;
            flake.x += flake.vx;
            flake.elt.style.left = flake.x + "px";

            // Sometimes change the sideways velocity
            if (rand(4) == 1) flake.vx += (rand(11) - 5)/10;
            if (flake.vx > 2) flake.vx = 2;
            if (flake.vx < -2) flake.vx = -2;

            i++;
        }
    }

    function snow() {
        // Start creating snowflakes and moving them down the screen
        var scrolltimer = setInterval(moveSnowflakes, scrollspeed);
        var snowtimer = setInterval(createSnowflake, snowspeed);

        // 
        var controls = document.createElement("div");
        controls.style.position = "fixed";
        controls.style.left = "2%";
        controls.style.top = "5px";
        controls.style.width = "96%";
        controls.style.padding = "5px";
        controls.style.zIndex = 1000;
        controls.style.backgroundColor = "#c00";
        controls.style.border = "solid black 1px";
        controls.style.borderRadius = "4px";
        controls.style.font = "bold 10pt sans-serif";
        controls.style.color = "#fff";

        document.body.appendChild(controls);

        controls.innerHTML =
            "Koch snowflake fractals from " + 
            "<i><a style='font:inherit; color:#fff' " +
            "href='http://oreilly.com/catalog/0636920016045/'>" +
            "Canvas Pocket Reference</a></i>.   " +
            "<a style='font:inherit; color:#fff' " +
            "href='http://www.davidflanagan.com/2010/12/let-it-snow.html'>" +
            "Learn how it works</a>.   Happy Holidays! ";
        var stopbutton = document.createElement("button");
        stopbutton.innerHTML = "Stop";
        controls.appendChild(stopbutton);

        stopbutton.onclick = function() {
            clearInterval(scrolltimer);
            clearInterval(snowtimer);
            for(var i = 0; i < flakes.length; i++)
                document.body.removeChild(flakes[i].elt);
            document.body.removeChild(controls);
        };
    }
    
    if (document.readyState === "complete") snow();
    else window.addEventListener("load", snow, false);
}());
