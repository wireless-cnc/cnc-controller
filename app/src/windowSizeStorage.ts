import { app } from "electron";
import { existsSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import logger from "./logger";

const STORAGE_FILE_NAME = "main-window-size.json";
const log = logger.scope("window-size-storage");

export type StoredWindowSize = {
  width: number;
  height: number;
};

function getStoragePath() {
  return path.join(app.getPath("userData"), STORAGE_FILE_NAME);
}

function isValidSize(candidate: unknown): candidate is StoredWindowSize {
  if (typeof candidate !== "object" || candidate === null) {
    return false;
  }

  const { width, height } = candidate as StoredWindowSize;
  return (
    typeof width === "number" &&
    typeof height === "number" &&
    Number.isFinite(width) &&
    Number.isFinite(height) &&
    width > 0 &&
    height > 0
  );
}

export function loadWindowSize(): StoredWindowSize | undefined {
  const storagePath = getStoragePath();

  try {
    if (!existsSync(storagePath)) {
      return undefined;
    }

    const parsedValue = JSON.parse(readFileSync(storagePath, "utf8"));
    if (isValidSize(parsedValue)) {
      return parsedValue;
    }

    log.warn("Invalid window size stored. Falling back to defaults.");
  } catch (error) {
    log.warn("Unable to read stored window size", error);
  }

  return undefined;
}

export function persistWindowSize(size: StoredWindowSize) {
  const storagePath = getStoragePath();

  try {
    writeFileSync(storagePath, JSON.stringify(size), "utf8");
  } catch (error) {
    log.error("Unable to persist window size", error);
  }
}
