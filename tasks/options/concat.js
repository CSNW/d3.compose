module.exports = {
  options: {
    banner: '<%= meta.banner %>'
  },
  release: {
    files: {
      "dist/<%= pkg.name %>.js": "<%= meta.srcFiles %>"
    }
  }
};
