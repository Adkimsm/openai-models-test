import { openDB as idbOpen } from "idb"

const DB_NAME = "ai-test-db"
const DB_VERSION = 1

let dbPromise = null

function getDB() {
  if (!dbPromise) {
    dbPromise = idbOpen(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("sites")) {
          db.createObjectStore("sites", { keyPath: "id" })
        }
        if (!db.objectStoreNames.contains("settings")) {
          db.createObjectStore("settings", { keyPath: "key" })
        }
        if (!db.objectStoreNames.contains("disabledModels")) {
          db.createObjectStore("disabledModels", { keyPath: "apiBase" })
        }
        if (!db.objectStoreNames.contains("models")) {
          db.createObjectStore("models", { keyPath: "apiBase" })
        }
        if (!db.objectStoreNames.contains("results")) {
          db.createObjectStore("results", { keyPath: "apiBase" })
        }
      },
    })
  }
  return dbPromise
}

// ── Sites ──

export async function getSites() {
  const db = await getDB()
  return db.getAll("sites")
}

export async function getSite(id) {
  const db = await getDB()
  return db.get("sites", id)
}

export async function saveSite(site) {
  const db = await getDB()
  return db.put("sites", site)
}

export async function deleteSite(id) {
  const db = await getDB()
  return db.delete("sites", id)
}

// ── Settings (key-value) ──

export async function getSetting(key) {
  const db = await getDB()
  const record = await db.get("settings", key)
  return record?.value
}

export async function setSetting(key, value) {
  const db = await getDB()
  return db.put("settings", { key, value })
}

export async function getAllSettings() {
  const db = await getDB()
  const records = await db.getAll("settings")
  return Object.fromEntries(records.map((r) => [r.key, r.value]))
}

// ── Disabled Models (per site) ──

export async function getDisabledModels(apiBase) {
  const db = await getDB()
  const record = await db.get("disabledModels", apiBase)
  return record?.models || []
}

export async function saveDisabledModels(apiBase, models) {
  const db = await getDB()
  return db.put("disabledModels", { apiBase, models })
}

// ── Models (per site) ──

export async function getModels(apiBase) {
  const db = await getDB()
  const record = await db.get("models", apiBase)
  return record?.models || []
}

export async function saveModels(apiBase, models) {
  const db = await getDB()
  return db.put("models", { apiBase, models })
}

// ── Results (per site, only last run) ──

export async function getResults(apiBase) {
  const db = await getDB()
  const record = await db.get("results", apiBase)
  return record?.results || []
}

export async function saveResults(apiBase, results) {
  const db = await getDB()
  return db.put("results", { apiBase, results })
}
