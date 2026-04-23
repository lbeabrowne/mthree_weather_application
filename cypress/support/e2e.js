// Import custom commands (always required)
// import './commands'

// Optional: hide XHR noise from the command log
const origLog = Cypress.log.bind(Cypress)
Cypress.log = (opts, ...other) => {
  if (opts.displayName === 'xhr' && opts.url?.includes('/api/')) return
  return origLog(opts, ...other)
}