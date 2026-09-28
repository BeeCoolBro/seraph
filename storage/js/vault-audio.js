/* Bee's Vault: mute the game from the vault.
 *
 * Bee's Vault shows these games in a frame, and a page can't reach into a
 * frame from another site to turn its sound down. So the game does it itself,
 * when the vault asks: a message {type: 'vault-audio', muted: true|false}
 * from the page this game is framed in. Muted means silent, not paused:
 *
 *   - Web Audio (Unity, Phaser, Howler, Construct...): every audio context the
 *     game uses is suspended, and stays suspended if the game tries to resume
 *     it, until the vault unmutes.
 *   - <audio> and <video>, in the page or made in script: muted, and kept muted
 *     if the game unmutes them; its own setting comes back on unmute.
 *   - Game frames inside this page: same-site ones get the same treatment,
 *     others are passed the message.
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

  // ── one window's sound: patched once per document ─────────────────
  function install(w) {
    var reg;
    try {
      if (w.__vaultAudio) return w.__vaultAudio;
      reg = w.__vaultAudio = { ctxs: [], media: [] };
    } catch (e) { return null; }                 // another site's frame

    var Base = w.BaseAudioContext || w.AudioContext || w.webkitAudioContext;
    var Offline = w.OfflineAudioContext || w.webkitOfflineAudioContext;
    if (Base && Base.prototype) {
      var proto = Base.prototype;
      var realSuspend = (w.AudioContext && w.AudioContext.prototype.suspend) || proto.suspend;
      var realResume = (w.AudioContext && w.AudioContext.prototype.resume) || proto.resume;
      reg.suspend = realSuspend;
      reg.resume = realResume;

      // A context is found the first time the game uses it -- however long
      // before this script it was made -- and silenced then if need be.
      var seen = function (ctx) {
        if (!ctx || (Offline && ctx instanceof Offline)) return;
        if (reg.ctxs.indexOf(ctx) < 0) reg.ctxs.push(ctx);
        if (muted && ctx.state === 'running' && !ctx.__vaHeld) hold(reg, ctx);
      };
      ['createBufferSource', 'createGain', 'createOscillator', 'createMediaElementSource',
       'createMediaStreamSource', 'decodeAudioData', 'createPanner', 'createStereoPanner'].forEach(function (name) {
        var real = proto[name];
        if (typeof real !== 'function') return;
        proto[name] = function () { seen(this); return real.apply(this, arguments); };
      });
      var t = Object.getOwnPropertyDescriptor(proto, 'currentTime');
      if (t && t.get && t.configurable) {
        Object.defineProperty(proto, 'currentTime', {
          configurable: true, enumerable: t.enumerable,
          get: function () { seen(this); return t.get.call(this); }
        });
      }
      // while muted, a game's own resume() is remembered, not done
      if (realResume) {
        var patchResume = function (P) {
          if (!P || P.__vaResume) return;
          P.__vaResume = true;
          P.resume = function () {
            if (!(Offline && this instanceof Offline)) {
              if (reg.ctxs.indexOf(this) < 0) reg.ctxs.push(this);
              if (muted) { this.__vaWants = true; return Promise.resolve(); }
            }
            return realResume.apply(this, arguments);
          };
        };
        patchResume(w.AudioContext && w.AudioContext.prototype);
        patchResume(w.webkitAudioContext && w.webkitAudioContext.prototype);
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
          if (muted) quiet(reg, this, true);
          return realPlay.apply(this, arguments);
        };
      }
    }
    return reg;
  }

  function hold(reg, ctx) {
    ctx.__vaHeld = true;
    try { var p = reg.suspend && reg.suspend.call(ctx); if (p && p.catch) p.catch(function () {}); } catch (e) {}
  }

  function quiet(reg, el, on) {
    try {
      if (!('__vaOwn' in el)) el.__vaOwn = reg.getMuted ? reg.getMuted.call(el) : false;
      if (reg.setMuted) reg.setMuted.call(el, on ? true : el.__vaOwn);
    } catch (e) {}
  }

  // ── muting and unmuting a window, and the game frames inside it ──
  function apply(w) {
    var reg = install(w);
    if (!reg) return;
    reg.ctxs.forEach(function (ctx) {
      try {
        if (muted) {
          if (ctx.state === 'running') hold(reg, ctx);
        } else if (ctx.__vaHeld || ctx.__vaWants) {
          ctx.__vaHeld = false;
          ctx.__vaWants = false;
          var p = reg.resume && reg.resume.call(ctx);
          if (p && p.catch) p.catch(function () {});
        }
      } catch (e) {}
    });
    var els = [];
    try { els = [].slice.call(w.document.querySelectorAll('audio, video')); } catch (e) {}
    reg.media.concat(els).forEach(function (el) { quiet(reg, el, muted); });
    frames(w).forEach(function (f) { child(f); });
  }

  function frames(w) {
    try { return [].slice.call(w.document.querySelectorAll('iframe, frame')); } catch (e) { return []; }
  }

  // a frame inside the game: the same site is handled here, another site is asked
  function child(f) {
    if (!f.__vaWatched) {
      f.__vaWatched = true;
      f.addEventListener('load', function () { child(f); });
    }
    var cw = f.contentWindow;
    if (!cw) return;
    var same = false;
    try { same = !!cw.document; } catch (e) {}
    if (same) apply(cw);
    // told either way: a frame with its own copy of this script listens too
    try { cw.postMessage({ type: MSG, muted: muted }, '*'); } catch (e) {}
  }

  // frames the game adds later get the same treatment
  function watch(w) {
    try {
      new w.MutationObserver(function (list) {
        list.forEach(function (m) {
          [].forEach.call(m.addedNodes, function (n) {
            if (n.tagName === 'IFRAME' || n.tagName === 'FRAME') child(n);
            else if (n.querySelectorAll) [].forEach.call(n.querySelectorAll('iframe, frame'), child);
          });
        });
      }).observe(w.document.documentElement, { childList: true, subtree: true });
    } catch (e) {}
  }

  install(window);
  watch(window);
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
