/**
 * Export Engine (GoEazy Analytics Plus™)
 * Utilities for exporting analytics data to CSV spreadsheets and generating
 * print-ready executive PDF reports.
 */

/**
 * Downloads raw data array as a formatted CSV file in the browser.
 */
export const downloadCSV = (filename, rows) => {
  if (!rows || !rows.length) return

  const headers = Object.keys(rows[0])
  const csvContent = [
    headers.join(','),
    ...rows.map(row => 
      headers.map(header => {
        let val = row[header] === null || row[header] === undefined ? '' : String(row[header])
        // Escape quotes & commas
        val = val.replace(/"/g, '""')
        return `"${val}"`
      }).join(',')
    )
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Prepares and triggers browser print modal for PDF report export.
 */
export const exportPDFReport = (reportTitle = 'GoEazy Analytics Report') => {
  const originalTitle = document.title
  document.title = `${reportTitle} - ${new Date().toLocaleDateString('en-IN')}`
  window.print()
  document.title = originalTitle
}

/**
 * Helper to export Landlord Performance Report to CSV
 */
export const exportLandlordCSV = (properties = [], funnelData = {}) => {
  const rows = properties.map(p => ({
    'Property ID': p.id,
    'Title': p.title,
    'Type': p.type,
    'City': p.city,
    'Area': p.area,
    'Rent (INR)': p.price,
    'Views': p.views || 0,
    'Est. Unlocks': Math.round((p.views || 0) * 0.18),
    'Est. Site Visits': Math.round((p.views || 0) * 0.08),
    'Status': p.availability ? 'Available' : 'Rented',
    'Created Date': new Date(p.created_at).toLocaleDateString('en-IN')
  }))

  // Add overall summary row
  rows.push({
    'Property ID': 'SUMMARY',
    'Title': 'Total Portfolio Metrics',
    'Type': `${properties.length} Properties`,
    'City': 'Uttarakhand',
    'Area': '-',
    'Rent (INR)': properties.reduce((a, b) => a + Number(b.price || 0), 0),
    'Views': properties.reduce((a, b) => a + Number(b.views || 0), 0),
    'Est. Unlocks': funnelData.steps?.[1]?.count || 0,
    'Est. Site Visits': funnelData.steps?.[2]?.count || 0,
    'Status': `${funnelData.overallConversion || 0}% Conversion Rate`,
    'Created Date': new Date().toLocaleDateString('en-IN')
  })

  downloadCSV('GoEazy_Landlord_Analytics', rows)
}

/**
 * Helper to export Admin Platform Executive Report to CSV
 */
export const exportAdminCSV = (growthTimeline = [], churnList = []) => {
  const rows = growthTimeline.map(g => ({
    'Report Period': g.label,
    'New User Signups': g.users,
    'Listing Unlock Revenue (INR)': g.revenue,
    'Active At-Risk Listings': churnList.length,
    'Report Generated': new Date().toLocaleDateString('en-IN')
  }))

  downloadCSV('GoEazy_Admin_Executive_Growth', rows)
}
