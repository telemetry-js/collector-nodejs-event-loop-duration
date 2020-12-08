'use strict'

const eventLoopStats = require('event-loop-stats')
const summary = require('@telemetry-js/metric').summary
const EventEmitter = require('events').EventEmitter

module.exports = function plugin () {
  return new EventLoopDurationCollector()
}

class EventLoopDurationCollector extends EventEmitter {
  constructor () {
    super()

    this._metricOptions = {
      unit: 'milliseconds',
      stats: {
        sum: 0,
        min: Number.POSITIVE_INFINITY,
        max: Number.NEGATIVE_INFINITY,
        count: 0
      }
    }
  }

  start (callback) {
    // NOTE: event-loop-stats does not expose start/stop methods, it's continuous.
    process.nextTick(callback)
  }

  stop (callback) {
    // NOTE: event-loop-stats does not expose start/stop methods, it's continuous.
    process.nextTick(callback)
  }

  ping (callback) {
    const theirs = eventLoopStats.sense()
    const ours = this._metricOptions.stats

    // Convert summary from event-loop-stats format to telemetry format
    ours.sum = theirs.sum
    ours.min = theirs.min
    ours.max = theirs.max
    ours.count = theirs.num

    // TODO: reuse metric objects between pings
    const metric = summary('telemetry.nodejs.event_loop.duration.ms', this._metricOptions)
    this.emit('metric', metric)

    // No need to dezalgo ping()
    callback()
  }
}
