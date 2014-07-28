(function(window, angular, undefined) {

  'use strict';

  /**
   * @ngdoc overview
   * @name ngAsyncHooks
   * @description
   * # ngAsyncHooks
   *
   * Provides placement for async hooks to happen from
   * external modules with a promise based system.
   */
  angular.module('ngAsyncHooks', [])
  .factory('asyncHooks', function($q, $timeout) {

    var m = {},
      tasks = [];

    function AsyncHook(event, callback, parallel) {

      parallel = typeof parallel === "boolean" ? parallel : true;

      this.event = event;
      this.callback = callback;
      this.parallel = parallel;
    }

    /**
     * Wrap callbacks to check they were created properly
     * for better error reporting.
     * @param  {function} callback The callback to wrap
     * @return {promise}           Returns the callback which should be a promise
     */
    function wrapCallback(callback) {
      return function() {
        var c = callback();
        if (typeof c.then !== "function") {
          throw new Error("callbacks must return a deferred.promise.");
        }
        return c;
      }
    }

    function performSeries(series) {

      var deferred = $q.defer(),
        hookChain;

      // let hookChain have a "then"
      hookChain = deferred.promise;

      // build then hook chain -- wrap each callback for additional error checking
      series.forEach(function(hook) {
        hookChain = hookChain.then(wrapCallback(hook.callback));
      });

      // immediately resolve first hookChain
      deferred.resolve();

      // return the end of the hookChain
      return hookChain;
    }

    function performParallel(parallelHooks) {

      var deferred = $q.defer(),
        promises = [];

      // call each parallel event immediately
      parallelHooks.forEach(function(hook) {
        promises.push(hook.callback());
      })

      // resolve when all parallel hook promises are done
      $q.all(promises).then(function() {
        deferred.resolve();
      })
      .catch(function(error) {
        deferred.reject(error);
      })

      return deferred.promise;
    }

    m.getHooksFor = function(event) {

      var hooks = {
        parallel: [],
        series: []
      }

      tasks.forEach(function(task) {
        if (task.event === event) {
          if (task.parallel === true) {
            hooks.parallel.push(task);
          }
          else {
            hooks.series.push(task);
          }
        }
      })

      return hooks;

    }

    m.on = function(event, callback, parallel) {
      tasks.push(new AsyncHook(event, callback, parallel));
    }

    m.once = function(event, callback, parallel) {
      // TODO m.on + remove after called once
    }

    m.do = function(event) {

      var hooks = m.getHooksFor(event),
        deferred = $q.defer(),
        promiseSeries = performSeries(hooks.series),
        promiseParallel = performParallel(hooks.parallel);

      // when parallel and series promises are complete, resolve the overall hook promise
      $q.all([promiseSeries, promiseParallel]).then(function(a,b) {
        deferred.resolve();
      })
      .catch(function(error) {
        console.error(error);
        deferred.reject(error);
      })

      return deferred.promise;
    }

    // for use in "then" chains, simply wrap do in a callback
    m.then = function(event) {
      return function() {
        return m.do(event);
      }
    }

    return m;

  });

})(window, window.angular);
