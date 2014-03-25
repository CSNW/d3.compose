module.exports = {
  options: {
    banner: '<%= meta.banner %>'
  },
  temp: {
    options: {
      sourceRoot: '../'
    },
    files: {
      "tmp/<%= pkg.name %>.js": "<%= meta.srcFiles %>"
    }
  }
};