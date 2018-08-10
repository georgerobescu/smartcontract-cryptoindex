const Token = artifacts.require("CryptoIndexToken.sol");

module.exports = function(deployer, network, accounts) {
 	deployer.deploy(
  	Token,
  	accounts[0], //owner
  	accounts[1] //team fund
  	);
};