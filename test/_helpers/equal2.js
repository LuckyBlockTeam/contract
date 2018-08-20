module.exports = (val1, val2, msg) => {
    assert.equal(val1.valueOf(), val2.valueOf(), msg)
};