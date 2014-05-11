/*
 * grunt-rt-wp-deploy
 * https://github.com/remcotolsma/grunt-rt-wp-deploy
 *
 * Copyright (c) 2014 Remco Tolsma
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

  // Please see the Grunt documentation for more information regarding task
  // creation: http://gruntjs.com/creating-tasks
  var cp = require('child_process');
  var path = require('path') ;

  // @see http://gruntjs.com/creating-plugins
  // @see https://github.com/stephenharris/grunt-wp-deploy/blob/master/tasks/wp_deploy.js
  // @see http://gruntjs.com/api/grunt.file

  grunt.registerMultiTask('rt_wp_deploy', 'Deploys a build directory to the WordPress SVN repo.', function() {
    var done = this.async();

    // Merge task-specific and/or target-specific options with these defaults.
    var options = this.options({
      svnUrl: false,
      svnDir: false,
      deployDir: false
	});

    // @see http://nodejs.org/api/path.html
    var svnDir = path.resolve( options.svnDir );
    var deployDir = path.resolve( options.deployDir )

    // Subversion checkout
    grunt.log.writeln( 'Subversion checkout...' );

    var process = cp.execFile( 'svn', ['checkout',options.svnUrl,options.svnDir], {}, function(error,stdout,stderr) {
      grunt.log.writeln( 'Subversion checkout done.' );

      // Subversion update
      grunt.log.writeln( 'Subversion update...' );

      cp.execFile( 'svn', ['update'], { cwd: options.svnDir }, function(error,stdout,stderr) {
        grunt.log.writeln( 'Subversion update done.' );
        
        // Delete trunk
        var svnTrunkDir = svnDir + '/trunk';

        grunt.log.writeln('Delete Subversion trunk');

        grunt.file.delete( svnTrunkDir );
        
        // Copy deploy to trunk
        //grunt.file.copy( deployDir, svnTrunkDir );
        
        grunt.log.writeln( 'Copy...');
        cp.execFile( 'cp', ['-R',deployDir,svnTrunkDir], function(error,stdout,stderr) {
        	grunt.log.writeln( 'Copy done');

            // Subverion add
            grunt.log.writeln( 'Subversion add...' );

            cp.exec( 'svn add --force * --auto-props --parents --depth infinity -q', { cwd: options.svnDir }, function() {
                grunt.log.writeln( 'Subversion add done' );

                // Subversion remove
                grunt.log.writeln( 'Subversion remove...' );

                cp.exec( "svn rm $( svn status | sed -e '/^!/!d' -e 's/^!//' )", { cwd: options.svnDir }, function() {
                	grunt.log.writeln( 'Subversion remove done' );
                	
                	grunt.log.writeln( 'Subversion tag...' );

                	cp.execFile( 'svn', ['copy','trunk','tags/2.0.0'], { cwd: options.svnDir },  function(error,stdout,stderr) {
                		grunt.log.writeln( 'Subversion tag done' );

                		done();
                	});
                });
            });
        });

      });
    });	
  });
};
