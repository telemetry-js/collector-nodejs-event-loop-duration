'use strict'

const test = require('tape')
const crypto = require('crypto')
const plugin = require('.')

test('real', async function (t) {
  t.plan(3)

  const collector = plugin()
  await slowTicks(10)

  const metric = (await collect(collector))[0]

  t.ok(metric.stats.sum > 0, 'has sum')
  t.ok(metric.stats.max > 0, 'has max')
  t.ok(metric.stats.count > 0, 'has count')
})

function collect (collector) {
  return new Promise((resolve, reject) => {
    const metrics = []
    const push = metrics.push.bind(metrics)

    collector.on('metric', push)

    collector.ping((err) => {
      collector.removeListener('metric', push)
      if (err) reject(err)
      else resolve(metrics.map(simplify))
    })
  })
}

function slowTicks (ticks) {
  let n = 0

  return new Promise((resolve) => {
    function next () {
      if (n++ >= ticks) return resolve()
      crypto.randomFillSync(Buffer.alloc(1e6))
      setImmediate(next)
    }

    next()
  })
}

function simplify (metric) {
  delete metric.date
  delete metric.statistic

  return metric
}
