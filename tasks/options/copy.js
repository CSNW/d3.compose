module.exports = {
  temp: {
    files: [{
      expand: true,
      cwd: 'src/css',
      src: ['*.css'],
      dest: 'tmp/css/',
      rename: function(dest, name) {
        return dest + '<%= pkg.name %>.' + name;
      }
    }]
  },
  release: {
    files: [{
      expand: true,
      cwd: 'src/css',
      src: ['*.css'],
      dest: 'dist/css/',
      rename: function(dest, name) {
        return dest + '<%= pkg.name %>.' + name;
      }
    }]
  }
};
