import { getDB } from "./db"

const STORES = [
  "sites",
  "settings",
  "disabledModels",
  "models",
  "results",
  "conversations",
]

async function readAllStores() {
  const db = await getDB()
  const data = {}
  for (const store of STORES) {
    data[store] = await db.getAll(store)
  }
  return data
}

async function writeStore(db, storeName, items) {
  const tx = db.transaction(storeName, "readwrite")
  const store = tx.objectStore(storeName)
  for (const item of items) {
    await store.put(item)
  }
  await tx.done
}

function mergeArrays(existing, incoming, keyField) {
  const map = new Map(existing.map((item) => [item[keyField], item]))
  let updated = 0
  let added = 0
  for (const item of incoming) {
    if (map.has(item[keyField])) {
      updated++
    } else {
      added++
    }
    map.set(keyField === "key" ? item[keyField] : item[keyField], item)
  }
  return { merged: Array.from(map.values()), added, updated }
}

export async function exportData() {
  const data = await readAllStores()
  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    data,
  }
  const json = JSON.stringify(payload, null, 2)
  const blob = new Blob([json], { type: "application/json;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url

  const now = new Date()
  const ts = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
    "_",
    String(now.getHours()).padStart(2, "0"),
    String(now.getMinutes()).padStart(2, "0"),
    String(now.getSeconds()).padStart(2, "0"),
  ].join("")

  link.download = `ai-config-backup_${ts}.json`
  link.click()
  URL.revokeObjectURL(url)
}

export function parseImportFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result)
        if (!parsed.data || typeof parsed.data !== "object") {
          reject(new Error("无效的备份文件格式"))
          return
        }
        resolve(parsed)
      } catch {
        reject(new Error("文件解析失败，请确认是有效的 JSON 文件"))
      }
    }
    reader.onerror = () => reject(new Error("文件读取失败"))
    reader.readAsText(file)
  })
}

export function getImportPreview(data) {
  const d = data.data || {}
  return {
    exportedAt: data.exportedAt,
    sites: d.sites?.length || 0,
    settings: d.settings?.length || 0,
    disabledModels: d.disabledModels?.length || 0,
    models: d.models?.length || 0,
    results: d.results?.length || 0,
    conversations: d.conversations?.length || 0,
  }
}

export async function importData(data) {
  const d = data.data || {}
  const db = await getDB()
  const stats = {}

  const keyMap = {
    sites: "id",
    settings: "key",
    disabledModels: "apiBase",
    models: "apiBase",
    results: "apiBase",
    conversations: "id",
  }

  for (const store of STORES) {
    const items = d[store]
    if (!items || !Array.isArray(items)) {
      stats[store] = { added: 0, updated: 0 }
      continue
    }

    const existing = await db.getAll(store)
    const keyField = keyMap[store]
    const { merged, added, updated } = mergeArrays(existing, items, keyField)

    await writeStore(db, store, merged)
    stats[store] = { added, updated }
  }

  return stats
}
