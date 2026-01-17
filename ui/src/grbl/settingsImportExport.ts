export type SettingsMap = Record<string, number>;

type ParsedSettings = {
  settings: SettingsMap;
};

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const toNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return null;
};

export const parseSettingsJson = (jsonText: string): ParsedSettings => {
  const parsed = JSON.parse(jsonText) as unknown;
  if (!isPlainObject(parsed)) {
    throw new Error("Invalid settings JSON format");
  }

  const source = isPlainObject(parsed.settings) ? parsed.settings : parsed;
  const settings: SettingsMap = {};

  Object.entries(source).forEach(([key, value]) => {
    if (!key.startsWith("$")) {
      return;
    }
    const numeric = toNumber(value);
    if (numeric === null) {
      return;
    }
    settings[key] = numeric;
  });

  return { settings };
};

export const serializeSettingsJson = (settings: SettingsMap): string => {
  return JSON.stringify(
    {
      version: "1.0",
      settings,
    },
    null,
    2
  );
};
