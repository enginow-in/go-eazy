const pino = require('pino');

// Pretty-printed in dev (readable in a terminal), plain JSON in
// production (what log aggregators like Railway/Render/ELK actually want).
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'production'
    ? undefined
    : { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss', ignore: 'pid,hostname' } }
});

module.exports = logger;