module.exports = function (grunt) {
  var q = require('q'),
      path = require('path'),
      exec = require('child_process').exec;

  grunt.registerTask('compareShas', 'Run tests against two SHAs', function (sha1, sha2) {
    var GIT_FOLDER = 'angular.js';
    var done = this.async();

    stepThrough(sha1);

    function stepThrough (sha) {
      checkForClone(sha)
      .then(checkoutSHA)
      .then(packageBuild)
      .then(copyBuild)
      //        .then(generateKarma)
      //        .then(repeat);
    }

    function checkForClone (sha) {
      var deferred = q.defer();
      grunt.log.writeln('Step 1: Check to see if a private copy of the repo exists');

      process.nextTick(function () {
        if (!grunt.file.isDir(GIT_FOLDER)) {
          grunt.log.writeln('Creating clone of angular.js repo');
          grunt.util.spawn({
cmd: 'git',
              args: ['clone', 'https://github.com/angular/angular.js']
          },
          function () {
            deferred.resolve(sha);
          });
        }
        else {
          grunt.log.writeln('angular.js repo already exists. (this is a good thing)');
          deferred.resolve(sha);
        }
      });

      return deferred.promise;
    }

    //Step 3: Package the build
    //Step 4: Copy the build into a temporary directory
    //Step 5: Generate a karma config for testing this sha
    //Repeat process for 2nd sha
    //Should this run the tests?
    //Should this help set up remotes?

    function checkoutSHA (sha) {
      var remote, fullSHA,
          deferred = q.defer(),
          repoPath = path.resolve(GIT_FOLDER);

      if (sha.indexOf('/') !== -1) {
        remote = sha.split('/')[0];
        fullSHA = sha.split('/')[1];
      }
      else {
        fullSHA = sha;
        remote = 'origin';
      }

      grunt.log.writeln('Step 2: Preparing to checkout sha', sha, 'to build a copy');

      process.nextTick(function () {
        grunt.log.writeln('Fetching remote...');
        grunt.util.spawn({
            cmd: 'git',
            args: ['fetch', remote],
            opts: {cwd: repoPath}
          },
          function () {
            grunt.log.writeln('Checking out SHA', fullSHA);
            grunt.util.spawn({
              cmd: 'git',
              args: ['checkout', fullSHA],
              opts: {cwd: repoPath}
            },
            function (err, result, code) {
              grunt.log.writeln('Done checkout: ', err, result, code);
              deferred.resolve(sha);
            });
          });
      });

      return deferred.promise;
    }

    function packageBuild (sha) {
      var deferred = q.defer();

      grunt.log.writeln('Step 3: Package build');

      process.nextTick(function () {
        //Important if it's a fresh clone. 
        //Otherwise the package process would
        //Automatically npm install
        grunt.log.writeln('Installing npm dependencies...');
        grunt.util.spawn({
          cmd: 'npm',
          args: ['install'],
          opts: {cwd: path.resolve(GIT_FOLDER)}
        }, 
        function () {
          grunt.log.writeln('Running grunt package...');
          grunt.util.spawn({
            cmd: 'grunt',
            args: ['package'],
            opts: {cwd: path.resolve(GIT_FOLDER)}
          },
          function () {
            deferred.resolve(sha);
          });
        });
      });

      return deferred.promise;
    }

    function copyBuild (sha) {
      grunt.log.writeln('Step 4: Copy the build to a new directory.');
      done();
    }

    function generateKarma (sha) {
    }

    function repeat (sha) {
      if (sha === sha1) {
        stepThrough(sha2);
       }
      else {
        done();
      }
    }
  });

  grunt.registerTask('benchmark', 'Run the benchmarks and generate a report',
    function() {
      var done = this.async();

      process.nextTick(function () {
        exec('echo "var results =" >report/sampleTimes.js &&' +
            ' /usr/local/google/gits/nvm/v0.8.11/bin/node node_modules/karma/bin/karma run |' +
            ' grep XXX: | sed -e "s/^.*XXX:[^{]*{\\(.*\\)}\'.*$/{\\1}/" >> report/sampleTimes.js', function() {
          done();
        });
      });
    });
}
