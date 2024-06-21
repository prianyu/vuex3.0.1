/**
 * Get the first item that pass the test
 * by second argument function
 * 获取第一个匹配的元素
 * @param {Array} list
 * @param {Function} f
 * @return {*}
 */
function find(list, f) {
  return list.filter(f)[0]
}

/**
 * 深度拷贝函数
 * Deep copy the given object considering circular structure.
 * This function caches all nested objects and its copies.
 * If it detects circular structure, use cached copy to avoid infinite loop.
 *
 * @param {*} obj
 * @param {Array<Object>} cache
 * @return {*}
 */
export function deepCopy(obj, cache = []) {
  // just return if obj is immutable value
  // 基础类型直接返回
  if (obj === null || typeof obj !== 'object') {
    return obj
  }

  // if obj is hit, it is in circular structure
  // 循环引用则返回缓存对象
  const hit = find(cache, c => c.original === obj)
  if (hit) {
    return hit.copy
  }

  // 创建拷贝对象（或数组）
  const copy = Array.isArray(obj) ? [] : {}
  // put the copy into cache at first
  // because we want to refer it in recursive deepCopy
  cache.push({
    original: obj,
    copy
  })

  // 遍历对象，递归调用拷贝函数
  Object.keys(obj).forEach(key => {
    copy[key] = deepCopy(obj[key], cache)
  })

  return copy
}

/**
 * forEach for object
 * 对象遍历执行回调
 */
export function forEachValue(obj, fn) {
  Object.keys(obj).forEach(key => fn(obj[key], key))
}

// 是否一个一个Object对象
export function isObject(obj) {
  return obj !== null && typeof obj === 'object'
}

// 是否为thenable对象
export function isPromise(val) {
  return val && typeof val.then === 'function'
}

// 断言失败抛出异常
export function assert(condition, msg) {
  if (!condition) throw new Error(`[vuex] ${msg}`)
}
