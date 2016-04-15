// TODO

function connection(Connectee) {
  return Connectee;
}

const connect = {
  map: function(/*mapStateToProps, mapDispatchToProps, mergeProps, options*/) {
    return connection;
  },
  reduce: function(/*reducer*/) {
    return connection;
  }
};

connection.map = connect.map;
connection.reduce = connect.reduce;

export default connect;
