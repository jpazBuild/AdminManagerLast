import { faker } from '@faker-js/faker';

const FAKER_ANY_RE = /^faker\./;
const FAKER_INLINE_ANY_RE = /\{\{\s*([^}]+)\s*\}\}/g;

const tryEvalFakerExpression = (expr: string): unknown => {
  try {
    if (!FAKER_ANY_RE.test(expr.trim())) return undefined;
    const fn = new Function('faker', `return (${expr});`);
    return fn(faker);
  } catch {
    return undefined;
  }
}

const stringifyResult = (res: unknown): string => {
  if (typeof res === 'string') return res;
  if (typeof res === 'number' || typeof res === 'boolean') return String(res);
  if (res == null) return '';
  try {
    return JSON.stringify(res);
  } catch {
    return String(res);
  }
}

const resolveStringFaker = (value: string): unknown => {
  const v = value.trim();

  if (FAKER_ANY_RE.test(v)) {
    const out = tryEvalFakerExpression(v);
    if (out !== undefined) return stringifyResult(out);
    return value;
  }

  if (FAKER_INLINE_ANY_RE.test(v)) {
    return v.replace(FAKER_INLINE_ANY_RE, (_, inner: string) => {
      const trimmed = String(inner).trim();
      if (!FAKER_ANY_RE.test(trimmed)) return inner;
      const out = tryEvalFakerExpression(trimmed);
      return stringifyResult(out ?? inner);
    });
  }

  return value;
}

export const resolveFakerInData = <T = any>(data: T): T => {
  if (data == null) return data;

  if (typeof data === 'string') {
    return resolveStringFaker(data) as T;
  }

  if (Array.isArray(data)) {
    return data.map(item => resolveFakerInData(item)) as T;
  }

  if (typeof data === 'object') {
    const out: any = Array.isArray(data) ? [] : {};
    for (const [k, v] of Object.entries<any>(data)) {
      out[k] = resolveFakerInData(v);
    }
    return out;
  }

  return data;
}
