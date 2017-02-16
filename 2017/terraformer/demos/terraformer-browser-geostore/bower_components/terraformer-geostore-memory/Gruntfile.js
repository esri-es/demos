module.exports = function (grunt) {
  grunt.initConfig({
    aws: grunt.file.readJSON(process.env.HOME + '/terraformer-s3.json'),
    pkg:   grunt.file.readJSON('package.json'),

    meta: {
      banner: '/*! Terraformer JS - <%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd") %>\n' +
        '*   https://github.com/geoloqi/Terraformer\n' +
        '*   Copyright (c) <%= grunt.template.today("yyyy") %> Environmental Systems Research Institute, Inc.\n' +
        '*   Licensed MIT */'
    },

    jshint: {
      files: [ 'terraformer-geostore-memory.js' ],
      options: {
        node: true
      }
    },


    uglify: {
      options: {
        report: 'gzip'
      },

      'terraformer-geostore-memory': {
        src: ['terraformer-geostore-memory.js'],
        dest: 'terraformer-geostore-memory.min.js'
      },

      version: {
        src: ['terraformer-geostore-memory.js'],
        dest: 'versions/terraformer-geostore-memory-<%= pkg.version %>.min.js'
      }
    },

    jasmine: {
      coverage: {
        src: [
          "terraformer-geostore-memory.js"
        ],
        options: {
          specs: 'spec/*Spec.js',
          helpers: [
            './node_modules/terraformer/terraformer.js',
            './node_modules/terraformer-geostore/browser/terraformer-geostore.js'
          ],
          //keepRunner: true,
          outfile: 'SpecRunner.html',
          template: require('grunt-template-jasmine-istanbul'),
          templateOptions: {
            coverage: './.coverage/coverage.json',
            report: './.coverage',
            thresholds: {
              lines: 75,
              statements: 75,
              branches: 60,
              functions: 75
            }
          }
        }
      }
    },

    complexity: {
      generic: {
        src: [ 'terraformer-geostore-memory' ],
        options: {
          jsLintXML: 'complexity.xml', // create XML JSLint-like report
          errorsOnly: false, // show only maintainability errors
          cyclomatic: 6,
          halstead: 15,
          maintainability: 65
        }
      }
    },

    s3: {
      options: {
        key: '<%= aws.key %>',
        secret: '<%= aws.secret %>',
        bucket: '<%= aws.bucket %>',
        access: 'public-read',
        headers: {
          // 1 Year cache policy (1000 * 60 * 60 * 24 * 365)
          "Cache-Control": "max-age=630720000, public",
          "Expires": new Date(Date.now() + 63072000000).toUTCString()
        }
      },
      dev: {
        upload: [
          {
            src: 'versions/terraformer-geostore-memory-<%= pkg.version %>.min.js',
            dest: 'terraformer-geostore-memory/<%= pkg.version %>/terraformer-geostore-memory.min.js'
          }
        ]
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-complexity');
  grunt.loadNpmTasks('grunt-contrib-jasmine');
  grunt.loadNpmTasks('grunt-s3');

  grunt.registerTask('test', ['jasmine']);
  grunt.registerTask('default', [ 'jshint', 'jasmine', 'uglify', 'complexity' ]);
  grunt.registerTask('version', [ 'default', 's3' ]);
};
