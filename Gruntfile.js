module.exports = function(grunt){
	require('load-grunt-tasks')(grunt);

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		builddir: 'build',
		releasedir: 'release',
		sitedir: 'site',
		meta: {
			banner:
				'/**<%= pkg.name %>\n'+
				'* <%= pkg.description %>\n' +
				'* @version v<%= pkg.version %>\n' +
				'* @link  <%= pkg.homepage %>\n' +
				'* @license MIT License, http://www.opensource.org/licenses/MIT\n'+
				'*/\n'
		},
		clean: [ '<%= builddir %>','<%=sitedir %>'],
		concat:{
			options: {
				banner: '<%=meta.banner\n\n%>' +
					'if (typeof module !== "undefined" && typeof exports !== "undefined" && module.exports === exports){\n'+
					' module.exports = \'visor\';\n'+
					'}\n\n'+
					'(function (window, angular, undefined) {\n',
				footer: '})(window, window.angular);'
			},
			build: {
				src: "src/*.js",
				dest: '<%= builddir %>/<%= pkg.name %>.js'
			}
		},
		uglify: {
			options: {
				banner: '<%= meta.banner %>\n'
			},
			build: {
				files: {
					'<%= builddir %>/<%= pkg.name %>.min.js': ['<banner:meta.banner>', '<%= concat.build.dest %>']
				}
			}
		},
		connect: {
			server: {},
			sample: {
				options:{
					port: 5555,
					keepalive: true
				}
			}
		},
		'gh-pages': {
			options: {
				base: '<%=sitedir%>'
			},
			src: ['**']
		},
		copy: {
			release: {
				files: [{expand:true,src:["visor.js","visor.min.js"],cwd:"<%=builddir%>/",dest:'<%=releasedir%>/'}]
			},
			site: {
				files: [
					{expand:true,src:'<%=releasedir%>/**',dest:'<%=sitedir%>'},
					{expand:true,src:'sample/**',dest:'<%=sitedir%>'}]
			}
		}
	});

	grunt.registerTask('build', 'Perform a normal build', ['concat', 'uglify']);
	grunt.registerTask('dist', 'Perform a clean build', ['clean', 'build','copy:release']);
	grunt.registerTask('release', 'Perform a clean build', ['dist','copy:site','gh-pages']);

}
