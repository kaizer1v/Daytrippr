module.exports = grunt => {

  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-watch');

  let port = grunt.option('port') || 9008;
  let root = grunt.option('root') || '.';

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    connect: {
      server: {
        options: {
          port: port,
          base: root,
          livereload: true,
          open: true,
          useAvailablePort: true,
          keepalive: true
        }
      }
    },

    compress_js: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      build: {
        src: '<%= pkg.name %>.js',
        dest: 'build/<%= pkg.name %>.min.js'
      }
    },

    watch: {

    }

  });  // initConfig


  // Serve presentation locally
  grunt.registerTask('serve', ['connect']);
  grunt.registerTask('compress', ['compress_js'])
}