angular-async-hooks
===================

This module aims to provide a placeholder for arbitrary code from other modules to process tasks at given points of code, either in series or in parallel.

For example, consider cases where module B requires module A.  If you want module B to perform a series of async tasks at a certain point in module A's code, you may find it difficult to use the event trigger / listener system.

With Async Hooks, you can setup a placeholder for such tasks:

    someService.validateLogin().then(asyncHooks.then('preLogin')).then(function() {
      someService.doLogin();
    });

Here we've provided a placeholder for arbitrary async tasks to complete with the event name `preLogin`.  Your external modules would setup listeners which return a Promise.

    // module B
    asyncHooks.on('preLogin', function() {

      var deferred = $q.defer();
      console.log("series A called");

      $timeout(function() {
        console.log("series A resolved");
        deferred.resolve();
      }, 1000);

      return deferred.promise;

    }, false);
