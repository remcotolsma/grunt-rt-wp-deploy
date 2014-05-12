/*
 * grunt-rt-wp-deploy
 * https://github.com/remcotolsma/grunt-rt-wp-deploy
 *
 * Copyright (c) 2014 Remco Tolsma
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function( grunt ) {
	// Please see the Grunt documentation for more information regarding task
	// creation: http://gruntjs.com/creating-tasks
	var cp = require( 'child_process' );
	var path = require( 'path' );

	grunt.registerMultiTask( 'rt_wp_deploy', 'Deploys a build directory to the WordPress SVN repo.', function() {
		var done = this.async();

		// Merge task-specific and/or target-specific options with these defaults.
		var options = this.options( {
			svnUrl: false,
			svnDir: 'svn',
			svnUsername: false,
			deployDir: 'deploy',
			version: false
		} );

		// @see http://nodejs.org/api/path.html
		var svnDir      = path.resolve( options.svnDir );
		var svnTrunkDir = svnDir + '/trunk';
		var svnTagDir   = svnDir + '/tags/' + options.version;

		var deployDir = path.resolve( options.deployDir );

		// Subversion checkout
		grunt.log.writeln( 'Subversion checkout...' );
		
		var svnArgs = function( args ) {
			if ( options.svnUsername ) {
				args.push( '--username' );
				args.push( options.svnUsername );
			}
			
			return args;
		};

		var svnUpdate = function() {
			// Subversion update
			grunt.log.writeln( 'Subversion update...' );

			grunt.util.spawn( { cmd: 'svn', args: svnArgs( ['update'] ), opts: {stdio: 'inherit',cwd: svnDir} }, function(error, result, code) {
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
	
					grunt.util.spawn({cmd: 'svn',args: ['add','.','--force','--auto-props','--parents','--depth','infinity'],opts: {stdio: 'inherit',cwd: svnDir}}, function(error, result, code) {
						grunt.log.writeln( 'Subversion add done.' );
	
						// Subversion remove
						grunt.log.writeln( 'Subversion remove...' );
	
						cp.exec( "svn rm $( svn status | sed -e '/^!/!d' -e 's/^!//' )", { cwd: options.svnDir }, function() {
							grunt.log.writeln( 'Subversion remove done.' );
	
							// Subversion tag
							grunt.log.writeln( 'Check if Subversion tag dir exists...' );

							if ( grunt.file.isDir( svnTagDir ) ) {
								grunt.log.writeln( 'Subversion tag already exists.' );
								
								svnCommit();
							} else {
								grunt.log.writeln( 'Subversion tag...' );
	
								grunt.util.spawn({cmd: 'svn',args: ['copy',svnTrunkDir,svnTagDir],opts: {stdio: 'inherit', cwd: options.svnDir}},  function(error, result, code) {
									grunt.log.writeln( 'Subversion tag done' );
	
									svnCommit();
								} );
							}
						} );
					} );
				} );
			} );
		};
		
		var svnCommit = function() {
			var commitMessage = 'Deploy from Git (' + options.version + ')';

			grunt.log.writeln( 'Subversion commit...' );

			grunt.util.spawn({cmd: 'svn',args: svnArgs( ['commit','-m',commitMessage] ),opts: {stdio: 'inherit', cwd: options.svnDir}},  function(error, result, code) {
				grunt.log.writeln( 'Subversion commit done.' );

				done();
			} );
		};
		
		grunt.log.writeln( 'Check if Subversion dir exists...' );

		if ( grunt.file.isDir( svnDir ) ) {
			grunt.log.writeln( 'Subversion dir exists.' );
			
			svnUpdate();
		} else {
			grunt.log.writeln( 'Subversion dir does not exists.' );

			grunt.log.writeln( 'Subversion checkout...' );

			grunt.util.spawn({cmd: 'svn', args: svnArgs( ['checkout',options.svnUrl,options.svnDir] ), opts: {stdio: 'inherit'}}, function(error, result, code) {
				grunt.log.writeln( 'Subversion checkout done.' );
				
				svnUpdate();
			} );
		}
	} );
};
