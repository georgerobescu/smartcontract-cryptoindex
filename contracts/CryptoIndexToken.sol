// CryptoIndex token smart contract.
// Developed by Phenom.Team <info@phenom.team>

pragma solidity ^0.4.24;


/**
 *   @title ERC20
 *   @dev Standart ERC20 token interface
 */

contract ERC20 {
    mapping(address => uint) balances;
    mapping(address => mapping (address => uint)) allowed;

    function balanceOf(address _owner) public constant returns (uint);
    function transfer(address _to, uint _value) public returns (bool);
    function transferFrom(address _from, address _to, uint _value) public returns (bool);
    function approve(address _spender, uint _value) public returns (bool);
    function allowance(address _owner, address _spender) public constant returns (uint);

    event Transfer(address indexed _from, address indexed _to, uint _value);
    event Approval(address indexed _owner, address indexed _spender, uint _value);

} 


/**
 * @title SafeMath
 * @dev Math operations with safety checks that throw on error
 */
library SafeMath {

  /**
  * @dev Multiplies two numbers, throws on overflow.
  */
  function mul(uint a, uint b) internal pure returns (uint) {
    if (a == 0) {
      return 0;
    }
    uint c = a * b;
    assert(c / a == b);
    return c;
  }

  /**
  * @dev Integer division of two numbers, truncating the quotient.
  */
  function div(uint a, uint b) internal pure returns (uint) {
    // assert(b > 0); // Solidity automatically throws when dividing by 0
    uint c = a / b;
    // assert(a == b * c + a % b); // There is no case in which this doesn't hold
    return c;
  }

  /**
  * @dev Substracts two numbers, throws on overflow (i.e. if subtrahend is greater than minuend).
  */
  function sub(uint a, uint b) internal pure returns (uint) {
    assert(b <= a);
    return a - b;
  }

  /**
  * @dev Adds two numbers, throws on overflow.
  */
  function add(uint a, uint b) internal pure returns (uint) {
    uint c = a + b;
    assert(c >= a);
    return c;
  }
}

/**
 *   @title CryptoIndexToken
 *   @dev СryptoIndexToken smart-contract
 */
contract CryptoIndexToken is ERC20 {
    using SafeMath for uint;

    string public name = "Cryptoindex 100";
    string public symbol = "CIX100";
    uint public decimals = 18;
    uint public totalSupply = 300000000*1e18;
    uint public teamPart = 10; // 10% of total supply for team fund 
    uint public icoPart = 90; // 90% of total supply for ico

    address public owner;
    address public teamFund;

    //event
    event Burn(address indexed from, uint value);
    

   /**
    *   @dev Contract constructor function sets Ico address
    *   @param _owner          owner address
    *   @param _teamFund       team fund address
    */
    constructor(address _owner, address _teamFund) public {
       owner = _owner;
       teamFund = _teamFund;
       balances[_owner] = totalSupply.mul(icoPart).div(100);
       balances[_teamFund] = totalSupply.mul(teamPart).div(100); 
    }


   /**
    *   @dev Burn Tokens
    *   @param _value        number of tokens to burn from sender's balance
    */
    function burnTokens(uint _value) public {
        require(balances[msg.sender] > 0);
        totalSupply = totalSupply.sub(_value);
        balances[msg.sender] = balances[msg.sender].sub(_value);
        emit Burn(msg.sender, _value);
    }

   /**
    *   @dev Get balance of tokens holder
    *   @param _holder        holder's address
    *   @return               balance of investor
    */
    function balanceOf(address _holder) public constant returns (uint) {
         return balances[_holder];
    }

   /**
    *   @dev Send coins
    *   throws on any error rather then return a false flag to minimize
    *   user errors
    *   @param _to           target address
    *   @param _amount       transfer amount
    *
    *   @return true if the transfer was successful
    */
    function transfer(address _to, uint _amount) public returns (bool) {
        require(_to != address(0) && _to != address(this));
        balances[msg.sender] = balances[msg.sender].sub(_amount);
        balances[_to] = balances[_to].add(_amount);
        emit Transfer(msg.sender, _to, _amount);
        return true;
    }

    /**
    *   @dev Transfer token in batches
    *   
    *   @param _adresses     token holders' adresses
    *   @param _values       token holders' values
    */
    function batchTransfer(address[] _adresses, uint[] _values) public returns (bool) {
        require(_adresses.length == _values.length);
        for (uint i = 0; i < _adresses.length; i++) {
            require(transfer(_adresses[i], _values[i]));
        }
        return true;
    }

   /**
    *   @dev An account/contract attempts to get the coins
    *   throws on any error rather then return a false flag to minimize user errors
    *
    *   @param _from         source address
    *   @param _to           target address
    *   @param _amount       transfer amount
    *
    *   @return true if the transfer was successful
    */
    function transferFrom(address _from, address _to, uint _amount) public returns (bool) {
        require(_to != address(0) && _to != address(this));
        balances[_from] = balances[_from].sub(_amount);
        allowed[_from][msg.sender] = allowed[_from][msg.sender].sub(_amount);
        balances[_to] = balances[_to].add(_amount);
        emit Transfer(_from, _to, _amount);
        return true;
    }


   /**
    *   @dev Allows another account/contract to spend some tokens on its behalf
    *   throws on any error rather then return a false flag to minimize user errors
    *
    *   also, to minimize the risk of the approve/transferFrom attack vector
    *   approve has to be called twice in 2 separate transactions - once to
    *   change the allowance to 0 and secondly to change it to the new allowance
    *   value
    *
    *   @param _spender      approved address
    *   @param _amount       allowance amount
    *
    *   @return true if the approval was successful
    */
    function approve(address _spender, uint _amount) public returns (bool) {
        require((_amount == 0) || (allowed[msg.sender][_spender] == 0));
        allowed[msg.sender][_spender] = _amount;
        emit Approval(msg.sender, _spender, _amount);
        return true;
    }

   /**
    *   @dev Function to check the amount of tokens that an owner allowed to a spender.
    *
    *   @param _owner        the address which owns the funds
    *   @param _spender      the address which will spend the funds
    *
    *   @return              the amount of tokens still avaible for the spender
    */
    function allowance(address _owner, address _spender) public constant returns (uint) {
        return allowed[_owner][_spender];
    }

    /** 
    *   @dev Allows to transfer out any accidentally sent ERC20 tokens
    *   @param _tokenAddress  token address
    *   @param _amount        transfer amount
    */
    function transferAnyTokens(address _tokenAddress, uint _amount) 
        public
        returns (bool success) {
        return ERC20(_tokenAddress).transfer(owner, _amount);
    }
}