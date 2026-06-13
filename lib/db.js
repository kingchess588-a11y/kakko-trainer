import { Redis } from '@upstash/redis'

let redis = null

function getRedis() {
  if (redis) return redis
  redis = Redis.fromEnv()
  return redis
}

const RULES_KEY = 'kakko:rules'

export async function getRules() {
  try {
    const data = await getRedis().get(RULES_KEY)
    return data || {}
  } catch (e) {
    console.error('Redis get error:', e)
    return {}
  }
}

export async function saveRules(rules) {
  try {
    await getRedis().set(RULES_KEY, rules)
    return true
  } catch (e) {
    console.error('Redis save error:', e)
    return false
  }
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
