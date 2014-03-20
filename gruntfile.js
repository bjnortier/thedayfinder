'use strict';

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({

    jshint: {
      options: {
        jshintrc: '.jshintrc'
      },
      gruntfile: {
        src: 'gruntfile.js'
      },
      src: {
        src: ['src/**/*.js'],
      },
      unit: {
        src: ['test/unit/**/*.js'],
      },
    },

    simplemocha: {
      options: {
        timeout: 5000,
        slow: 5000,
        ignoreLeaks: false,
        ui: 'bdd',
        reporter: 'spec',
        path: 'test'
      },
      unit: {
        src: '<%= jshint.unit.src %>'
      },
    },

    browserify: {
      event: {
        files: {
          'public/event.js': ['src/event.js'],
        },
        options: {
          shim: {
            jquery: {
              path: 'public/jquery-2.1.0.min.js',
              exports: '$'
            },
            backbone: {
              path: 'public/backbone-min.js',
              exports: 'Backbone'
            }
          },
          external: ['jquery', 'backbone']
        }
      },
    },

    watch: {
      gruntfile: {
        files: '<%= jshint.gruntfile.src %>',
        tasks: ['jshint:gruntfile'],
      },
      src: {
        files: ['<%= jshint.src.src %>'],
        tasks: ['jshint:src','unit','browserify'],
      },
      unit: {
        files: ['<%= jshint.unit.src %>'],
        tasks: ['jshint:unit', 'unit'],
      },
    },

  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-simple-mocha');
  grunt.loadNpmTasks('grunt-browserify');

  grunt.registerTask('unit', ['simplemocha:unit']);
  grunt.registerTask('test', ['jshint', 'unit']);
  grunt.registerTask('default', ['test', 'browserify']);

};
