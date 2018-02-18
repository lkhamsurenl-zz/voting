pragma solidity ^0.4.18;

import 'zeppelin-solidity/contracts/math/SafeMath.sol';
import 'zeppelin-solidity/contracts/ownership/Ownable.sol';

contract Finalizable is Ownable {
	event Finalized(bytes32 winnerId);

	using SafeMath for uint256;
	bool public isFinalized = false;

	uint256 startTime;
	uint256 endTime;

	modifier hasNotEnded() {
		require(now >= startTime);
    	require(endTime >= now);
    	_;
	}

	function getEndTime() public view returns (uint256) {
		return endTime;
	}

	function getStartTime() public view returns (uint256) {
		return startTime;
	}

	function hasEnded() public view returns (bool) {
		return now > endTime;
	}

	/**
   	* @dev Must be called after Voting ends, to do some extra finalization
   	* work.
   	*/
  	function finalize() onlyOwner public {
	  require(!isFinalized);
	  require(hasEnded());

	  finalization();

	  isFinalized = true;
  	}	

	function finalization() internal  {
	}
}