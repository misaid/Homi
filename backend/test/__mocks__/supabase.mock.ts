// A minimal supabase-js v2 client mock that supports the chains used in the app.
import { randomUUID } from "node:crypto";

type Row = Record<string, any>;
type TableStore = Map<string, Row[]>;
type ErrorMap = Map<string, string>;

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

function likeMatch(value: unknown, pattern: string): boolean {
  if (typeof value !== "string") return false;
  const inner = pattern.replaceAll("%", "").toLowerCase();
  return value.toLowerCase().includes(inner);
}

function toISODateString(d: unknown) {
  if (typeof d === "string") return d;
  if (d instanceof Date) return d.toISOString();
  return String(d);
}

class SelectBuilder {
  private table: string;
  private store: TableStore;
  private selectCount: "exact" | null = null;
  private filters: Array<(row: Row) => boolean> = [];
  private orderBy: { column: string; ascending: boolean } | null = null;
  private rangeFrom: number | null = null;
  private rangeTo: number | null = null;
  private limitCount: number | null = null;
  private errors: { select: ErrorMap };
  private orAny: Array<(row: Row) => boolean> = [];

  constructor(table: string, store: TableStore, errors: { select: ErrorMap }) {
    this.table = table;
    this.store = store;
    this.errors = errors;
  }

  select(_cols?: string, opts?: { count?: "exact" | "planned" | "estimated" }) {
    if (opts?.count === "exact") this.selectCount = "exact";
    return this as any;
  }

  eq(column: string, value: any) {
    this.filters.push((row) => row[column] === value);
    return this as any;
  }

  ilike(column: string, pattern: string) {
    this.filters.push((row) => likeMatch(row[column], pattern));
    return this as any;
  }

  or(expr: string) {
    // expect 'full_name.ilike.%q%,phone.ilike.%q%,email.ilike.%q%'
    const parts = expr.split(",").map((s) => s.trim());
    const preds: Array<(row: Row) => boolean> = [];
    for (const p of parts) {
      const [col, op, pattern] = p.split(".");
      if (op === "ilike") {
        preds.push((row) => likeMatch(row[col], pattern));
      }
    }
    this.orAny = preds;
    return this as any;
  }

  in(column: string, values: any[]) {
    this.filters.push((row) => values.includes(row[column]));
    return this as any;
  }

  gte(column: string, value: any) {
    const cmp = toISODateString(value);
    this.filters.push((row) => toISODateString(row[column]) >= cmp);
    return this as any;
  }

  lte(column: string, value: any) {
    const cmp = toISODateString(value);
    this.filters.push((row) => toISODateString(row[column]) <= cmp);
    return this as any;
  }

  order(column: string, opts?: { ascending?: boolean }) {
    this.orderBy = { column, ascending: opts?.ascending !== false };
    return this as any;
  }

  private compute(): { data: Row[]; count: number } {
    if (this.errors.select.has(this.table)) {
      throw new Error(this.errors.select.get(this.table)!);
    }
    const data = clone(this.store.get(this.table) || []);
    let filtered = data.filter((row) => this.filters.every((f) => f(row)));
    if (this.orAny.length > 0) {
      filtered = filtered.filter((row) => this.orAny.some((p) => p(row)));
    }
    if (this.orderBy) {
      const { column, ascending } = this.orderBy;
      filtered.sort((a, b) => {
        const av = a[column];
        const bv = b[column];
        return ascending
          ? av > bv
            ? 1
            : av < bv
            ? -1
            : 0
          : av > bv
          ? -1
          : av < bv
          ? 1
          : 0;
      });
    }
    const total = filtered.length;
    let sliced = filtered;
    if (this.rangeFrom !== null && this.rangeTo !== null) {
      sliced = filtered.slice(this.rangeFrom, this.rangeTo + 1);
    }
    return { data: sliced, count: total };
  }

  range(from: number, to: number) {
    this.rangeFrom = from;
    this.rangeTo = to;
    return this as any;
  }

  limit(n: number) {
    this.limitCount = n;
    return this as any;
  }

  single() {
    const { data } = this.compute();
    if (data.length === 0) {
      return Promise.resolve({
        data: null,
        error: { message: "Row not found" } as any,
      });
    }
    return Promise.resolve({ data: data[0], error: null });
  }

  // Thenable so that awaiting the builder yields the computed result
  then(onFulfilled: any, onRejected?: any) {
    try {
      const { data, count } = this.compute();
      const res: any = { data, error: null };
      if (this.selectCount === "exact") res.count = count;
      return Promise.resolve(onFulfilled(res));
    } catch (err) {
      if (onRejected) return Promise.resolve(onRejected(err));
      return Promise.reject(err);
    }
  }

  // Write methods return separate builders

  insert(values: Row | Row[]) {
    const rows = Array.isArray(values) ? values : [values];
    const inserted: Row[] = rows.map((r) => {
      const id = r.id || randomUUID();
      const row = { ...r, id };
      return row;
    });
    const existing = this.store.get(this.table) || [];
    this.store.set(this.table, [...existing, ...inserted]);

    const thenable = {
      then(onFulfilled: any) {
        return onFulfilled({ data: inserted, error: null });
      },
      select() {
        return {
          single() {
            return Promise.resolve({
              data: inserted[0],
              error: null,
            });
          },
        };
      },
    };
    return thenable as any;
  }

  update(values: Row) {
    const self = this;
    // capture current filters for update
    const updater = {
      select() {
        return {
          single() {
            const tableRows = self.store.get(self.table) || [];
            const idx = tableRows.findIndex((row) =>
              self.filters.every((f) => f(row))
            );
            if (idx === -1) {
              return Promise.resolve({
                data: null,
                error: { message: "Row not found" } as any,
              });
            }
            const updated = { ...tableRows[idx], ...values };
            const copy = [...tableRows];
            copy[idx] = updated;
            self.store.set(self.table, copy);
            return Promise.resolve({ data: updated, error: null });
          },
        };
      },
    };
    return updater as any;
  }

  delete() {
    const self = this;
    return {
      then(onFulfilled: any) {
        const tableRows = self.store.get(self.table) || [];
        const remaining = tableRows.filter(
          (row) => !self.filters.every((f) => f(row))
        );
        self.store.set(self.table, remaining);
        return onFulfilled({ data: null, error: null });
      },
    } as any;
  }
}

class StorageBucket {
  private bucket: string;
  private storageErrors: { upload: string | null; signed: string | null };
  constructor(
    bucket: string,
    storageErrors: { upload: string | null; signed: string | null }
  ) {
    this.bucket = bucket;
    this.storageErrors = storageErrors;
  }
  upload(path: string, _file: any, _opts: any) {
    if (this.storageErrors.upload) {
      return Promise.resolve({
        data: null,
        error: { message: this.storageErrors.upload } as any,
      });
    }
    return Promise.resolve({ data: { path }, error: null });
  }
  createSignedUrl(path: string, _expiresIn: number) {
    if (this.storageErrors.signed) {
      return Promise.resolve({
        data: null,
        error: { message: this.storageErrors.signed } as any,
      });
    }
    const signedUrl = `https://cdn.test/${this.bucket}/${encodeURIComponent(
      path
    )}?sig=fake`;
    return Promise.resolve({ data: { signedUrl }, error: null });
  }
  getPublicUrl(path: string) {
    const publicUrl = `https://cdn.test/${this.bucket}/${encodeURIComponent(
      path
    )}`;
    return { data: { publicUrl } } as any;
  }
}

export const supabaseMockState = (() => {
  const store: TableStore = new Map();
  const selectErrors: ErrorMap = new Map();
  const insertErrors: ErrorMap = new Map();
  const storageErrors = {
    upload: null as string | null,
    signed: null as string | null,
  };

  function reset() {
    store.clear();
    selectErrors.clear();
    insertErrors.clear();
    storageErrors.upload = null;
    storageErrors.signed = null;
  }

  function setTable(table: string, rows: Row[]) {
    store.set(table, clone(rows));
  }

  function setSelectError(table: string, msg: string) {
    selectErrors.set(table, msg);
  }

  function setInsertError(table: string, msg: string) {
    insertErrors.set(table, msg);
  }

  function setStorageUploadError(msg: string) {
    storageErrors.upload = msg;
  }

  function setStorageSignedError(msg: string) {
    storageErrors.signed = msg;
  }

  return {
    store,
    selectErrors,
    insertErrors,
    storageErrors,
    reset,
    setTable,
    setSelectError,
    setInsertError,
    setStorageUploadError,
    setStorageSignedError,
  };
})();

export function createFakeSupabaseClient() {
  return {
    from(table: string) {
      const base = new SelectBuilder(table, supabaseMockState.store, {
        select: supabaseMockState.selectErrors,
      });
      const origInsert = (base as any).insert.bind(base);
      (base as any).insert = (values: Row | Row[]) => {
        if (supabaseMockState.insertErrors.has(table)) {
          const thenable = {
            then(onFulfilled: any) {
              return onFulfilled({
                data: null,
                error: { message: supabaseMockState.insertErrors.get(table)! },
              });
            },
            select() {
              return {
                single() {
                  return Promise.resolve({
                    data: null,
                    error: {
                      message: supabaseMockState.insertErrors.get(table)!,
                    } as any,
                  });
                },
              };
            },
          };
          return thenable as any;
        }
        return origInsert(values);
      };
      return base as any;
    },
    storage: {
      from(bucket: string) {
        return new StorageBucket(
          bucket,
          supabaseMockState.storageErrors
        ) as any;
      },
    },
  } as any;
}
