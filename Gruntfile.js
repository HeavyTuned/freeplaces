module.exports = function (grunt) {

    require('load-grunt-tasks')(grunt);

    // tasks
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        browserify: {
            dist: {
                files: {
                    // destination for transpiled js : source js
                    'ui/base.min.js': 'ui/src/*.js'
                },
                options: {
                    transform: [['babelify', { presets: "es2015" }]],
                    browserifyOptions: {
                        debug: true
                    }
                }
            }
        },
        uglify: {
        
            default: {
                options: {
                    beautify: false,
                    sourceMap: false
                },
                files: {


                    'ui/base.min.js': [
                        'ui/base.min.js'
                    ]
                }
            }
        },
        //sass
        sass: {
            default: {
                options: {
                    sourceMap: false,
                    outputStyle: 'compressed',
                    style: 'compressed'
                },
                files: {"ui/base.css": 'ui/src/base.scss'}
            }
        }

    });


    grunt.registerTask('default', ['browserify:dist:','uglify',"sass"]);
};