const Token = artifacts.require('CryptoIndexToken.sol');

module.exports = function(deployer, network, accounts) {
    deployer.deploy(
        Token,
        accounts[0], // forget fund
        accounts[1], //team fund
        accounts[2], // advisors fund
        accounts[3], // bonus fund
        accounts[4], // reserve fund
    );
};
