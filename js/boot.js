'use strict';
/* Start-up: register custom exercises, restore an active session, render, offline cache. */
(function () {
  App.registerCustom();
  if (App.st.active) {
    App.ui.tab = 'train'; App.ui.focus = !!App.st.settings.prefs.fullscreen; App.requestWakeLock();
    // the set-entry and drop-set forms live in memory only: after a restart reopen them from the saved workout
    App.st.active.items.forEach((it, i) => {
      if (it.phase === 'log') it.phase = 'perform';
      if (it.phase === 'drops') App.ui.drops = { i, list: Engine.dropWeights(it, EX[it.exId], App.st, it.drops || 2).map(w => ({ w, reps: 0 })) };
    });
  }
  App.render();
  // ask the browser not to evict the training log when the phone runs low on space
  if (navigator.storage && navigator.storage.persisted) {
    navigator.storage.persisted().then(ok => (ok || !App.st.settings.onboarded || !navigator.storage.persist ? ok : navigator.storage.persist())).then(ok => { App.persisted = !!ok; }).catch(() => { /* optional */ });
  }
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('sw.js').catch(() => { /* offline cache optional */ });
  }
})();
