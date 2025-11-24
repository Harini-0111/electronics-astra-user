// Simple DB status tracker used by the server to know if Postgres initialized
let dbConnected = false;

module.exports = {
  isConnected: () => dbConnected,
  setConnected: (val) => { dbConnected = !!val; },
};
