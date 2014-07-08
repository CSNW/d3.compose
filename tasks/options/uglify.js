module.exports = {
  options: {
    banner: '<%= meta.banner %>',
    sourceMap: true,
    mangle: {
      except: ['d3']
    }
  },
  release: {
    files: {
      'dist/<%= pkg.name %>.min.js': 'dist/<%= pkg.name %>.js'
    }
  }
};
