'use strict';
/* Start-up: register custom exercises, restore an active session, render, offline cache. */
(function () {
  App.registerCustom();
  if (App.st.active) { App.ui.tab = 'train'; App.ui.focus = !!App.st.settings.prefs.fullscreen; App.requestWakeLock(); }
  App.render();
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('sw.js').catch(() => { /* offline cache optional */ });
  }
})();
