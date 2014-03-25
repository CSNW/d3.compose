module.exports = {
  styles: {
    files: [{
      expand: true,
      cwd: 'src/styles',
      src: ['*.css'],
      dest: 'dist/styles/',
      rename: function(dest, name) {
        return dest + '<%= pkg.name %>.' + name;
      }
    }]
  }  
};
