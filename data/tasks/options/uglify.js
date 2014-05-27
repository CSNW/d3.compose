module.exports = {
  options: {
    banner: '<%= meta.banner %>',
    sourceMap: true,
    mangle: {
      except: ['d3', '_', 'rsvp']
    }
  },
  build: {
    files: {
      '<%= pkg.name %>.min.js': '<%= pkg.name %>.js'
    }
  }
};
