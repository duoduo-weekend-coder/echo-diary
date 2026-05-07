// Node.js v25 has a native localStorage stub that lacks full Storage API (.clear(), etc.)
// Provide a proper in-memory localStorage implementation for tests.
class InMemoryStorage {
  constructor() {
    this._data = {}
  }
  get length() {
    return Object.keys(this._data).length
  }
  key(index) {
    return Object.keys(this._data)[index] ?? null
  }
  getItem(key) {
    return Object.prototype.hasOwnProperty.call(this._data, key) ? this._data[key] : null
  }
  setItem(key, value) {
    this._data[String(key)] = String(value)
  }
  removeItem(key) {
    delete this._data[key]
  }
  clear() {
    this._data = {}
  }
}

global.localStorage = new InMemoryStorage()
global.sessionStorage = new InMemoryStorage()

// Expose fake-indexeddb globals so IDBRequest, IDBKeyRange, etc. are available
import {
  IDBCursor,
  IDBCursorWithValue,
  IDBDatabase,
  IDBFactory,
  IDBIndex,
  IDBKeyRange,
  IDBObjectStore,
  IDBOpenDBRequest,
  IDBRequest,
  IDBTransaction,
  IDBVersionChangeEvent,
} from 'fake-indexeddb'

global.IDBCursor = IDBCursor
global.IDBCursorWithValue = IDBCursorWithValue
global.IDBDatabase = IDBDatabase
global.IDBFactory = IDBFactory
global.IDBIndex = IDBIndex
global.IDBKeyRange = IDBKeyRange
global.IDBObjectStore = IDBObjectStore
global.IDBOpenDBRequest = IDBOpenDBRequest
global.IDBRequest = IDBRequest
global.IDBTransaction = IDBTransaction
global.IDBVersionChangeEvent = IDBVersionChangeEvent
