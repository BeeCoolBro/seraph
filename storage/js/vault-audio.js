/* Bee's Vault: mute the game from the vault.
 *
 * Bee's Vault shows these games in a frame, and a page can't reach into a
 * frame from another site to turn its sound down. So the game does it itself,
 * when the vault asks: a message {type: 'vault-audio', muted: true|false}
 * from the page this game is framed in.
 *
 * Muted means silent, never paused. This file is loaded first thing in every
 * game page, before any game code, so it can put one volume knob between the
 * game and the speakers:
 *
 *   - Web Audio (Unity, EmulatorJS, SDL ports, Ruffle, Phaser, Howler...):
 *     every audio context gets a master gain, and anything the game connects
 *     to the speakers is connected to that gain instead. Muting turns it to
 *     0. The context keeps running, so games that keep time by their audio
 *     clock -- emulators especially -- carry on playing.
 *   - <audio> and <video>, in the page or made in script: muted, and kept
 *     muted if the game unmutes them; the game's own setting comes back after.
 *   - Game frames inside this page are passed the message; a same-site frame
 *     without its own copy of this file is handled from here.
 *
 * Last resort, for a context this file only met after the game had already
 * wired it to the speakers (it was loaded too late): that context is
 * suspended while muted, which can pause a game that times itself by it.
 *
 * Nothing happens unless this page is in a frame and its parent asks. On load
 * it tells the parent it can be muted, so the vault knows which games can.
 */
(function () {
  'use strict';
  if (window.parent === window || window.__vaultAudioListening) return;
  window.__vaultAudioListening = true;

  var muted = false;
  var MSG = 'vault-audio';

  // ── one window's sound ───────────────────────────────────────────
  function install(w, early) {
    var reg;
    try {
      if (w.__vaultAudio) return w.__vaultAudio;
      reg = w.__vaultAudio = { ctxs: [], media: [] };
    } catch (e) { return null; }                    // another site's frame

    var Offline = w.OfflineAudioContext || w.webkitOfflineAudioContext;
    var offline = function (ctx) { return !!(Offline && ctx instanceof Offline); };
    var AC = w.AudioContext || w.webkitAudioContext;
    var baseProto = (w.BaseAudioContext || AC || {}).prototype;
    var destDesc = baseProto && Object.getOwnPropertyDescriptor(baseProto, 'destination');
    var Node = w.AudioNode && w.AudioNode.prototype;

    if (AC && destDesc && destDesc.get && Node) {
      var realDest = destDesc.get;
      var realGain = baseProto.createGain || baseProto.createGainNode;
      var realConnect = Node.connect, realDisconnect = Node.disconnect;
      var realSuspend = AC.prototype.suspend, realResume = AC.prototype.resume;
      reg.suspend = realSuspend;
      reg.resume = realResume;

      // the knob: made the first time a context is met, between it and the speakers
      reg.master = function (ctx) {
        if (!ctx || offline(ctx)) return null;
        if (ctx.__vaMaster) return ctx.__vaMaster;
        var g;
        try {
          g = realGain.call(ctx);
          realConnect.call(g, realDest.call(ctx));
          g.gain.value = muted ? 0 : 1;
        } catch (e) { return null; }
        ctx.__vaMaster = g;
        reg.ctxs.push(ctx);
        return g;
      };

      // every new context is ours from the start
      var wrapped = [];
      ['AudioContext', 'webkitAudioContext'].forEach(function (name) {
        var Real = w[name];
        if (typeof Real !== 'function') return;
        for (var i = 0; i < wrapped.length; i++) if (wrapped[i][0] === Real) { w[name] = wrapped[i][1]; return; }
        var Ctx = function () {
          var ctx = Reflect.construct(Real, arguments, new.target || Ctx);
          ctx.__vaOurs = true;
          reg.master(ctx);
          return ctx;
        };
        Ctx.prototype = Real.prototype;
        try { Object.setPrototypeOf(Ctx, Real); } catch (e) {}
        try { Object.defineProperty(Ctx, 'name', { value: name }); } catch (e) {}
        wrapped.push([Real, Ctx]);
        w[name] = Ctx;
      });

      // anything headed for the speakers goes through the knob instead
      Node.connect = function (dest) {
        var ctx = this.context;
        if (dest && ctx && !offline(ctx)) {
          var real = null;
          try { real = realDest.call(ctx); } catch (e) {}
          if (dest === real) {
            var m = reg.master(ctx);
            if (m && m !== this) {
              var a = [].slice.call(arguments);
              a[0] = m;
              realConnect.apply(this, a);
              return dest;
            }
          }
        }
        return realConnect.apply(this, arguments);
      };
      Node.disconnect = function (dest) {
        var ctx = this.context;
        if (dest && ctx && ctx.__vaMaster) {
          var real = null;
          try { real = realDest.call(ctx); } catch (e) {}
          if (dest === real) {
            var a = [].slice.call(arguments);
            a[0] = ctx.__vaMaster;
            // connected through the knob -- or directly, before this file was here
            try { return realDisconnect.apply(this, a); } catch (e) {}
          }
        }
        return realDisconnect.apply(this, arguments);
      };

      // A context made before this file (only when loaded late) is found when
      // the game uses it; what it wired up earlier bypasses the knob.
      var seen = function (ctx) {
        if (!ctx || offline(ctx) || ctx.__vaMaster) return;
        reg.master(ctx);
        if (!ctx.__vaOurs) ctx.__vaLate = true;
        if (muted) quietCtx(reg, ctx);
      };
      ['createBufferSource', 'createBuffer', 'createGain', 'createOscillator', 'createScriptProcessor',
       'createMediaElementSource', 'createMediaStreamSource', 'decodeAudioData', 'createPanner',
       'createStereoPanner', 'createAnalyser', 'createBiquadFilter', 'createDynamicsCompressor'].forEach(function (name) {
        var real = baseProto[name];
        if (typeof real !== 'function') return;
        baseProto[name] = function () { seen(this); return real.apply(this, arguments); };
      });
      var t = Object.getOwnPropertyDescriptor(baseProto, 'currentTime');
      if (t && t.get && t.configurable) {
        Object.defineProperty(baseProto, 'currentTime', {
          configurable: true, enumerable: t.enumerable,
          get: function () { seen(this); return t.get.call(this); }
        });
      }
      // a late context held while muted stays held if the game resumes it
      if (realResume) {
        AC.prototype.resume = function () {
          if (muted && this.__vaLate) { this.__vaWants = true; return Promise.resolve(); }
          return realResume.apply(this, arguments);
        };
      }
    }

    // media elements: their own muted value is kept aside while the vault mutes
    var M = w.HTMLMediaElement && w.HTMLMediaElement.prototype;
    if (M) {
      var mDesc = Object.getOwnPropertyDescriptor(M, 'muted');
      reg.setMuted = mDesc && mDesc.set;
      reg.getMuted = mDesc && mDesc.get;
      if (mDesc && mDesc.configurable && mDesc.set) {
        Object.defineProperty(M, 'muted', {
          configurable: true, enumerable: mDesc.enumerable,
          get: function () { return '__vaOwn' in this ? this.__vaOwn : mDesc.get.call(this); },
          set: function (v) {
            if (reg.media.indexOf(this) < 0) reg.media.push(this);
            this.__vaOwn = !!v;
            mDesc.set.call(this, muted ? true : !!v);
          }
        });
      }
      var realPlay = M.play;
      if (typeof realPlay === 'function') {
        M.play = function () {
          if (reg.media.indexOf(this) < 0) reg.media.push(this);
          if (muted) quietEl(reg, this, true);
          return realPlay.apply(this, arguments);
        };
      }
    }
    return reg;
  }

  // the knob, turned smoothly so there's no click
  function knob(ctx, on) {
    var g = ctx.__vaMaster;
    if (!g) return;
    try {
      g.gain.cancelScheduledValues(ctx.currentTime);
      g.gain.setTargetAtTime(on ? 0 : 1, ctx.currentTime, 0.015);
    } catch (e) { try { g.gain.value = on ? 0 : 1; } catch (x) {} }
  }

  // a late context: the knob can't reach what it wired up before, so suspend it
  function quietCtx(reg, ctx) {
    knob(ctx, true);
    if (ctx.__vaLate && ctx.state === 'running' && !ctx.__vaHeld) {
      ctx.__vaHeld = true;
      try { var p = reg.suspend && reg.suspend.call(ctx); if (p && p.catch) p.catch(function () {}); } catch (e) {}
    }
  }

  function wakeCtx(reg, ctx) {
    knob(ctx, false);
    if (ctx.__vaHeld || ctx.__vaWants) {
      ctx.__vaHeld = ctx.__vaWants = false;
      try { var p = reg.resume && reg.resume.call(ctx); if (p && p.catch) p.catch(function () {}); } catch (e) {}
    }
  }

  function quietEl(reg, el, on) {
    try {
      if (!('__vaOwn' in el)) el.__vaOwn = reg.getMuted ? reg.getMuted.call(el) : false;
      if (reg.setMuted) reg.setMuted.call(el, on ? true : el.__vaOwn);
    } catch (e) {}
  }

  // ── muting and unmuting a window, and the game frames inside it ──
  function apply(w) {
    var reg = install(w, false);
    if (!reg) return;
    reg.ctxs.forEach(function (ctx) { try { if (muted) quietCtx(reg, ctx); else wakeCtx(reg, ctx); } catch (e) {} });
    var els = [];
    try { els = [].slice.call(w.document.querySelectorAll('audio, video')); } catch (e) {}
    reg.media.concat(els).forEach(function (el) { quietEl(reg, el, muted); });
    frames(w).forEach(function (f) { child(f); });
  }

  function frames(w) {
    try { return [].slice.call(w.document.querySelectorAll('iframe, frame')); } catch (e) { return []; }
  }

  // a frame inside the game: told either way; a same-site one without its
  // own copy of this file is handled from here
  function child(f) {
    if (!f.__vaWatched) {
      f.__vaWatched = true;
      f.addEventListener('load', function () { child(f); });
    }
    var cw = f.contentWindow;
    if (!cw) return;
    var own = false, same = false;
    try { same = !!cw.document; own = !!cw.__vaultAudioListening; } catch (e) {}
    if (same && !own) apply(cw);
    try { cw.postMessage({ type: MSG, muted: muted }, '*'); } catch (e) {}
  }

  // frames the game adds later get the same treatment
  function watch() {
    try {
      new MutationObserver(function (list) {
        list.forEach(function (m) {
          [].forEach.call(m.addedNodes, function (n) {
            if (n.tagName === 'IFRAME' || n.tagName === 'FRAME') child(n);
            else if (n.querySelectorAll) [].forEach.call(n.querySelectorAll('iframe, frame'), child);
          });
        });
      }).observe(document.documentElement, { childList: true, subtree: true });
    } catch (e) {}
  }

  install(window, true);
  watch();
  frames(window).forEach(child);

  function tell() {
    try { window.parent.postMessage({ type: MSG, ready: true, muted: muted }, '*'); } catch (e) {}
  }

  window.addEventListener('message', function (e) {
    // only the page this game is shown in may mute it
    if (e.source !== window.parent) return;
    var d = e.data;
    if (!d || d.type !== MSG) return;
    if (typeof d.muted === 'boolean' && d.muted !== muted) {
      muted = d.muted;
      apply(window);
    }
    tell();
  });

  tell();
})();
