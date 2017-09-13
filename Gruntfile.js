module.exports = function (grunt) {

    require('load-grunt-tasks')(grunt);

    // tasks
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        uglify: {
        
            default: {
                options: {
                    beautify: false,
                    sourceMap: false
                },
                files: {


                    'ui/base.min.js': [
                        'ui/src/*.js'
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


    grunt.registerTask('default', ['uglify',"sass"]);
};