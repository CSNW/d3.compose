module.exports = {
  options: {
    banner: '<%= meta.banner %>'
  },
  temp: {
    options: {
      sourceRoot: '../'
    },
    files: {
      "dist/<%= pkg.name %>.js": "<%= meta.srcFiles %>"
    }
  }
};