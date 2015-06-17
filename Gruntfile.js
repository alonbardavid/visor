module.exports = function (grunt) {
    require('load-grunt-tasks')(grunt);
    grunt.initConfig({
        module_name: 'visor',
        pkg: grunt.file.readJSON('package.json'),
        builddir: 'build',
        releasedir: 'release',
        sitedir: 'site',
        meta: {
            banner: '/**<%= module_name %>\n' +
            '* <%= pkg.description %>\n' +
            '* @version v<%= pkg.version %>\n' +
            '* @link  <%= pkg.homepage %>\n' +
            '* @license MIT License, http://www.opensource.org/licenses/MIT\n' +
            '*/\n'
        },
        clean: {
            dist: ['<%= builddir %>', '<%=sitedir %>'],
            "gh-pages": ['.grunt']
        },
        concat: {
            options: {
                banner: '<%=meta.banner\n\n%>' +
                'if (typeof module !== "undefined" && typeof exports !== "undefined" && module.exports === exports){\n' +
                ' module.exports = \'visor\';\n' +
                '}\n\n' +
                '(function (window, angular, undefined) {\n',
                footer: '})(window, window.angular);'
            },
            build: {
                src: "src/*.js",
                dest: '<%= builddir %>/<%= module_name %>.js'
            }
        },
        uglify: {
            options: {
                banner: '<%= meta.banner %>\n'
            },
            build: {
                files: {
                    '<%= builddir %>/<%= module_name %>.min.js': ['<banner:meta.banner>', '<%= concat.build.dest %>']
                }
            }
        },
        connect: {
            server: {},
            sample: {
                options: {
                    port: 5555,
                    keepalive: true
                }
            }
        },
        ngdocs: {
            all: ['src/**/*.js'],
            options: {
                dest: 'site/docs',
                html5Mode: false
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
                files: [{
                    expand: true,
                    src: ["visor.js", "visor.min.js"],
                    cwd: "<%=builddir%>/",
                    dest: '<%=releasedir%>/'
                }]
            },
            site: {
                files: [
                    {expand: true, src: '<%=releasedir%>/**', dest: '<%=sitedir%>'},
                    {expand: true, src: 'README.md', dest: '<%=sitedir%>'},
                    {expand: true, src: 'sample/**', dest: '<%=sitedir%>'}]
            }
        },
        changelog: {
            options: {
                preset:'angular',
                file: 'CHANGELOG.md',
                app_name: 'Visor'
            }
        },
        release: {
            options: {
                file: 'package.json',
                additionalFiles:'bower.json',
                tagName: 'v<%= version %>',
                commitMessage: 'release <%= version %>' ,
                tagMessage: 'Version <%= version %>',
                afterBump: ['changelog']
            }
        }
    });

    grunt.registerTask('build', 'Perform a normal build', ['concat', 'uglify']);
    grunt.registerTask('dist', 'Perform a clean build', ['clean', 'build', 'copy:release']);
    grunt.registerTask('site', 'Build and create site', ['dist', 'copy:site', 'ngdocs:all']);
    grunt.registerTask('publish-site', 'Build, create site and push to gh-pages', ['site', 'gh-pages', 'clean:gh-pages']);
    grunt.registerTask('publish','Builds and publishes to all relevent repositories',['publish-site','release'])
}
