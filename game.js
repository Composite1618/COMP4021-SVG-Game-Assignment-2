// The point and size class used in this program
function Point(x, y) {
    this.x = (x)? parseFloat(x) : 0.0;
    this.y = (y)? parseFloat(y) : 0.0;
}

function Size(w, h) {
    this.w = (w)? parseFloat(w) : 0.0;
    this.h = (h)? parseFloat(h) : 0.0;
}

// Helper function for checking intersection between two rectangles
function intersect(pos1, size1, pos2, size2) {
    return (pos1.x < pos2.x + size2.w && pos1.x + size1.w > pos2.x &&
            pos1.y < pos2.y + size2.h && pos1.y + size1.h > pos2.y);
}


// The player class used in this program
function Player() {
    this.node = document.getElementById("player");
    this.position = PLAYER_INIT_POS;
    this.motion = motionType.NONE;
    this.verticalSpeed = 0;
    this.orientation = motionType.RIGHT;
}

Player.prototype.isOnPlatform = function() {
    var platforms = document.getElementById("platforms");
    for (var i = 0; i < platforms.childNodes.length; i++) {
        var node = platforms.childNodes.item(i);
        if (node.nodeName != "rect") continue;

        var x = parseFloat(node.getAttribute("x"));
        var y = parseFloat(node.getAttribute("y"));
        var w = parseFloat(node.getAttribute("width"));
        var h = parseFloat(node.getAttribute("height"));

        if (((this.position.x + PLAYER_SIZE.w > x && this.position.x < x + w) ||
             ((this.position.x + PLAYER_SIZE.w) == x && this.motion == motionType.RIGHT) ||
             (this.position.x == (x + w) && this.motion == motionType.LEFT)) &&
            this.position.y + PLAYER_SIZE.h == y) return true;
    }
    if (this.position.y + PLAYER_SIZE.h == SCREEN_SIZE.h) return true;

    return false;
}

Player.prototype.collidePlatform = function(position) {
    var platforms = document.getElementById("platforms");
    for (var i = 0; i < platforms.childNodes.length; i++) {
        var node = platforms.childNodes.item(i);
        if (node.nodeName != "rect") continue;

        var x = parseFloat(node.getAttribute("x"));
        var y = parseFloat(node.getAttribute("y"));
        var w = parseFloat(node.getAttribute("width"));
        var h = parseFloat(node.getAttribute("height"));
        var pos = new Point(x, y);
        var size = new Size(w, h);

        if (intersect(position, PLAYER_SIZE, pos, size)) {
            position.x = this.position.x;
            if (intersect(position, PLAYER_SIZE, pos, size)) {
                if (this.position.y >= y + h)
                    position.y = y + h;
                else
                    position.y = y - PLAYER_SIZE.h;
                this.verticalSpeed = 0;
            }
        }
    }
}

Player.prototype.collideScreen = function(position) {
    if (position.x < 0) position.x = 0;
    if (position.x + PLAYER_SIZE.w > SCREEN_SIZE.w) position.x = SCREEN_SIZE.w - PLAYER_SIZE.w;
    if (position.y < 0) {
        position.y = 0;
        this.verticalSpeed = 0;
    }
    if (position.y + PLAYER_SIZE.h > SCREEN_SIZE.h) {
        position.y = SCREEN_SIZE.h - PLAYER_SIZE.h;
        this.verticalSpeed = 0;
    }
}


//
// Below are constants used in the game
//
var PLAYER_SIZE = new Size(40, 40);         // The size of the player
var SCREEN_SIZE = new Size(800, 600);       // The size of the game screen
var PLAYER_INIT_POS  = new Point(0, 420);   // The initial position of the player

var MOVE_DISPLACEMENT = 5;                  // The speed of the player in motion
var JUMP_SPEED = 15;                        // The speed of the player jumping
var VERTICAL_DISPLACEMENT = 1;              // The displacement of vertical speed

var GAME_INTERVAL = 30;                     // The time interval of running the game

var BULLET_SIZE = new Size(10, 10);         // The speed of a bullet
var BULLET_SPEED = 10.0;                    // The speed of a bullet = pixels it moves each game loop

var SHOOT_INTERVAL = 200.0;                 // The period when shooting is disabled
var canShoot = true;                        // A flag indicating whether the player can shoot a bullet

var MONSTER_SIZE = new Size(40, 40);        // The size of the monster
var GT_SIZE = new Size(20, 20); //The size of the good thing

var EXIT_SIZE = new Size(30, 30);

var score = 0;

var level = 0;
var monster_bullets=0;

var cheat = false;


var PORTAL_SIZE = new Size(40, 80);        // The size of the portal



//
// Variables in the game
//
var motionType = {NONE:0, LEFT:1, RIGHT:2}; // Motion enum

var player = null;                          // The player object
var gameInterval = null;                    // The interval

var VP = null;// The vertical platform object
var VP_up=true;//if vertical platforn is moving up


var DP1 = null;// The disappearing platform objects
var DP2 = null;

var time_remaining=5;
var timer=null;

var name = "Enter your name here";
var name_tag = null;

var inPortal = false; // If the player is in either portal or not



//Sounds
var BGM = new Audio("theme.wav");
BGM.loop = true;
var fireball = new Audio("fireball.wav");
var levelup = new Audio("levelup.wav");
var gameover_wav = new Audio("gameover.wav");
var monster_death = new Audio("coin.wav");
var cheat_wav = new Audio("cheat.wav");
var uncheat_wav = new Audio("uncheat.wav");

function start_game() {
    name = prompt("What is your name?", name);
    if(name == null || name == "") {
        name = "Anonymous";
    }

    // Setup the game
    level = 0;
    cheat = false;
    score = 0;
    timeRemaining = 0;

    load();

    
    document.getElementById("mainPage").style.setProperty("visibility", "hidden", null);
    

    start_time();

}

function restart() {

    // Remove objects
    cleanUpGroup("name_tag", false);
    cleanUpGroup("monsters", false);
    cleanUpGroup("bullets", false);
    cleanUpGroup("highscoretext", false);
    cleanUpGroup("GTs", false);
    cleanUpGroup("platforms", true);
    if(DP1 != null) {
        disappear(DP1);
        DP1 = null;
    }
    if(DP2 != null) {
        disappear(DP2);
        DP2 = null;
    }
    
    document.getElementById("highscoretable").style.setProperty("visibility", "hidden", null);
    start_game();
}

//
// The load function
//
function load() {

    
    cleanUpGroup("name_tag", false);
    cleanUpGroup("monsters", false);
    cleanUpGroup("bullets", false);

    document.getElementById("highscoretable").style.setProperty("visibility", "hidden", null);
    // Attach keyboard events
    document.documentElement.addEventListener("keydown", keydown, false);
    document.documentElement.addEventListener("keyup", keyup, false);

    //restart timer
    clearInterval(gameInterval);
    clearInterval(timer);
    time_remaining=100;

    // Create the player
    player = new Player();


    player.name = name;

    player.bullet = 8;
    inPortal = false;

    document.getElementById("score").firstChild.data = score;
    document.getElementById("bullets_number").firstChild.data = player.bullet;


    var portal1 = document.getElementById("portal1");
    var portal2 = document.getElementById("portal2");

    monsterBullet = 1;

    // Create the monsters
    createMonsters();

    //create the VP
    VP = document.getElementById("VP");
    VP.setAttribute("y", 340);
    VP_up = true;


    //create the DPs
    createDPs();

    //create the GTs
    createGTs();

    //create exit
    createExitPoint();
}

function start_time() {
    level++;
    document.getElementById("level").firstChild.data = level;

    document.getElementById("tag").firstChild.data = name;
    name_tag = document.createElementNS("http://www.w3.org/2000/svg", "use");
    name_tag.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", "#name");
    document.getElementById("name_tag").appendChild(name_tag);
    name_tag.setAttribute("x", player.position.x);
    name_tag.setAttribute("y", player.position.y - 5);
    //the timer
    timer = setInterval("elapse()", 1000);

    // Start the game interval
    gameInterval = setInterval("gamePlay()", GAME_INTERVAL);

    //play music
    BGM.play();
}


function gameOver() {
    BGM.pause();
    gameover_wav.load();
    gameover_wav.play();
    clearInterval(gameInterval);
    clearInterval(timer);
    
    table = getHighScoreTable();

    name = player.name;
    var record = new ScoreRecord(player.name, score);

    var pos = table.length;
    for (var i = 0; i < table.length; i++) {
        if (record.score > table[i].score) {
            pos = i;
            break;
        }
    }
    table.splice(pos, 0, record);

    setHighScoreTable(table);
    showHighScoreTable(table, pos);
}

// This function creates the exitdoor in the game
function createExitPoint() {
    var exit = document.createElementNS("http://www.w3.org/2000/svg", "use");
    exit.setAttribute("x", 20);
    exit.setAttribute("y", 15);
    exit.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", "#exit");
    document.getElementById("exit_point").appendChild(exit);
}

//
// This function creates the monsters in the game
//
function createMonsters() {
    var monsters = 0;
    var collision = false;//check collision with platform
    var platforms = document.getElementById("platforms");
    while(monsters < (6 + level*4)){
        var monster_x = Math.floor(Math.random() * 700)+100;//floor
        var monster_y = Math.floor(Math.random() * 600);
        collision = false;

        for (var j = 0; j < platforms.childNodes.length; j++) {
            var node = platforms.childNodes.item(j);
            if (node.nodeName != "rect")
                continue;

            var x = parseInt(node.getAttribute("x"));
            var y = parseInt(node.getAttribute("y"));
            var w = parseInt(node.getAttribute("width"));
            var h = parseInt(node.getAttribute("height"));
            var p = new Point(x, y);
            var size = new Size(w, h);
            if (intersect(new Point(monster_x,monster_y), MONSTER_SIZE, p, size)) {
                collision = true;
            }
        }

        if(monster_x + MONSTER_SIZE.w > SCREEN_SIZE.w)
            collision = true;//out of screen
        if(!collision) {
            var monster = document.createElementNS("http://www.w3.org/2000/svg", "use");
            monster.setAttribute("x", monster_x);
            monster.setAttribute("y", monster_y);
            var random_type = Math.floor(Math.random() * 100) % 2;
            if(random_type == 0){
                monster.setAttribute("m_direction", "left");
            }
            else{
                monster.setAttribute("m_direction", "right");
            }

            if(monsters == 0) {//create the shooter first
                monster.setAttribute("shooter", 0);
                monster.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", "#shooter");
            }
            else {
                monster.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", "#monster");
            }
            document.getElementById("monsters").appendChild(monster);
            monsters++;
        }
    }
}

// This function creates the good things in the game
function createGTs() {
    var i = 0;
    var platforms = document.getElementById("platforms");
    var collision = false;
    while(i < 8){
        var a = Math.floor(Math.random() * 760)+40; // size of game area with floor
        var b = Math.floor(Math.random() * 560)+40; // size of game area with floor
        var collision = false;
        for (var j = 0; j < platforms.childNodes.length; j++) {
            var node = platforms.childNodes.item(j);
            if (node.nodeName != "rect") continue;

            var x = parseInt(node.getAttribute("x"));
            var y = parseInt(node.getAttribute("y"));
            var w = parseInt(node.getAttribute("width"));
            var h = parseInt(node.getAttribute("height"));
            var p = new Point(x, y);
            var size = new Size(w, h);
            if (intersect(new Point(a,b), GT_SIZE, p, size)) {
                collision = true;
            }
        }
        if(!collision) { //no collision, assign xy to good thing
            var GT = document.createElementNS("http://www.w3.org/2000/svg", "use");
            GT.setAttribute("x", a);
            GT.setAttribute("y", b);
            GT.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", "#GT");
            document.getElementById("GTs").appendChild(GT);
            i++;
        }
    }
}


//
// This function shoots a bullet from the player
//
function shootBullet() {
    if (!cheat) {
        if(player.bullet <= 0) //no bullets!
            return;
        player.bullet--;
    }
    fireball.load();
    fireball.play();
    document.getElementById("bullets_number").firstChild.data = player.bullet;

    // Disable shooting for a short period of time
    canShoot = false;
    setTimeout("canShoot = true", SHOOT_INTERVAL);

    // Create the bullet using the use node
    var bullet = document.createElementNS("http://www.w3.org/2000/svg", "use");
    if(player.orientation == motionType.RIGHT) {
        bullet.setAttribute("x", player.position.x + PLAYER_SIZE.w / 2 - BULLET_SIZE.w / 2);
    }
    else {
        bullet.setAttribute("x", player.position.x - PLAYER_SIZE.w / 2 + BULLET_SIZE.w / 2);
    }
    bullet.setAttribute("y", player.position.y + PLAYER_SIZE.h / 2 - BULLET_SIZE.h / 2);
    bullet.setAttribute("direction", player.orientation);
    bullet.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", "#bullet");
    document.getElementById("bullets").appendChild(bullet);
}


//This function moves the vertical platform
function moveVP() {
    var y = parseInt(VP.getAttribute("y"));
    if(VP_up) {
        if(y > 100)
            VP.setAttribute("y", y - VERTICAL_DISPLACEMENT);
        else
            VP_up = false;
    }
    else {
        if(y < 340)
            VP.setAttribute("y", y + VERTICAL_DISPLACEMENT);
        else
            VP_up = true;
    }
}

function elapse() {
    time_remaining--;
    document.getElementById("time_remaining").firstChild.data = time_remaining + "s";
    if(time_remaining <= 0)
        gameOver();
}

function cleanUpGroup(id, textOnly) { //I asked for a student about this problem and got the code after I was having problems with cleaning up objects.
    var node, next;
    var group = document.getElementById(id);
    node = group.firstChild;
    while (node != null) {
        next = node.nextSibling;
        if (!textOnly || node.nodeType == 3)
            group.removeChild(node);
        node = next;
    }
}

// This function creates the disappearing platforms in the game
function createDPs() {
    DP1 = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    DP1.setAttribute("x", 420);
    DP1.setAttribute("y", 340);
    DP1.setAttribute("width", 80);
    DP1.setAttribute("height", 20);
    DP1.setAttribute("type", "disappearing");
    DP1.setAttribute("style", "fill:grey; fill-opacity:1");
    document.getElementById("platforms").appendChild(DP1);
    
    DP2 = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    DP2.setAttribute("x", 280);
    DP2.setAttribute("y", 440);
    DP2.setAttribute("width", 80);
    DP2.setAttribute("height", 20);
    DP2.setAttribute("type", "disappearing");
    DP2.setAttribute("style", "fill:grey; fill-opacity:1");
    document.getElementById("platforms").appendChild(DP2);
}


//
// This is the keydown handling function for the SVG document
//
function keydown(evt) {
    var keyCode = (evt.keyCode)? evt.keyCode : evt.getKeyCode();

    switch (keyCode) {
        case "A".charCodeAt(0):
            player.motion = motionType.LEFT;
            player.orientation = motionType.LEFT;
            break;

        case "D".charCodeAt(0):
            player.motion = motionType.RIGHT;
            player.orientation = motionType.RIGHT;
            break;
            
        case "W".charCodeAt(0):
            if (player.isOnPlatform()) {
                player.verticalSpeed = JUMP_SPEED;
            }
            break;

        case "H".charCodeAt(0):
            if (canShoot) shootBullet();
            break;

        case "C".charCodeAt(0):
            if (cheat == false) {
                cheat = true;
                cheat_wav.load();
                cheat_wav.play();
            }
            break;

        case "V".charCodeAt(0):
            if (cheat == true) {
                cheat = false;
                uncheat_wav.load();
                uncheat_wav.play();
            }
            break;
    }
}


//
// This is the keyup handling function for the SVG document
//
function keyup(evt) {
    // Get the key code
    var keyCode = (evt.keyCode)? evt.keyCode : evt.getKeyCode();

    switch (keyCode) {
        case "A".charCodeAt(0):
            if (player.motion == motionType.LEFT) player.motion = motionType.NONE;
            break;

        case "D".charCodeAt(0):
            if (player.motion == motionType.RIGHT) player.motion = motionType.NONE;
            break;
    }
}


//
// This function checks collision
//
function collisionDetection() {
    // Check whether the player collides with a monster
    var monsters = document.getElementById("monsters");
    if (!cheat)//no cheat
        for (var i = 0; i < monsters.childNodes.length; i++) {
            var monster = monsters.childNodes.item(i);
            var x = parseInt(monster.getAttribute("x"));
            var y = parseInt(monster.getAttribute("y"));

            if (intersect(new Point(x, y), MONSTER_SIZE, player.position, PLAYER_SIZE)) {
                gameOver();
                return;
        }
    }

    // Check whether a bullet hits a monster
    var bullets = document.getElementById("bullets");
    for (var i = 0; i < bullets.childNodes.length; i++) {
        var bullet = bullets.childNodes.item(i);
        var x = parseInt(bullet.getAttribute("x"));
        var y = parseInt(bullet.getAttribute("y"));

        for (var j = 0; j < monsters.childNodes.length; j++) {
            var monster = monsters.childNodes.item(j);
            var mx = parseInt(monster.getAttribute("x"));
            var my = parseInt(monster.getAttribute("y"));

            if (intersect(new Point(x, y), BULLET_SIZE, new Point(mx, my), MONSTER_SIZE)) {
                monster_death.load();
                monster_death.play();
                monsters.removeChild(monster);
                j--;
                bullets.removeChild(bullet);
                i--;

                //write some code to update the score
                score += 10;
                document.getElementById("score").firstChild.data = score;
                document.getElementById("bullets_number").firstChild.data = player.bullet;
                document.getElementById("level").firstChild.data = level;
            }
        }
    }

    // Check if the player gets a good thing
    var GTs = document.getElementById("GTs");
    for (var i = 0; i < GTs.childNodes.length; i++) {
        var GT = GTs.childNodes.item(i);
        var x = parseInt(GT.getAttribute("x"));
        var y = parseInt(GT.getAttribute("y"));

        if (intersect(new Point(x, y), GT_SIZE, player.position, PLAYER_SIZE)) {
            GTs.removeChild(GT);
            i--;
            score += 10;
            document.getElementById("score").firstChild.data = score;
        }
    }

    //Check if player is on a disappearing platform
    if(DP1 != null && (player.position.x + PLAYER_SIZE.w > 420 && player.position.x + PLAYER_SIZE.w < 500) && (player.position.y + PLAYER_SIZE.h == 340)) {
        disappear(DP1);
        DP1 = null;
    }
    if(DP2 != null && (player.position.x + PLAYER_SIZE.w > 280 && player.position.x + PLAYER_SIZE.w < 360) && (player.position.y + PLAYER_SIZE.h == 440)) {
        disappear(DP2);
        DP2 = null;
    }

    // Check if the player is in either portals
    if (!inPortal) {
        var xp1 = parseInt(portal1.getAttribute("x"));
        var yp1 = parseInt(portal1.getAttribute("y"));
        var xp2 = parseInt(portal2.getAttribute("x"));
        var yp2 = parseInt(portal2.getAttribute("y"));
        if (intersect(new Point(xp1, yp1), PORTAL_SIZE, player.position, PLAYER_SIZE)) {
            player.position.x = xp2;
            player.position.y = yp2;
            inPortal = true;
            setTimeout(function(){inPortal = false;}, 2000);
        }
        if (intersect(new Point(xp2, yp2), PORTAL_SIZE, player.position, PLAYER_SIZE) && !inPortal) {
            player.position.x = xp1;
            player.position.y = yp1;
            inPortal = true;
            setTimeout(function(){inPortal = false;}, 2000);
        }
    }

    var exit = document.getElementById("exit_point").childNodes.item(0);
    if (GTs.childNodes.length == 0) {
        var x = parseInt(exit.getAttribute("x"));
        var y = parseInt(exit.getAttribute("y"));
        if(intersect(new Point(x, y), EXIT_SIZE, player.position, PLAYER_SIZE)) {
            document.getElementById("score").firstChild.data = score;
            score = score + level * 100 + time_remaining;
            levelup.load();
            levelup.play();
            load();
            start_time();
            return;   
        }
    }
    

}


//
// This function updates the position of the bullets
//
function moveBullets() {
    // Go through all bullets
    var bullets = document.getElementById("bullets");
    for (var i = 0; i < bullets.childNodes.length; i++) {
        var node = bullets.childNodes.item(i);
        
        // Update the position of the bullet
        var x = parseInt(node.getAttribute("x"));
        if(node.getAttribute("direction") == motionType.RIGHT) {
            node.setAttribute("x", x + BULLET_SPEED);
        }
        else {
            node.setAttribute("x", x - BULLET_SPEED);
        }

        // If the bullet is not inside the screen delete it from the group
        if (x > SCREEN_SIZE.w) {
            bullets.removeChild(node);
            i--;
        }
    }
}

//
//This function moves the monsters
//
function moveMonsters() {
    var monsters = document.getElementById("monsters");
    for(var i = 0; i < monsters.childNodes.length; ++i){
        var monster = monsters.childNodes.item(i);
        
        var old_position = new Point(parseFloat(monster.getAttribute("x")), parseFloat(monster.getAttribute("y")));
        var new_position = new Point(parseFloat(monster.getAttribute("x")), parseFloat(monster.getAttribute("y")));

        if(horizontal(monster)){
            if(monster.getAttribute("m_direction") == "left"){
                new_position.x -= 1;
            }
            if(monster.getAttribute("m_direction") == "right"){
                new_position.x += 1;
            }
            monsterCollidePlatform(monster, new_position);
            if(new_position.x == old_position.x){
                if(monster.getAttribute("m_direction") == "left"){
                    monster.setAttribute("m_direction", "leftup");
                }
                if(monster.getAttribute("m_direction") == "right"){
                    monster.setAttribute("m_direction", "rightup");
                }
                
                new_position.y -= 1;
                monsterCollidePlatform(monster, new_position);
                if(new_position.y == old_position.y){
                    if(monster.getAttribute("m_direction") == "left"){
                        monster.node.setAttribute("transform", "translate(" + (MONSTER_SIZE.w + monster.position.x) + "," +monster.position.y+") scale(-1, 1)");
                        monster.setAttribute("m_direction", "right");
                     }
                    if(monster.getAttribute("m_direction") == "right"){
                        monster.node.setAttribute("transform", "translate(" + (MONSTER_SIZE.w + monster.position.x) + "," +monster.position.y+") scale(-1, 1)");
                        monster.setAttribute("m_direction", "left");
                    }
                }
                else monster.setAttribute("y", new_position.y);
            }
            else if(new_position.x < 0){
                monster.setAttribute("m_direction", "right");
            }
            else if(new_position.x + MONSTER_SIZE.w > SCREEN_SIZE.w){
                monster.setAttribute("m_direction", "left");
            }
            else monster.setAttribute("x", new_position.x);
        }
        else{
            if(monster.getAttribute("m_direction") == "leftup"){
                new_position.x -= 1;
                monsterCollidePlatform(monster, new_position);
                if(new_position.x == old_position.x){
                    new_position.y -= 1;
                    monsterCollidePlatform(monster, new_position);
                    if(new_position.y == old_position.y){
                        monster.setAttribute("m_direction", "right");
                    }
                    else monster.setAttribute("y", new_position.y);
                }
                else{
                    monster.setAttribute("x", new_position.x);
                    monster.setAttribute("m_direction", "left");
                }
            }
            else if(monster.getAttribute("m_direction") == "rightup"){
                new_position.x += 1;
                monsterCollidePlatform(monster, new_position);
                if(new_position.x == old_position.x){
                    new_position.y -= 1;
                    monsterCollidePlatform(monster, new_position);
                    if(new_position.y == old_position.y){
                        monster.setAttribute("m_direction", "left");
                    }
                    else monster.setAttribute("y", new_position.y);
                }
                else{
                    monster.setAttribute("x", new_position.x);
                    monster.setAttribute("m_direction", "right");
                }
            }
            else{
                new_position.y += 1;
                monster.setAttribute("y", new_position.y);
            }
        }
    }
}

//Check if monster is on platform, monster can only move horizontally
function horizontal(monster){
    var platforms = document.getElementById("platforms");
    for (var i = 0; i < platforms.childNodes.length; i++) {
        var node = platforms.childNodes.item(i);
        if (node.nodeName != "rect")
            continue;
        
        var x = parseInt(node.getAttribute("x"));
        var y = parseInt(node.getAttribute("y"));
        var w = parseInt(node.getAttribute("width"));
        var h = parseInt(node.getAttribute("height"));
        
        var position = new Point(parseInt(monster.getAttribute("x")), parseInt(monster.getAttribute("y")));
        var type = monster.getAttribute("m_direction");
        
        if (((position.x + MONSTER_SIZE.w > x && position.x < x + w) || ((position.x + MONSTER_SIZE.w) == x && type == "right") || (position.x == (x + w) && type == "left")) && position.y + MONSTER_SIZE.h == y)
            return true;
    }

    if (position.y + MONSTER_SIZE.h == SCREEN_SIZE.h){
        return true;//on the floor
    }

    return false;
}

//check monster platform collision
function monsterCollidePlatform(monster,new_position){
    var platforms = document.getElementById("platforms");
    for (var i = 0; i < platforms.childNodes.length; i++) {
        var node = platforms.childNodes.item(i);
        if (node.nodeName != "rect") continue;
        
        var x = parseFloat(node.getAttribute("x"));
        var y = parseFloat(node.getAttribute("y"));
        var w = parseFloat(node.getAttribute("width"));
        var h = parseFloat(node.getAttribute("height"));
        var pos = new Point(x, y);
        var size = new Size(w, h);
        
        var old_position = new Point(parseFloat(monster.getAttribute("x")), parseFloat(monster.getAttribute("y")));
        
        if (intersect(new_position, MONSTER_SIZE, pos, size)) {
            new_position.x = old_position.x;
            if (intersect(new_position, MONSTER_SIZE, pos, size)) {
                if (old_position.y >= y + h)
                    new_position.y = y + h;
                else
                    new_position.y = y - MONSTER_SIZE.h;
            }
        }
    }
}

function monsterCollideScreen (position, monster) {
    if (position.x < 0) position.x = 0;
    if (position.x + MONSTER_SIZE.w > SCREEN_SIZE.w) position.x = SCREEN_SIZE.w - MONSTER_SIZE.w;
    if (position.y < 0) {
        position.y = 0;
        monster.setAttribute("verticalSpeed", 0);
    }
    if (position.y + MONSTER_SIZE.h > SCREEN_SIZE.h) {
        position.y = SCREEN_SIZE.h - MONSTER_SIZE.h;
        monster.setAttribute("verticalSpeed", 0);
    }
}

function disappear(Platform) {
    /*var animate = document.createElementNS("http://www.w3.org/2000/svg", "animate");
    animate.setAttribute("attributeName", "opacity");
    animate.setAttribute("from", "1");
    animate.setAttribute("to", "0");
    animate.setAttribute("begin", "0s");
    animate.setAttribute("dur", "0.5s");
    animate.setAttribute("fill", "freeze");
    Platform.appendChild(animate);*/
    setTimeout(function(){Platform.style.fillOpacity -= 0.3;}, 100);
    setTimeout(function(){Platform.style.fillOpacity -= 0.4;}, 200);
    setTimeout(function(){Platform.style.fillOpacity -= 0.4;}, 300);
    setTimeout(function(){Platform.parentNode.removeChild(Platform);}, 300);
}


//
// This function updates the position and motion of the player in the system
//
function gamePlay() {
    // Check collisions
    collisionDetection();

    // Check whether the player is on a platform
    var isOnPlatform = player.isOnPlatform();
    
    // Update player position
    var displacement = new Point();

    // Move left or right
    if (player.motion == motionType.LEFT)
        displacement.x = -MOVE_DISPLACEMENT;
    if (player.motion == motionType.RIGHT)
        displacement.x = MOVE_DISPLACEMENT;

    // Fall
    if (!isOnPlatform && player.verticalSpeed <= 0) {
        displacement.y = -player.verticalSpeed;
        player.verticalSpeed -= VERTICAL_DISPLACEMENT;
    }

    // Jump
    if (player.verticalSpeed > 0) {
        displacement.y = -player.verticalSpeed;
        player.verticalSpeed -= VERTICAL_DISPLACEMENT;
        if (player.verticalSpeed <= 0)
            player.verticalSpeed = 0;
    }

    // Get the new position of the player
    var position = new Point();
    position.x = player.position.x + displacement.x;
    position.y = player.position.y + displacement.y;

    // Check collision with platforms and screen
    player.collidePlatform(position);
    player.collideScreen(position);

    // Set the location back to the player object (before update the screen)
    player.position = position;

    // Move everything
    moveBullets();
    moveMonsters();
    moveVP();

    updateScreen();
}


//
// This function updates the position of the player's SVG object and
// set the appropriate translation of the game screen relative to the
// the position of the player
//
function updateScreen() {
    if(player.orientation == motionType.LEFT){
        player.node.setAttribute("transform", "translate(" + (PLAYER_SIZE.w + player.position.x) + "," +player.position.y+") scale(-1, 1)");
    }
    else{
        var x = player.position.x;
        player.node.setAttribute("transform", "translate(" + player.position.x + "," + player.position.y + ")");
    }

    //player's name tag
    name_tag.setAttribute("x", player.position.x + 15);
    name_tag.setAttribute("y", player.position.y - 5);
}

