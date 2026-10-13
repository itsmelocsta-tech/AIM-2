/** Omit absent optional fields while retaining dates, SDK values and array positions. */
export function firestoreData<T>(value: T): T {
  if (Array.isArray(value)) return value.map(item => item === undefined ? null : firestoreData(item)) as T;
  if (value !== null && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
    return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined).map(([key, item]) => [key, firestoreData(item)])) as T;
  }
  return value;
}
