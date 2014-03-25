module.exports = {
  options: {
    banner: '<%= meta.banner %>'
  },
  build: {
    files: {
      "dist/<%= pkg.name %>.js": "<%= meta.srcFiles %>"
    }
  }
};
