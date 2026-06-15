const db = require('../db')

module.exports = async function generateInvoiceNumber(company_id) {
  const year = new Date().getFullYear()
  const [[{ seq }]] = await db.query(
    'SELECT COUNT(*) AS seq FROM invoices WHERE company_id = ? AND YEAR(created_at) = ?',
    [company_id, year]
  )
  const paddedCompany = String(company_id).padStart(4, '0')
  const paddedSeq     = String(Number(seq) + 1).padStart(3, '0')
  return `LNR-${year}-${paddedCompany}-${paddedSeq}`
}
