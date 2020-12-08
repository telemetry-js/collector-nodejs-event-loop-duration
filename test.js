'use strict'

const test = require('tape')
const proxyquire = require('proxyquire')
const senseSpies = []

const plugin = proxyquire('.', {
  'event-loop-stats': {
    sense () {
      const stats = new MockStats()
      senseSpies.shift()(stats)
      return stats
    }
  }
})

test('basic', async function (t) {
  t.plan(2)

  const collector = plugin()

  senseSpies.push((stats) => {
    stats.min = 1
    stats.max = 5
    stats.sum = 6
    stats.num = 2
  })

  t.same(await collect(collector), [{
    name: 'telemetry.nodejs.event_loop.duration.ms',
    unit: 'milliseconds',
    resolution: 60,
    tags: {},
    stats: {
      sum: 6,
      min: 1,
      max: 5,
      count: 2
    }
  }])

  senseSpies.push((stats) => {
    stats.min = 2
    stats.max = 2
    stats.sum = 2
    stats.num = 1
  })

  t.same(await collect(collector), [{
    name: 'telemetry.nodejs.event_loop.duration.ms',
    unit: 'milliseconds',
    resolution: 60,
    tags: {},
    stats: {
      sum: 2,
      min: 2,
      max: 2,
      count: 1
    }
  }])
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

function simplify (metric) {
  delete metric.date
  delete metric.statistic

  return metric
}

function MockStats () {
  this.min = 0
  this.max = 0
  this.sum = 0
  this.num = 0
}
