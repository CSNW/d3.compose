module.exports = {
  options: {
    banner: '<%= meta.banner %>',
    sourceMap: true,
    mangle: {
      except: ['d3']
    }
  },
  temp: {
    files: {
      "tmp/<%= pkg.name %>.min.js": "tmp/<%= pkg.name %>.js"
    }
  },
  release: {
    files: {
      "dist/<%= pkg.name %>.min.js": "dist/<%= pkg.name %>.js"
    }
  }

  // browser: {
  //   options: {
  //     mangle: true
  //   },
  //   files: {
  //     'dist/<%= pkg.name %>-<%= pkg.version %>.min.js': ['dist/<%= pkg.name %>-<%= pkg.version %>.js'],
  //   }
  // },
  // browserNoVersion: {
  //   options: {
  //     mangle: true
  //   },
  //   files: {
  //     'dist/<%= pkg.name %>.min.js': ['dist/<%= pkg.name %>.js'],
  //   }
  // }
};
