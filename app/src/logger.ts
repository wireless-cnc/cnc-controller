import moment from "moment";
import logger from "electron-log";

if (process && process.type === "browser") {
  const level = "debug";
  logger.transports.console.format =
    "[{y}-{m}-{d} {h}:{i}:{s}.{ms}]{scope} [{level}] {text}";
  logger.transports.console.level = level;
  logger.transports.file.fileName = `${moment().format("YYYY-MM-DD")}.log`;
  logger.transports.file.level = level;
}

export default logger;
