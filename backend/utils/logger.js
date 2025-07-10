const winston = require('winston');
const path = require('path');

// Create logs directory if it doesn't exist
const fs = require('fs');
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white'
};

// Add colors to winston
winston.addColors(colors);

// Define format
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// Define transports
const transports = [
  // Console transport
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }),
  
  // File transport for errors
  new winston.transports.File({
    filename: path.join(logsDir, 'error.log'),
    level: 'error',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
    maxsize: 5242880, // 5MB
    maxFiles: 5
  }),
  
  // File transport for all logs
  new winston.transports.File({
    filename: path.join(logsDir, 'combined.log'),
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
    maxsize: 5242880, // 5MB
    maxFiles: 5
  })
];

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels,
  format,
  transports,
  exitOnError: false
});

// Custom logging methods for specific use cases
logger.logAPIRequest = (req, res, responseTime) => {
  const message = `${req.method} ${req.originalUrl} - ${res.statusCode} - ${responseTime}ms - ${req.ip}`;
  logger.http(message);
};

logger.logError = (error, context = {}) => {
  const errorInfo = {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    ...context
  };
  logger.error(JSON.stringify(errorInfo));
};

logger.logGPTUsage = (model, tokensUsed, responseTime) => {
  const message = `GPT Usage - Model: ${model}, Tokens: ${tokensUsed}, Time: ${responseTime}ms`;
  logger.info(message);
};

logger.logNPIRequest = (searchParams, resultCount, responseTime) => {
  const message = `NPI Search - Location: ${searchParams.location}, Specialties: ${searchParams.specialties?.join(', ')}, Results: ${resultCount}, Time: ${responseTime}ms`;
  logger.info(message);
};

logger.logCacheOperation = (operation, key, hit = null) => {
  const message = hit !== null 
    ? `Cache ${operation} - Key: ${key}, Hit: ${hit}`
    : `Cache ${operation} - Key: ${key}`;
  logger.debug(message);
};

logger.logSecurityEvent = (event, details) => {
  const message = `Security Event - ${event}: ${JSON.stringify(details)}`;
  logger.warn(message);
};

logger.logPerformance = (operation, duration, metadata = {}) => {
  const message = `Performance - ${operation}: ${duration}ms`;
  if (Object.keys(metadata).length > 0) {
    logger.info(`${message} - ${JSON.stringify(metadata)}`);
  } else {
    logger.info(message);
  }
};

// Stream for morgan HTTP logging
logger.stream = {
  write: (message) => {
    logger.http(message.trim());
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Production vs Development logging
if (process.env.NODE_ENV === 'production') {
  // In production, don't log to console
  logger.remove(winston.transports.Console);
} else if (process.env.NODE_ENV === 'test') {
  // In test mode, only log errors to console
  logger.level = 'error';
}

module.exports = logger;