pragma solidity ^0.4.18;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/VotingFactory.sol";

contract TestVotingFactory {

  function testVotingHasNotEnded() {
    VotingFactory votingFactory = VotingFactory(DeployedAddresses.VotingFactory());

    Assert.equal(
      votingFactory.hasEnded(), 
      false, 
      "Voting should not be finished"
    );
  }

}
