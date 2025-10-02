var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
import { app, BrowserWindow, ipcMain } from "electron";
import { fileURLToPath } from "node:url";
import path$1 from "node:path";
import fs from "fs";
import path from "path";
class SimpleMiningDatabase {
  constructor() {
    __publicField(this, "dbPath");
    __publicField(this, "data", { sessions: [], stats: [] });
    const userDataPath = app.getPath("userData");
    this.dbPath = path.join(userDataPath, "mining-data.json");
    console.log("Database file location:", this.dbPath);
    this.load();
  }
  load() {
    try {
      if (fs.existsSync(this.dbPath)) {
        const fileData = fs.readFileSync(this.dbPath, "utf-8");
        this.data = JSON.parse(fileData);
      }
    } catch (error) {
      console.log("Creating new database file");
      this.data = { sessions: [], stats: [] };
    }
  }
  save() {
    try {
      fs.writeFileSync(this.dbPath, JSON.stringify(this.data, null, 2));
    } catch (error) {
      console.error("Failed to save database:", error);
    }
  }
  async startSession() {
    const session = {
      id: Date.now(),
      start_time: (/* @__PURE__ */ new Date()).toISOString(),
      end_time: null,
      total_hashes: 0,
      accepted_hashes: 0,
      hashes_per_second: 0,
      status: "running"
    };
    this.data.sessions.push(session);
    this.save();
    return session.id;
  }
  async stopSession(sessionId) {
    const session = this.data.sessions.find((s) => s.id === sessionId);
    if (session) {
      session.end_time = (/* @__PURE__ */ new Date()).toISOString();
      session.status = "stopped";
      this.save();
    }
  }
  async updateSessionStats(sessionId, stats) {
    const session = this.data.sessions.find((s) => s.id === sessionId);
    if (session) {
      session.total_hashes = stats.totalHashes;
      session.accepted_hashes = stats.acceptedHashes;
      session.hashes_per_second = stats.hashesPerSecond;
      this.save();
    }
  }
  async addStatsSnapshot(sessionId, hashesPerSecond, totalHashes) {
    const stat = {
      id: Date.now(),
      session_id: sessionId,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      hashes_per_second: hashesPerSecond,
      total_hashes: totalHashes
    };
    this.data.stats.push(stat);
    this.save();
  }
  async getSessions() {
    return this.data.sessions.sort(
      (a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
    );
  }
  async getSessionStats(sessionId) {
    return this.data.stats.filter((stat) => stat.session_id === sessionId).sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }
  async getOverallStats() {
    const sessions = this.data.sessions;
    const totalHashes = sessions.reduce((sum, s) => sum + s.total_hashes, 0);
    const acceptedHashes = sessions.reduce((sum, s) => sum + s.accepted_hashes, 0);
    const avgHashRate = sessions.length > 0 ? sessions.reduce((sum, s) => sum + s.hashes_per_second, 0) / sessions.length : 0;
    return {
      total_sessions: sessions.length,
      total_hashes: totalHashes,
      accepted_hashes: acceptedHashes,
      avg_hash_rate: avgHashRate
    };
  }
  async close() {
  }
}
const __dirname = path$1.dirname(fileURLToPath(import.meta.url));
process.env.APP_ROOT = path$1.join(__dirname, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path$1.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path$1.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path$1.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
let win;
let db;
function createWindow() {
  win = new BrowserWindow({
    icon: path$1.join(process.env.VITE_PUBLIC ?? RENDERER_DIST, "favicon.svg"),
    webPreferences: {
      preload: path$1.join(__dirname, "preload.mjs"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  win.setMenu(null);
  win.webContents.on("did-finish-load", () => {
    win == null ? void 0 : win.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  });
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path$1.join(RENDERER_DIST, "index.html"));
  }
}
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    if (db) {
      db.close();
    }
    app.quit();
    win = null;
  }
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
app.on("before-quit", () => {
  if (db) {
    db.close();
  }
});
app.whenReady().then(() => {
  db = new SimpleMiningDatabase();
  createWindow();
});
ipcMain.handle("database-start-session", async () => {
  return db.startSession();
});
ipcMain.handle("database-stop-session", async (_event, sessionId) => {
  db.stopSession(sessionId);
  return { success: true };
});
ipcMain.handle("database-update-stats", async (_event, sessionId, stats) => {
  db.updateSessionStats(sessionId, stats);
  return { success: true };
});
ipcMain.handle("database-add-stats-snapshot", async (_event, sessionId, hashesPerSecond, totalHashes) => {
  db.addStatsSnapshot(sessionId, hashesPerSecond, totalHashes);
  return { success: true };
});
ipcMain.handle("database-get-sessions", async () => {
  return db.getSessions();
});
ipcMain.handle("database-get-session-stats", async (_event, sessionId) => {
  return db.getSessionStats(sessionId);
});
ipcMain.handle("database-get-overall-stats", async () => {
  return db.getOverallStats();
});
export {
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
