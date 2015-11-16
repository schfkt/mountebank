'use strict';

var port = process.env.MB_PORT || 2525;

module.exports = function (grunt) {

    require('time-grunt')(grunt);

    grunt.loadTasks('tasks');
    grunt.loadNpmTasks('grunt-mocha-test');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-jsdoc');
    grunt.loadNpmTasks('grunt-mountebank');
    grunt.loadNpmTasks('grunt-wslint');

    grunt.initConfig({
        mochaTest: {
            unit: {
                options: {
                    reporter: 'spec'
                },
                src: ['test/**/*.js']
            },
            functional: {
                options: {
                    reporter: 'spec'
                },
                src: ['functionalTest/**/*.js']
            },
            performance: {
                options: {
                    reporter: 'spec'
                },
                src: ['performanceTest/**/*.js']
            },
            coverage: {
                options: {
                    reporter: 'html-cov',
                    quiet: true,
                    captureFile: 'coverage.html',
                    require: 'coverage/blanket'
                },
                src: ['test/**/*.js']
            }
        },
        jshint: {
            all: [
                'Gruntfile.js',
                'src/**/*.js',
                'tasks/**/*.js',
                'test/**/*.js',
                'functionalTest/**/*.js',
                'performanceTest/**/*.js',
                'bin/mb'
            ],
            options: {
                ignores: [
                    'src/public/scripts/jquery/**/*.js'
                ],
                node: true,
                globals: {
                    describe: false,
                    it: false,
                    before: false,
                    beforeEach: false,
                    after: false,
                    afterEach: false
                },
                newcap: false,
                camelcase: true,
                curly: true,
                eqeqeq: true,
                latedef: true,
                undef: true,
                unused: true,
                trailing: true,
                maxparams: 4,
                maxdepth: 3,
                maxcomplexity: 5
            }
        },
        jsdoc: {
            dist : {
                src: ['src/**/*.js'],
                options: {
                    destination: 'docs',
                    configure: '.jsdoc',
                    pedantic: true,
                    readme: 'CONTRIBUTING.md',
                    package: 'dist/mountebank/package.json' // use dist to get correct version
                }
            }
        },
        mb: {
            options: {
                path: 'bin/mb'
            },
            restart: ['--port', port, '--pidfile', 'mb-grunt.pid', '--logfile', 'mb-grunt.log', '--allowInjection', '--mock', '--debug'],
            stop: ['--pidfile', 'mb-grunt.pid']
        },
        wslint: {
            all: [
                '**/*',
                '!node_modules/**/*',
                '!.git/**/*',
                '!.DS_Store',
                '!.idea/**/*',
                '!src/public/images/**/*',
                '!docs/**/*',
                '!dist/**/*',
                '!mountebank.iml',
                '!*.log',
                '!*.pid',
                '!src/public/scripts/jquery/**/*',
                '!src/public/stylesheets/jqueryui/**/*'
            ],
            options: {
                noTrailingWhitespace: true,
                noTabs: true,
                trailingNewline: true,
                noMultipleTrailingNewlines: true
            }
        }
    });

    grunt.registerTask('setAirplaneMode', function () {
        process.env.MB_AIRPLANE_MODE = 'true';
    });

    grunt.registerTask('test:unit', 'Run the unit tests', ['mochaTest:unit']);
    grunt.registerTask('test:functional', 'Run the functional tests',
        ['mb:restart', 'try', 'mochaTest:functional', 'finally', 'mb:stop', 'checkForErrors']);
    grunt.registerTask('test:performance', 'Run the performance tests', ['mochaTest:performance']);
    grunt.registerTask('test', 'Run all non-performance tests', ['test:unit', 'test:functional']);
    grunt.registerTask('coverage', 'Generate code coverage', ['mochaTest:coverage']);
    grunt.registerTask('lint', 'Run all lint checks', ['wslint', 'jsCheck', 'deadCheck', 'jshint']);
    grunt.registerTask('default', ['dist', 'version', 'test', 'lint']);

    grunt.registerTask('local', 'Fast build for local development (avoids distribution)', ['test', 'lint']);
    grunt.registerTask('airplane', 'Build that avoids tests requiring network access', ['setAirplaneMode', 'local']);

    // Package-specific testing
    grunt.registerTask('test:tarball:x64', 'Run tests against packaged tarball',
        ['dist', 'version', 'dist:tarball:x64', 'install:tarball:x64', 'test', 'lint']);
    grunt.registerTask('test:zip', 'Run tests against packaged zipfile',
        ['download:zip', 'install:zip', 'test', 'lint']);
    grunt.registerTask('test:npm', 'Run tests against npm package',
        ['dist', 'version', 'dist:npm', 'install:npm', 'test']);
    grunt.registerTask('test:pkg', 'Run tests against OSX pkg file',
        ['dist', 'version', 'dist:package:osxpkg', 'install:pkg', 'test']);
    grunt.registerTask('test:deb', 'Run tests against Debian package',
        ['dist', 'version', 'dist:package:deb', 'install:deb', 'test', 'uninstall:deb']);
    grunt.registerTask('test:rpm', 'Run tests against Red Hat package',
        ['download:rpm', 'install:rpm', 'test', 'uninstall:rpm']);
};
