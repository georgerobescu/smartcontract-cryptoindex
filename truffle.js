/*
 * NB: since truffle-hdwallet-provider 0.0.5 you must wrap HDWallet providers in a 
 * function when declaring them. Failure to do so will cause commands to hang. ex:
 * ```
 * mainnet: {
 *     provider: function() { 
 *       return new HDWalletProvider(mnemonic, 'https://mainnet.infura.io/<infura-key>') 
 *     },
 *     network_id: '1',
 *     gas: 4500000,
 *     gasPrice: 10000000000,
 *   },
 */

module.exports = {
  networks: {
    development: {
      host: "localhost",
      port: 8545,
      network_id: "*", // Match any network id
      gasPrice: 11000000000,
      gas: 6712390,
	},
	mainnet: {
      host: "localhost",
      port: 8546,
      network_id: "*", // Match any0xe2632af4eae268448de5ad289d0d4639e66d6915 network id
      gasPrice: 11000000000,
      gas: 2000000,
      from: '0xe2632af4eae268448de5ad289d0d4639e66d6915'
	}
  }
};
