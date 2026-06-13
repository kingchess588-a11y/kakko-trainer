import { getRules, addRule, deleteRule, saveRules } from '../../lib/db'

export default async function handler(req, res) {
  // GET: lấy toàn bộ rules
  if (req.method === 'GET') {
    const rules = await getRules()
    return res.status(200).json({ rules })
  }

  // POST: thêm rule mới
  if (req.method === 'POST') {
    const { surface, bracket, type } = req.body
    if (!surface || !bracket) return res.status(400).json({ error: 'Thiếu surface hoặc bracket' })
    const rules = await addRule(surface, bracket, type || 'vocab')
    return res.status(200).json({ rules })
  }

  // DELETE: xóa rule
  if (req.method === 'DELETE') {
    const { surface } = req.body
    if (!surface) return res.status(400).json({ error: 'Thiếu surface' })
    const rules = await deleteRule(surface)
    return res.status(200).json({ rules })
  }

  // PUT: import hàng loạt
  if (req.method === 'PUT') {
    const { rules } = req.body
    if (!rules || typeof rules !== 'object') return res.status(400).json({ error: 'Dữ liệu không hợp lệ' })
    await saveRules(rules)
    return res.status(200).json({ rules, imported: Object.keys(rules).length })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
