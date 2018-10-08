# CryptoIndex Contract
Crypto index index token is a ERC20 compatible burnable token with fixed total supply.
## Code

#### CryptoIndexContract


**Contstructor**
```cs
 constructor(address _owner, address _teamFund)
```
Owner address will recieve 90% of initial supply and team fund - 10%.


**balanceOf**
```cs
function balanceOf(address _holder) constant returns (uint)
```
Get balance of tokens holder

**transfer**
```cs
function transfer(address _to, uint _amount) public returns (bool)
```
Send coins throws on any error rather than return a false flag to minimize user errors

**batchTransfer**
```cs
function batchTransfer(address[] _adresses, uint[] _values) public returns (bool)
```
Send coins in batches.

**transferFrom**
```cs
function transferFrom(address _from, address _to, uint _amount) public returns (bool)
```
An account/contract attempts to get the coins. Throws on any error rather than return a false flag to minimize user errors

**approve**
```cs
function approve(address _spender, uint _amount) public returns (bool)
```
Allows another account/contract to spend some tokens on its behalf throws on any error rather than return a false flag to minimize user errors also, to minimize the risk of the approve/transferFrom attack vector approve has to be called twice in 2 separate transactions - once to
change the allowance to 0 and secondly to change it to the new allowance value

**allowance**
```cs
function allowance(address _owner, address _spender) constant returns (uint)
```
Function to check the number of tokens that an owner allowed to a spender.

**transferAnyTokens**
```cs
function transferAnyTokens(address _tokenAddress, uint _amount) 
        public
        onlyOwner 
        returns (bool success)
```
Allows owner to transfer out any accidentally sent ERC20 tokens


## Prerequisites
1. nodejs, and make sure it's version above 8.0.0
2. npm
3. truffle
4. testrpc

## Run tests
1. run `truffle test` in terminal