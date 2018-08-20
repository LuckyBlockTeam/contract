module.exports = async addr => {
    return await web3.eth.getBalance(addr)
};