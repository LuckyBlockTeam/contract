require('babel-register');
require('babel-polyfill');

module.exports = {
    networks: {
        development: {
            host: "localhost",
            port: 9545,
            gasPrice: 1,
            gas: 6000000,
            network_id: "*" // Match any network id
        },

        // geth --rinkeby --rpc console --rpcport 8544 --syncmode=fast --cache=1024 --bootnodes=enode://a24ac7c5484ef4ed0c5eb2d36620ba4e4aa13b8c84684e1b4aab0cebea2ae45cb4d375b77eab56516d34bfbd3c1a833fc51296ff084b770b94fb9028c4d25ccf@52.169.42.101:30303
        rinkeby: {  // testnet
            host: "localhost",
            port: 8544,
            network_id: 4,
            gasPrice: 20 * 1e9,
            gas: 6000000,
        },

        kovan: {  // kovan
            host: "localhost",
            port: 8542,
            network_id: 3,
            gasPrice: 10 * 1e9,
            gas: 6000000,
        },

        // geth --rpcport 8549 --rpc console --fast
        mainnet: {
            host: "localhost",
            port: 8549,
            network_id: 1,
            gasPrice: 25000000000,
            gas: 6015740,
            from: ""
        }
    },

    solc: {
        optimizer: {
            enabled: true,
            runs: 200
        }
    }
};
