// Wrapper cho Vercel KV — tự động fallback nếu chưa connect KV
let kv = null

async function getKV() {
  if (kv) return kv
  try {
    const mod = await import('@vercel/kv')
    kv = mod.kv
    return kv
  } catch {
    return null
  }
}

const RULES_KEY = 'kakko:rules'
const HISTORY_KEY = 'kakko:history'

export async function getRules() {
  try {
    const store = await getKV()
    if (store) {
      const data = await store.get(RULES_KEY)
      return data || {}
    }
  } catch (e) {
    console.error('KV get error:', e)
  }
  return {}
}

export async function saveRules(rules) {
  try {
    const store = await getKV()
    if (store) {
      await store.set(RULES_KEY, rules)
      return true
    }
  } catch (e) {
    console.error('KV save error:', e)
  }
  return false
}

export async function addRule(surface, bracket, type = 'vocab') {
  const rules = await getRules()
  rules[surface] = {
    bracket,
    type,
    confirmed: true,
    count: (rules[surface]?.count || 0) + 1,
    updatedAt: new Date().toISOString()
  }
  await saveRules(rules)
  return rules
}

export async function deleteRule(surface) {
  const rules = await getRules()
  delete rules[surface]
  await saveRules(rules)
  return rules
}

export async function getHistory() {
  try {
    const store = await getKV()
    if (store) {
      const data = await store.get(HISTORY_KEY)
      return data || []
    }
  } catch (e) {}
  return []
}

export async function addHistory(entry) {
  try {
    const store = await getKV()
    if (store) {
      const history = await getHistory()
      history.push({ ...entry, ts: new Date().toISOString() })
      // Giữ 1000 entry gần nhất
      const trimmed = history.slice(-1000)
      await store.set(HISTORY_KEY, trimmed)
    }
  } catch (e) {}
}
