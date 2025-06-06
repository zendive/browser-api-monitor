const TAG_EXCEPTION_FALLBACK = '⁉️ ⟪exception⟫';
export const TAG_EXCEPTION = (x: unknown) => `⁉️ ⟪${x}⟫`;
const TAG_FUNCTION = (name: string) => `ƒ${name ? ` ${name}` : ''}⟪function⟫`;
const TAG_NUMERIC = (value: bigint | number) =>
  typeof value === 'bigint' ? `BigInt⟪${value}⟫` : `Number⟪${value}⟫`;
export const TAG_UNDEFINED = '⟪undefined⟫';
const TAG_NATIVE_FUNCTION = 'ƒ⟪native⟫';
const TAG_RECURRING_ARRAY = (id: string) => `0x${id}: [♻️]`;
const TAG_RECURRING_OBJECT = (id: string) => `0x${id}: {♻️}`;
const TAG_RECURRING_SET = (id: string) => `0x${id}: Set[♻️]`;
const TAG_RECURRING_MAP = (id: string) => `0x${id}: Map{♻️}`;
const TAG_UNSERIALIZABLE = (id: string) => `0x${id}: ⟪unserializable⟫`;
const TAG_SYMBOL = (name: string, id: string) => `0x${id}: ${name}`;

type TInstanceBadgeTag = (id: string) => string;
type TSymbolBadgeTag = (symbolName: string, symbolId: string) => string;
interface ICatalogRecord {
  name: string;
  seen: boolean;
}
interface ISerializeToObject {
  [key: string | symbol]: unknown;
}
interface IFunction {
  name: string;
  toString: () => string;
}
interface IHasToJSON {
  toJSON: () => unknown;
}

export function cloneObjectSafely(value: unknown): unknown {
  let catalog: ObjectsCatalog | null = new ObjectsCatalog();
  let rv;
  try {
    rv = recursiveClone(catalog, value);
  } catch (error) {
    rv = stringifyError(error);
  }
  catalog.clear();
  catalog = null;

  return rv;
}

class ObjectsCatalog {
  #records: Map<unknown, ICatalogRecord>;
  #instanceCounter = 0;

  constructor() {
    this.#records = new Map();
  }

  clear() {
    this.#records.clear();
  }

  #counterToString(counter: number): string {
    return counter.toString(16).padStart(4, '0');
  }

  lookup(
    value: unknown,
    badge: TInstanceBadgeTag | TSymbolBadgeTag,
  ): ICatalogRecord {
    let record = this.#records.get(value);

    if (!record) {
      ++this.#instanceCounter;
      const id = this.#counterToString(this.#instanceCounter);
      record = {
        name: isSymbol(value)
          ? (badge as TSymbolBadgeTag)(value.toString(), id)
          : (badge as TInstanceBadgeTag)(id),
        seen: false,
      };
      this.#records.set(value, record);
    }

    return record;
  }
}

function recursiveClone(catalog: ObjectsCatalog, value: unknown): unknown {
  let rv = value;

  if (isUnserializable(value)) {
    const { name } = catalog.lookup(value, TAG_UNSERIALIZABLE);
    rv = name;
  } else if (isFunction(value)) {
    rv = serializeFunction(value);
  } else if (isSymbol(value)) {
    const { name } = catalog.lookup(value, TAG_SYMBOL);
    rv = name;
  } else if (isArray(value)) {
    rv = serializeArrayAlike(catalog, value, TAG_RECURRING_ARRAY);
  } else if (isSet(value)) {
    rv = serializeArrayAlike(catalog, value, TAG_RECURRING_SET);
  } else if (isMap(value)) {
    rv = serializeMap(catalog, value);
  } else if (isObject(value)) {
    rv = serializeObject(catalog, <ISerializeToObject> value);
  } else if (isNumericSpecials(value)) {
    rv = TAG_NUMERIC(value);
  } else if (value === undefined) {
    rv = TAG_UNDEFINED;
  }

  return rv;
}

function isNumericSpecials(value: unknown): value is bigint | number {
  return (
    typeof value === 'bigint' ||
    Number.isNaN(value) ||
    value === -Infinity ||
    value === Infinity
  );
}

function serializeArrayAlike(
  catalog: ObjectsCatalog,
  value: unknown[] | Set<unknown>,
  badge: TInstanceBadgeTag,
): unknown[] | string {
  const record = catalog.lookup(value, badge);
  let rv;

  if (record.seen) {
    rv = record.name;
  } else {
    record.seen = true;
    const arr = [];

    for (const v of value) {
      arr.push(recursiveClone(catalog, v));
    }

    rv = arr;
  }

  return rv;
}

function serializeMap(
  catalog: ObjectsCatalog,
  value: Map<unknown, unknown>,
): unknown {
  const record = catalog.lookup(value, TAG_RECURRING_MAP);
  let rv;

  if (record.seen) {
    rv = record.name;
  } else {
    record.seen = true;
    const obj = {} as ISerializeToObject;

    for (const [k, v] of value) {
      const newKey = serializeMapKey(catalog, k);
      const newValue = recursiveClone(catalog, v);

      obj[newKey] = newValue;
    }

    rv = obj;
  }

  return rv;
}

function serializeMapKey(catalog: ObjectsCatalog, key: unknown): string {
  let rv;

  if (isUnserializable(key)) {
    const { name } = catalog.lookup(key, TAG_UNSERIALIZABLE);
    rv = name;
  } else if (isFunction(key)) {
    rv = serializeFunction(key);
  } else if (isSymbol(key)) {
    const { name } = catalog.lookup(key, TAG_SYMBOL);
    rv = name;
  } else if (isArray(key)) {
    const { name } = catalog.lookup(key, TAG_RECURRING_ARRAY);
    rv = name;
  } else if (isSet(key)) {
    const { name } = catalog.lookup(key, TAG_RECURRING_SET);
    rv = name;
  } else if (isMap(key)) {
    const { name } = catalog.lookup(key, TAG_RECURRING_MAP);
    rv = name;
  } else if (isObject(key)) {
    const { name } = catalog.lookup(key, TAG_RECURRING_OBJECT);
    rv = name;
  } else if (isNumericSpecials(key)) {
    rv = TAG_NUMERIC(key);
  } else if (key === undefined) {
    rv = TAG_UNDEFINED;
  } else {
    rv = String(key);
  }

  return rv;
}

function serializeObject(
  catalog: ObjectsCatalog,
  value: ISerializeToObject,
): unknown {
  const record = catalog.lookup(value, TAG_RECURRING_OBJECT);
  let rv;

  if (record.seen) {
    rv = record.name;
  } else {
    record.seen = true;

    if (isSelfSerializableObject(value)) {
      const newValue = serializeSelfSerializable(value);
      rv = recursiveClone(catalog, newValue);
    } else {
      const obj = {} as ISerializeToObject;
      const ownKeys = Reflect.ownKeys(value);

      for (const key of ownKeys) {
        let newKey, newValue;

        if (isSymbol(key)) {
          const { name } = catalog.lookup(key, TAG_SYMBOL);
          newKey = name;
        } else {
          newKey = key;
        }

        try {
          // accessing value by key may throw
          newValue = recursiveClone(catalog, value[key]);
        } catch (error) {
          newValue = stringifyError(error);
        }

        obj[newKey] = newValue;
      }

      rv = obj;
    }
  }

  return rv;
}

function serializeFunction(value: IFunction): string {
  const fnBody = value.toString();

  if (fnBody.endsWith('{ [native code] }')) {
    return TAG_NATIVE_FUNCTION;
  } else {
    return TAG_FUNCTION(value.name);
  }
}

function serializeSelfSerializable(value: IHasToJSON) {
  let rv;

  try {
    // rogue object may throw
    rv = value.toJSON();
  } catch (error) {
    rv = stringifyError(error);
  }

  return rv;
}

function stringifyError(error: unknown) {
  return typeof error?.toString === 'function'
    ? TAG_EXCEPTION(error.toString())
    : TAG_EXCEPTION_FALLBACK;
}

function isArray(that: unknown): that is unknown[] {
  return (
    that instanceof Array ||
    that instanceof Uint8Array ||
    that instanceof Uint8ClampedArray ||
    that instanceof Uint16Array ||
    that instanceof Uint32Array ||
    that instanceof Int8Array ||
    that instanceof Int16Array ||
    that instanceof Int32Array ||
    that instanceof Float16Array ||
    that instanceof Float32Array ||
    that instanceof Float64Array ||
    that instanceof BigUint64Array ||
    that instanceof BigInt64Array
  );
}

function isFunction(that: unknown): that is IFunction {
  return (
    typeof that === 'function' &&
    'toString' in that &&
    typeof that.toString === 'function'
  );
}

function isSet(that: unknown): that is Set<unknown> {
  return that instanceof Set;
}

function isMap(that: unknown): that is Map<unknown, unknown> {
  return that instanceof Map;
}

function isSelfSerializableObject(that: unknown): that is IHasToJSON {
  let rv;

  try {
    rv = that !== null &&
      typeof that === 'object' &&
      'toJSON' in that &&
      typeof that.toJSON === 'function';
  } catch (_ignore) {
    rv = false;
  }

  return rv;
}

function isUnserializable(that: unknown): boolean {
  return that instanceof Element || that instanceof Document;
}

function isSymbol(that: unknown): that is symbol {
  return typeof that === 'symbol';
}

function isObject(that: unknown): that is object {
  return (that !== null && typeof that === 'object') || that instanceof Object;
}
