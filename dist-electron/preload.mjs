"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("electronAPI", {
  database: {
    startSession: () => electron.ipcRenderer.invoke("database-start-session"),
    stopSession: (sessionId) => electron.ipcRenderer.invoke("database-stop-session", sessionId),
    updateStats: (sessionId, stats) => electron.ipcRenderer.invoke("database-update-stats", sessionId, stats),
    addStatsSnapshot: (sessionId, hashesPerSecond, totalHashes) => electron.ipcRenderer.invoke("database-add-stats-snapshot", sessionId, hashesPerSecond, totalHashes),
    getSessions: () => electron.ipcRenderer.invoke("database-get-sessions"),
    getSessionStats: (sessionId) => electron.ipcRenderer.invoke("database-get-session-stats", sessionId),
    getOverallStats: () => electron.ipcRenderer.invoke("database-get-overall-stats")
  },
  // Keep your existing ipcRenderer exposure
  ipcRenderer: {
    on(channel, func) {
      electron.ipcRenderer.on(channel, (_event, ...args) => func(...args));
    },
    off(channel, func) {
      electron.ipcRenderer.removeListener(channel, func);
    },
    send(channel, ...args) {
      electron.ipcRenderer.send(channel, ...args);
    },
    invoke(channel, ...args) {
      return electron.ipcRenderer.invoke(channel, ...args);
    }
  }
});
