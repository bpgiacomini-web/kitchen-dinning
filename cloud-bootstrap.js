/* Metro Eats cloud bootstrap: hydrate before app.js initializes its in-memory database. */
(function () {
  'use strict';
  var KEY = 'metro_eats_v2';
  var OLD_KEY = 'metro_eats_v1';
  var BACKUP_KEY = 'metro_eats_cloud_migration_backup_v1';

  function rows(value) { return Array.isArray(value) ? value : []; }
  function readLocal() {
    try {
      var raw = localStorage.getItem(KEY) || localStorage.getItem(OLD_KEY);
      if (!raw) return { recipes: [], restaurants: [] };
      var parsed = JSON.parse(raw);
      return { recipes: rows(parsed.recipes), restaurants: rows(parsed.restaurants) };
    } catch (_) { return { recipes: [], restaurants: [] }; }
  }
  function merge(local, cloud) {
    var result = {};
    ['recipes', 'restaurants'].forEach(function (kind) {
      var map = new Map();
      rows(cloud[kind]).forEach(function (item, i) {
        if (item && item.id != null) map.set(String(item.id), item);
        else map.set('__cloud_' + kind + '_' + i, item);
      });
      rows(local[kind]).forEach(function (item, i) {
        if (item && item.id != null) {
          if (!map.has(String(item.id))) map.set(String(item.id), item);
        } else if (!map.has('__local_' + kind + '_' + i)) {
          map.set('__local_' + kind + '_' + i, item);
        }
      });
      result[kind] = Array.from(map.values());
    });
    return result;
  }
  function count(data) {
    return rows(data.recipes).length + rows(data.restaurants).length;
  }
  function loadApp() {
    var script = document.createElement('script');
    script.src = 'app.js?v=20261018-cloud1';
    script.defer = true;
    document.body.appendChild(script);
  }
  function boot() {
    var local = readLocal();
    fetch('/api/data', { cache: 'no-store' })
      .then(function (response) {
        if (!response.ok) throw new Error('Cloud load failed: ' + response.status);
        return response.json();
      })
      .then(function (cloud) {
        if (!cloud || !Array.isArray(cloud.recipes) || !Array.isArray(cloud.restaurants)) {
          throw new Error('Cloud returned invalid Metro Eats data.');
        }
        // Preserve the pre-migration local snapshot so a bad merge is recoverable.
        try {
          if (!localStorage.getItem(BACKUP_KEY)) {
            localStorage.setItem(BACKUP_KEY, JSON.stringify({
              savedAt: new Date().toISOString(), data: local
            }));
          }
        } catch (_) {}
        var combined = merge(local, cloud);
        localStorage.setItem(KEY, JSON.stringify(combined));
        if (JSON.stringify(combined) !== JSON.stringify(cloud) && count(combined) > 0) {
          return fetch('/api/data', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(combined)
          }).then(function (response) {
            if (!response.ok) throw new Error('Cloud save failed: ' + response.status);
          }).catch(function (error) {
            console.warn('Metro Eats could not sync the initial merge; local data remains available.', error);
          });
        }
      })
      .catch(function (error) {
        // Do not block app startup when the network/cloud is temporarily unavailable.
        console.warn('Metro Eats cloud startup unavailable; using this device’s saved data.', error);
      })
      .finally(loadApp);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
