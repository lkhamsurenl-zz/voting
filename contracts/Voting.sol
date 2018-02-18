pragma solidity ^0.4.18;

import './Finalizable.sol';
import './StringConversionHelper.sol';

// TODO(LJ): add inheritance from submission contract.
contract Voting is Finalizable, StringConversionHelper {
	// candidateId => totalVote.  
	mapping (bytes32 => uint8) public votesReceived;

	// Each voter can cast only one vote.
	mapping (address => uint8) public votesCasted;

	mapping (bytes32 => bytes32) public candidateLinks;

	/* List of people who can vote on the blockchain for a given SC */
	bytes32[] public candidateList; 

	/*
	* Initializes voting contract with list of candidates to vote for.
	* TODO(LJ): Get list of candidates from Forest's candidates list
	* contract.
	*/
	function Voting(bytes32[] _ids, bytes32[] _links, uint256 _startTime, uint256 _endTime) public {
		require(_startTime <= _endTime);
		startTime = _startTime;
		endTime = _endTime;

		candidateList = _ids;
		for (uint i=0; i < _links.length; i++) {
			candidateLinks[_ids[i]] = _links[i];
		}
	}

	function getCandidateList() view public returns (bytes32[]) {
		return candidateList;
	}

	function totalVotesFor(bytes32 _id) view public returns (uint8) {
		// Ensure candidate is legit.
		require(_validCandidate(_id));
		return votesReceived[_id];
	}

	function voteForCandidate(bytes32 _id) external hasNotEnded {
		// Ensure candidate is legit.
		require(_validCandidate(_id));
		// Ensure voter has not submitted any vote.
		require(_hasNotCastedVote());

		votesReceived[_id]++;
		votesCasted[msg.sender]++;
	}

	function getCandidateSubmissionLink(bytes32 _id) view public onlyOwner returns (string) {
		// Ensure candidate is legit.
		require(_validCandidate(_id));
		return _bytes32ToString(candidateLinks[_id]);
	}

	function totalVotesCasted() view public onlyOwner returns (uint8) {
		return votesCasted[msg.sender];
	}

	function _validCandidate(bytes32 _id) view internal returns (bool) {
		for(uint i = 0; i < candidateList.length; i++) {
			if (candidateList[i] == _id) {
				return true;
			}
		}
		return false;
	}

	function _hasNotCastedVote() view internal returns (bool) {
		return votesCasted[msg.sender] == 0;
	}

	function getWinner() view public returns (string) {
		bytes32 winnerId;
		uint maxVotes = 0;
		for (uint i=0; i < candidateList.length; i++) {
			uint8 candidateVotes = votesReceived[candidateList[i]];
			if (candidateVotes > maxVotes) {
				winnerId = candidateList[i];
				maxVotes = candidateVotes;
			}
		}

		return _bytes32ToString(winnerId);
	}
}