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
	var svnTrunkDir = svnDir + '/trunk';
    var deployDir = path.resolve( options.deployDir );

    // Subversion checkout
    grunt.log.writeln( 'Subversion checkout...' );

    grunt.util.spawn({cmd: 'svn', args: ['checkout',options.svnUrl,options.svnDir,'--username', 'info@remcotolsma.nl'], opts: {stdio: 'inherit'}}, function(error, result, code) {
    	grunt.log.writeln( 'Subversion checkout done.' );

        // Subversion update
        grunt.log.writeln( 'Subversion update...' );

        grunt.util.spawn( { cmd: 'svn', args: ['update','--username', 'info@remcotolsma.nl'], opts: {stdio: 'inherit',cwd: svnDir} }, function(error, result, code) {
        	grunt.log.writeln( 'Subversion update done.' );

        	// Delete trunk
        	grunt.file.delete( svnTrunkDir );

        	grunt.log.writeln( 'Subversion trunk deleted.' );

        	// Copy deploy to trunk
            grunt.log.writeln( 'Copy deploy to trunk...');

        	grunt.util.spawn( { cmd: 'cp', args: ['-R',deployDir,svnTrunkDir], opts: {stdio: 'inherit'} }, function(error, result, code) {
            	grunt.log.writeln( 'Copy deploy to trunk done' );

                // Subverion add
                grunt.log.writeln( 'Subversion add...' );

                grunt.util.spawn({cmd: 'svn',args: ['add','--force','.','--auto-props','--parents','--depth','infinity'],opts: {stdio: 'inherit',cwd: svnDir}}, function(error, result, code) {
                  grunt.log.writeln( 'Subversion add done.' );

                  // Subversion remove
                  grunt.log.writeln( 'Subversion remove...' );

                  cp.exec( "svn rm $( svn status | sed -e '/^!/!d' -e 's/^!//' )", { cwd: options.svnDir }, function() {
                	  grunt.log.writeln( 'Subversion remove done.' );

                	  // Subversion tag
                	  grunt.log.writeln( 'Subversion tag...' );

                	  grunt.util.spawn({cmd: 'svn',args: ['copy','trunk','tags/2.0.0'],opts: {stdio: 'inherit', cwd: options.svnDir}},  function(error, result, code) {
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
