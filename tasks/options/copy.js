module.exports = {
  styles: {
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
