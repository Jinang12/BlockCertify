export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

function sortValue(value: JsonValue): JsonValue {
  if (Array.isArray(value)) {
    return value.map(sortValue);
  }

  if (value && typeof value === 'object') {
    return Object.keys(value)
      .sort()
      .reduce<Record<string, JsonValue>>((acc, key) => {
        acc[key] = sortValue((value as Record<string, JsonValue>)[key]);
        return acc;
      }, {});
  }

  return value;
}

export function toCanonicalJson(data: JsonValue) {
  return JSON.stringify(sortValue(data));
}
