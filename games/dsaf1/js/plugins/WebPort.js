//=============================================================================
// WebPort.js — browser fixes for this web build (see dsaf2-port/webport.js)
//=============================================================================

// localStorage throws in sandboxed iframes and some private modes; the
// engine would crash on the first save. Keep saves in memory there instead.
(function() {
    try {
        var ls = window.localStorage;
        ls.setItem('__webport', '1');
        ls.removeItem('__webport');
        return;
    } catch (e) {}
    var data = {};
    var mem = {
        getItem: function(k) { k = String(k); return data.hasOwnProperty(k) ? data[k] : null; },
        setItem: function(k, v) { data[String(k)] = String(v); },
        removeItem: function(k) { delete data[String(k)]; },
        clear: function() { data = {}; },
        key: function(i) { return Object.keys(data)[i] || null; },
        get length() { return Object.keys(data).length; }
    };
    try {
        Object.defineProperty(window, 'localStorage', {value: mem, configurable: true});
        console.warn('[webport] localStorage unavailable; saves last until the page closes');
    } catch (e) {}
})();

// Folder build only: an image the game asks for but doesn't ship (the
// original lacks a few) loads blank instead of stopping the game with
// "Failed to load". build.py fills in the list of shipped images.
(function() {
    'use strict';
    var files = {"img/animations/breath.png":1,"img/animations/clawspecial1.png":1,"img/animations/clawspecial2.png":1,"img/animations/explosion1.png":1,"img/animations/flash.png":1,"img/animations/hit1.png":1,"img/animations/recovery3.png":1,"img/animations/slash.png":1,"img/animations/statesleep.png":1,"img/animations/stick.png":1,"img/animations/thunder2.png":1,"img/animations/warning.png":1,"img/animations/wind4.png":1,"img/battlebacks1/pg.png":1,"img/characters/!$car.png":1,"img/characters/!$purps.png":1,"img/characters/!$purps2.png":1,"img/characters/!$purps3.png":1,"img/characters/!$urinal.png":1,"img/characters/$fredbear.png":1,"img/characters/$gf.png":1,"img/characters/$gf2.png":1,"img/characters/$bonnie.png":1,"img/characters/$chica.png":1,"img/characters/$child.png":1,"img/characters/$coolcat2.png":1,"img/characters/$coolcat3.png":1,"img/characters/$farfour.png":1,"img/characters/$foxy.png":1,"img/characters/$foxy2.png":1,"img/characters/$freddy.png":1,"img/characters/$fredpossessed.png":1,"img/characters/$ghosts2.png":1,"img/characters/$kiddie.png":1,"img/characters/$officer.png":1,"img/characters/$pc.png":1,"img/characters/$pg.png":1,"img/characters/$pg3.png":1,"img/characters/$puppet.png":1,"img/characters/$puppet2.png":1,"img/characters/$puppet3.png":1,"img/characters/$suits.png":1,"img/characters/$yyy1.png":1,"img/characters/$yyy2.png":1,"img/characters/$yyy3.png":1,"img/enemies/foxy1.png":1,"img/enemies/freddy1.png":1,"img/enemies/freddy2.png":1,"img/enemies/oldman.png":1,"img/invader/bomb.png":1,"img/invader/boss0.png":1,"img/invader/boss0_turret.png":1,"img/invader/boss0_turretb.png":1,"img/invader/boss0b.png":1,"img/invader/boss0c.png":1,"img/invader/boss0d.png":1,"img/invader/boss0e.png":1,"img/invader/bullet0.png":1,"img/invader/bullet1.png":1,"img/invader/bullet2.png":1,"img/invader/bullet3.png":1,"img/invader/bullet4.png":1,"img/invader/chicat.png":1,"img/invader/doggo1.png":1,"img/invader/doggo2.png":1,"img/invader/doggo3.png":1,"img/invader/doggobg1.png":1,"img/invader/doggobg2.png":1,"img/invader/doggobg3.png":1,"img/invader/enemy0.png":1,"img/invader/enemy1.png":1,"img/invader/enemy2.png":1,"img/invader/enemy3.png":1,"img/invader/enemy3b.png":1,"img/invader/enemy3c.png":1,"img/invader/enemy4.png":1,"img/invader/enemy5.png":1,"img/invader/heading0.png":1,"img/invader/heading1.png":1,"img/invader/heading10.png":1,"img/invader/heading11.png":1,"img/invader/heading12.png":1,"img/invader/heading13.png":1,"img/invader/heading14.png":1,"img/invader/heading15.png":1,"img/invader/heading16.png":1,"img/invader/heading17.png":1,"img/invader/heading18.png":1,"img/invader/heading2.png":1,"img/invader/heading3.png":1,"img/invader/heading4.png":1,"img/invader/heading5.png":1,"img/invader/heading6.png":1,"img/invader/heading7.png":1,"img/invader/heading8.png":1,"img/invader/heading9.png":1,"img/invader/headinglose.png":1,"img/invader/headingwin.png":1,"img/invader/invaderhudhull1.png":1,"img/invader/invaderhudhull2.png":1,"img/invader/invaderhudshield1.png":1,"img/invader/invaderhudshield2.png":1,"img/invader/layer_clouds1.png":1,"img/invader/layer_clouds1b.png":1,"img/invader/layer_clouds2.png":1,"img/invader/layer_ground1.png":1,"img/invader/layer_ground1b.png":1,"img/invader/layer_ground2.png":1,"img/invader/layer_space1.png":1,"img/invader/layer_space1b.png":1,"img/invader/layer_space2.png":1,"img/invader/ll1.png":1,"img/invader/ll2.png":1,"img/invader/ll3.png":1,"img/invader/ll4.png":1,"img/invader/module0.png":1,"img/invader/module1.png":1,"img/invader/module2.png":1,"img/invader/module3.png":1,"img/invader/module4.png":1,"img/invader/pchica.png":1,"img/invader/pfox.png":1,"img/invader/pfred.png":1,"img/invader/plasmablast.png":1,"img/invader/plasmablast2.png":1,"img/invader/plasmablastb.png":1,"img/invader/plasmablastc.png":1,"img/invader/plasmablastd.png":1,"img/invader/pltrp.png":1,"img/invader/pup0.png":1,"img/invader/pup1.png":1,"img/invader/pup2.png":1,"img/invader/ship0.png":1,"img/invader/shiptest.png":1,"img/invader/spbg.png":1,"img/parallaxes/g1.png":1,"img/pictures/00.png":1,"img/pictures/1.png":1,"img/pictures/11.png":1,"img/pictures/12.png":1,"img/pictures/15.png":1,"img/pictures/2.png":1,"img/pictures/23.png":1,"img/pictures/24.png":1,"img/pictures/25.png":1,"img/pictures/26.png":1,"img/pictures/27.png":1,"img/pictures/28.png":1,"img/pictures/29.png":1,"img/pictures/3.png":1,"img/pictures/30.png":1,"img/pictures/4.png":1,"img/pictures/45.png":1,"img/pictures/5.png":1,"img/pictures/6.png":1,"img/pictures/6am.png":1,"img/pictures/85.png":1,"img/pictures/8bit2.png":1,"img/pictures/bonnbody.png":1,"img/pictures/bonnhead.png":1,"img/pictures/bonnheada.png":1,"img/pictures/bonnie1.png":1,"img/pictures/bonnie1a.png":1,"img/pictures/bonnie2.png":1,"img/pictures/bonnie2a.png":1,"img/pictures/bono.png":1,"img/pictures/camera1.png":1,"img/pictures/camera2.png":1,"img/pictures/camera3.png":1,"img/pictures/camera4.png":1,"img/pictures/camera5.png":1,"img/pictures/camera6.png":1,"img/pictures/camera_1.png":1,"img/pictures/camera_10.png":1,"img/pictures/camera_2.png":1,"img/pictures/camera_3.png":1,"img/pictures/camera_5.png":1,"img/pictures/camera_6.png":1,"img/pictures/camera_7.png":1,"img/pictures/camera_8.png":1,"img/pictures/camera_9.png":1,"img/pictures/chica1.png":1,"img/pictures/chica2.png":1,"img/pictures/chicabod.png":1,"img/pictures/chicahead.png":1,"img/pictures/coolcat.png":1,"img/pictures/diningarea.png":1,"img/pictures/drawing3.png":1,"img/pictures/drawing4.png":1,"img/pictures/drawing5.png":1,"img/pictures/drawing6.png":1,"img/pictures/drawing7.png":1,"img/pictures/drawing7a.png":1,"img/pictures/drawing8.png":1,"img/pictures/drawing8a.png":1,"img/pictures/drawing8b.png":1,"img/pictures/drawing8c.png":1,"img/pictures/drawing9.png":1,"img/pictures/drawing9a.png":1,"img/pictures/foxy1.png":1,"img/pictures/foxy2.png":1,"img/pictures/foxyhead.png":1,"img/pictures/foxybody.png":1,"img/pictures/fredbod.png":1,"img/pictures/freddy1.png":1,"img/pictures/freddy2.png":1,"img/pictures/freddy3.png":1,"img/pictures/fredhead.png":1,"img/pictures/gf.png":1,"img/pictures/gf2.png":1,"img/pictures/hm.png":1,"img/pictures/kitchen.png":1,"img/pictures/matt.png":1,"img/pictures/notshowingthis.png":1,"img/pictures/pg1.png":1,"img/pictures/pg2.png":1,"img/pictures/pg3.png":1,"img/pictures/pg4.png":1,"img/pictures/pg5.png":1,"img/pictures/pg6.png":1,"img/pictures/pg7.png":1,"img/pictures/pirate's cove.png":1,"img/pictures/pirate's cove2.png":1,"img/pictures/prizecorner.png":1,"img/pictures/rat.png":1,"img/pictures/restroom.png":1,"img/pictures/restroom2.png":1,"img/pictures/room_arcade.png":1,"img/pictures/sickfuck.png":1,"img/pictures/saferoom.png":1,"img/pictures/salad.png":1,"img/pictures/stage.png":1,"img/pictures/base.png":1,"img/pictures/bono2.png":1,"img/pictures/bono3.png":1,"img/pictures/breadbear.png":1,"img/pictures/bullies.png":1,"img/pictures/cambutton.png":1,"img/pictures/cheater.png":1,"img/pictures/cop.png":1,"img/pictures/cop2.png":1,"img/pictures/cop3.png":1,"img/pictures/cop4.png":1,"img/pictures/cop6.png":1,"img/pictures/cryingchild.png":1,"img/pictures/doggo.png":1,"img/pictures/doggo2.png":1,"img/pictures/doggo3.png":1,"img/pictures/doggo4.png":1,"img/pictures/doggo5.png":1,"img/pictures/drawing1.png":1,"img/pictures/drawing1a.png":1,"img/pictures/drawing2.png":1,"img/pictures/drawing2a.png":1,"img/pictures/drawing3a.png":1,"img/pictures/drawing4a.png":1,"img/pictures/drawing5a.png":1,"img/pictures/drawing6a.png":1,"img/pictures/end1.png":1,"img/pictures/end10.png":1,"img/pictures/end11.png":1,"img/pictures/end12.png":1,"img/pictures/end13.png":1,"img/pictures/end14.png":1,"img/pictures/end15.png":1,"img/pictures/end16.png":1,"img/pictures/end17.png":1,"img/pictures/end18.png":1,"img/pictures/end2.png":1,"img/pictures/end3.png":1,"img/pictures/end4.png":1,"img/pictures/end5.png":1,"img/pictures/end6.png":1,"img/pictures/end7.png":1,"img/pictures/end8.png":1,"img/pictures/end9.png":1,"img/pictures/fire.png":1,"img/pictures/fri.png":1,"img/pictures/hm2.png":1,"img/pictures/justgetout.png":1,"img/pictures/kids.png":1,"img/pictures/kids1.png":1,"img/pictures/kids2.png":1,"img/pictures/kids3.png":1,"img/pictures/kids4.png":1,"img/pictures/light.png":1,"img/pictures/light1.png":1,"img/pictures/light2.png":1,"img/pictures/light3.png":1,"img/pictures/light4.png":1,"img/pictures/light5.png":1,"img/pictures/map.png":1,"img/pictures/mon.png":1,"img/pictures/officehallway.png":1,"img/pictures/oldman.png":1,"img/pictures/outside.png":1,"img/pictures/outside2.png":1,"img/pictures/outside3.png":1,"img/pictures/outside4.png":1,"img/pictures/parts.png":1,"img/pictures/party1.png":1,"img/pictures/party2.png":1,"img/pictures/pizza1.png":1,"img/pictures/pizza2.png":1,"img/pictures/pizza3.png":1,"img/pictures/pizza4.png":1,"img/pictures/purpleguy.png":1,"img/pictures/purpleguy2.png":1,"img/pictures/purpleguy3.png":1,"img/pictures/purpleguy4.png":1,"img/pictures/purpleguy7.png":1,"img/pictures/restroomhall.png":1,"img/pictures/rfredbear1.png":1,"img/pictures/rfredbear1a.png":1,"img/pictures/rfredbear1b.png":1,"img/pictures/rfredbear2.png":1,"img/pictures/rfredbear3.png":1,"img/pictures/robot1.png":1,"img/pictures/robot2.png":1,"img/pictures/saferoom2.png":1,"img/pictures/scanlines.png":1,"img/pictures/scanlines2.png":1,"img/pictures/security-office.png":1,"img/pictures/security-office2.png":1,"img/pictures/shade1.png":1,"img/pictures/sp1.png":1,"img/pictures/sp10.png":1,"img/pictures/sp11.png":1,"img/pictures/sp12.png":1,"img/pictures/sp13.png":1,"img/pictures/sp14.png":1,"img/pictures/sp2.png":1,"img/pictures/sp3.png":1,"img/pictures/sp4.png":1,"img/pictures/sp5.png":1,"img/pictures/sp6.png":1,"img/pictures/sp7.png":1,"img/pictures/sp8.png":1,"img/pictures/sp9.png":1,"img/pictures/spring1.png":1,"img/pictures/spring2.png":1,"img/pictures/spring3.png":1,"img/pictures/spring4.png":1,"img/pictures/spring5.png":1,"img/pictures/squirrel.png":1,"img/pictures/suitvision.png":1,"img/pictures/thu.png":1,"img/pictures/tues.png":1,"img/pictures/wed.png":1,"img/pictures/white.png":1,"img/system/balloon.png":1,"img/system/buttonset.png":1,"img/system/cirno1.png":1,"img/system/damage.png":1,"img/system/gameover.png":1,"img/system/gold_a.png":1,"img/system/gold_b.png":1,"img/system/iconset.png":1,"img/system/loading.png":1,"img/system/shadow1.png":1,"img/system/shadow2.png":1,"img/system/states.png":1,"img/system/vnbuttons.png":1,"img/system/weapons1.png":1,"img/system/weapons2.png":1,"img/system/weapons3.png":1,"img/system/window.png":1,"img/system/windowcursor.png":1,"img/system/msgimg_0.png":1,"img/system/msgimg_1.png":1,"img/tilesets/outside_a1.png":1,"img/tilesets/outside_a2.png":1,"img/tilesets/outside_b.png":1,"img/tilesets/atarib.png":1,"img/tilesets/ataric.png":1,"img/tilesets/atarid.png":1,"img/tilesets/dayshift.png":1,"img/tilesets/dayshift2.png":1,"img/titles1/title.png":1};
    var EMPTY_PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    var _requestImage = Bitmap.prototype._requestImage;
    Bitmap.prototype._requestImage = function(url) {
        var k = String(url);
        try { k = decodeURIComponent(k); } catch (e) {}
        if (/^img\//i.test(k) && !files[k.toLowerCase()]) {
            console.warn('[webport] missing image: ' + url);
            url = EMPTY_PNG;
        }
        _requestImage.call(this, url);
    };
})();

(function() {
    'use strict';

    // Every browser this runs in can play Ogg Vorbis through Web Audio;
    // MV would otherwise ask for .m4a files on phones, and there are none.
    AudioManager.audioFileExt = function() { return '.ogg'; };

    // Scale the 800x600 screen to fit the window, as the desktop version
    // does. MV only turns this on for NW.js and phones by default, so a
    // small window or an iframe would crop the game and add scrollbars.
    Graphics._defaultStretchMode = function() { return true; };

    // A sound the original game is missing shouldn't end the game.
    AudioManager.checkWebAudioError = function(webAudio) {
        if (webAudio && webAudio.isError()) {
            console.warn('[webport] failed to load audio: ' + webAudio.url);
            webAudio._hasError = false;
        }
    };

    // Saves go to localStorage. Every local HTML file shares one
    // localStorage, so give this game's keys their own prefix.
    var _webStorageKey = StorageManager.webStorageKey;
    StorageManager.webStorageKey = function(savefileId) {
        return 'DSaF1 ' + _webStorageKey.call(this, savefileId);
    };

    // "Quit" on the title screen closes the desktop window. A browser tab
    // can't be closed by the page, so the command is left out.
    var _makeCommandList = Window_TitleCommand.prototype.makeCommandList;
    Window_TitleCommand.prototype.makeCommandList = function() {
        _makeCommandList.call(this);
        this._list = this._list.filter(function(c) { return c.symbol !== 'exitGame'; });
    };

    // Remove the page-load screen once the engine has its canvas up.
    var _run = SceneManager.run;
    SceneManager.run = function(sceneClass) {
        var boot = document.getElementById('port-boot');
        if (boot) boot.parentNode.removeChild(boot);
        _run.call(this, sceneClass);
    };
})();
