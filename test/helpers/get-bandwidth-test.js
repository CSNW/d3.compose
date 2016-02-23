const tape = require('tape');
const getBandwidth = require('../../').helpers.getBandwidth;

tape('getBandwidth() uses bandwidth, if available', t => {
  const scale = {
    bandwidth: () => 50
  };

  t.equal(getBandwidth(scale), 50);
  t.end();
});

tape('getBandwidth() uses rangeBand, if available', t => {
  const scale = {
    rangeBand: () => 50
  };

  t.equal(getBandwidth(scale), 50);
  t.end();
});
