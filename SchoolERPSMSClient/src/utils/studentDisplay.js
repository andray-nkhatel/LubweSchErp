/**
 * Format student name as "LastName FirstName" for display and alphabetical sorting by last name first.
 * @param {Object} student - Object with firstName, lastName, fullName (or FirstName, LastName, FullName)
 * @returns {string} e.g. "Banda Anna"
 */
export function formatStudentLastNameFirst(student) {
  if (!student) return ''
  const last = (student.lastName ?? student.LastName ?? '').trim()
  const first = (student.firstName ?? student.FirstName ?? '').trim()
  return `${last} ${first}`.trim() || (student.fullName ?? student.FullName ?? '')
}
