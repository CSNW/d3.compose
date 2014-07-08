module.exports = {
  options: {
    banner: '<%= meta.banner %>'
  },
  temp: {
    files: {
      'tmp/<%= pkg.name %>.js': '<%= meta.srcFiles %>'
    }
  },
  release: {
    files: {
      'dist/<%= pkg.name %>.js': '<%= meta.srcFiles %>'
    }
  }
};
