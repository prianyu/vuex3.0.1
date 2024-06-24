// Credits: borrowed code from fcomb/redux-logger
// Logger插件

import { deepCopy } from '../util'

// 创建日志插件
export default function createLogger({
  collapsed = true, // 自动展开记录的mutation
  // 需要被记录的mutation过滤器
  // 接收当前触发的mutation，上一次的state和当前state
  filter = (mutation, stateBefore, stateAfter) => true,
  transformer = state => state, // 在开始记录之前返回的state
  mutationTransformer = mut => mut, //格式化要记录的mutation格式
  logger = console // 日志记录器实现，默认值console
} = {}) {
  return store => {
    // 记录上一次state
    let prevState = deepCopy(store.state)

    // 定于mutation订阅
    store.subscribe((mutation, state) => {
      if (typeof logger === 'undefined') { // logger未定义，则不记录日志
        return
      }
      // 记录当前的state
      const nextState = deepCopy(state)

      if (filter(mutation, prevState, nextState)) { // 需要记录
        const time = new Date() // 时间
        // 格式化后的时间 @00:00:00.000
        const formattedTime = ` @ ${pad(time.getHours(), 2)}:${pad(time.getMinutes(), 2)}:${pad(time.getSeconds(), 2)}.${pad(time.getMilliseconds(), 3)}`
        const formattedMutation = mutationTransformer(mutation) //格式化后的mutation
        const message = `mutation ${mutation.type}${formattedTime}` // 日志消息
        // 日志分组
        const startMessage = collapsed
          ? logger.groupCollapsed
          : logger.group

        // render
        try {
          // 记录日志
          startMessage.call(logger, message)
        } catch (e) {
          console.log(message)
        }

        // 记录日志
        logger.log('%c prev state', 'color: #9E9E9E; font-weight: bold', transformer(prevState)) // 上一次state
        logger.log('%c mutation', 'color: #03A9F4; font-weight: bold', formattedMutation) // 格式化后的mutation
        logger.log('%c next state', 'color: #4CAF50; font-weight: bold', transformer(nextState)) // 格式化后的state

        try {
          // 分组结束
          logger.groupEnd()
        } catch (e) {
          logger.log('—— log end ——')
        }
      }

      // 更新上一次的state
      prevState = nextState
    })
  }
}

// 重复拼接指定长度字符串
function repeat(str, times) {
  return (new Array(times + 1)).join(str)
}

// 重复拼接指定长度字符串，不够的在前面填充0
function pad(num, maxLength) {
  return repeat('0', maxLength - num.toString().length) + num
}
