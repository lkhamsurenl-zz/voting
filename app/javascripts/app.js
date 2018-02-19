// Import the page's CSS. Webpack will know what to do with it.
import "../stylesheets/app.css";

// Import libraries we need.
import { default as Web3} from 'web3';
import { default as contract } from 'truffle-contract';

import voting_artifacts from '../../build/contracts/VotingFactory.json';

// Contstants:
var SEC_IN_MS = 1000;
var MIN_IN_MS = SEC_IN_MS * 60;
var HR_IN_MS = MIN_IN_MS * 60;
var DAY_IN_MS = HR_IN_MS * 24;
var MONTH_IN_MS = 30 * DAY_IN_MS;
var GAS = 140000;

var VotingFactory = contract(voting_artifacts);

let endDate = new Date().getTime() + MONTH_IN_MS;
let candidates = {}
let voters = {}

function populateCountdown() {
  VotingFactory.deployed().then(function(contractInstance) {
    contractInstance.getEndTime.call().then(function(date) {
      endDate = new Date(parseInt(date.toString()) * 1000);
    })
  });
}

function updateCountdown() {
  var now = new Date().getTime();
  var distance = endDate - now;

  var days = Math.max(Math.floor(distance / DAY_IN_MS), 0);
  var hours = Math.max(Math.floor((distance % DAY_IN_MS) / HR_IN_MS), 0);
  var minutes = Math.max(Math.floor((distance % HR_IN_MS) / MIN_IN_MS), 0);
  var seconds = Math.max(Math.floor((distance % MIN_IN_MS) / SEC_IN_MS), 0);

  $("#countdown").html(days+"d "+hours+"h "+minutes+"m "+seconds+"s ");
}

var x = setInterval(updateCountdown, 1000);

window.voteForCandidate = function(candidate) {
  var candidateDropDownList = document.getElementById("candidate-dropdown-list");
  var candidateName = candidateDropDownList.options[candidateDropDownList.selectedIndex].text;

  var voterDropDownList = document.getElementById("voter-dropdown-list");
  var voterAddress = voterDropDownList.options[voterDropDownList.selectedIndex].text;

  try {
    $("#msg").html("Vote has been submitted. The vote count will increment as soon as the vote is recorded on the blockchain. Please wait.")
    $("#error-msg").html("");

    /* VotingFactory.deployed() returns an instance of the contract. Every call
     * in Truffle returns a promise which is why we have used then()
     * everywhere we have a transaction call
     */
    VotingFactory.deployed().then(function(contractInstance) {
      contractInstance.voteForCandidate(
        candidateName, 
        { gas: GAS, from: voterAddress }
      ).then(function() {
        // Update voters information:
        let voterDivId = voters[voterAddress];
        contractInstance.totalVotesCasted({from: voterAddress}).then(function(v) {
          $("#" + voterDivId).html(v.toString());
        });
        $("#msg").html("");
      }).catch(function(err) {
        // if voting session has ended, show the message
        contractInstance.hasEnded.call().then(function(expired) {
          if (expired) {
            // Finalize the voting process.
            contractInstance.getWinner.call().then(function(winnerId) {
              $("#winner").html("Voting has finished. " + winnerId.toString() + " won!" +
                " Smart contract will automatically release fund to the winner.");
            })
            $("#error-msg").html("Voting session has expired!");

            // Reveal the votes:
            populateCandidateVotes();
          } else {
            $("#error-msg").html("You have already casted a vote!");
          }
        });
      });
    });
  } catch (err) {
    console.log(err);
  }
}

function populateCandidates() {
  VotingFactory.deployed().then(function(contractInstance) {
    contractInstance.getCandidateList.call().then(function(candidateArray) {
      for(let i=0; i < candidateArray.length; i++) {
        /* We store the candidate names as bytes32 on the blockchain. We use the
         * handy toUtf8 method to convert from bytes32 to string
         */
        candidates[web3.toUtf8(candidateArray[i])] = "candidate-" + i;
      }
      setupCandidateRows();
      setupCandidateDropdownList();
      populateCandidateLinks();
    });
  });
}

// Construct html of candidate rows with their information. 
function setupCandidateRows() {
  Object.keys(candidates).forEach(function (candidate) { 
    let nameTd = "<td>" + candidate + "</td>"
    let linkTd = "<td id='" + candidates[candidate] + "-link'></td>"
    let voteTd = "<td id='" + candidates[candidate] + "-vote'></td>"
    $("#candidate-rows").append("<tr>" + nameTd + linkTd + voteTd + "</tr>");
  });
}

function setupCandidateDropdownList() {
  Object.keys(candidates).forEach(function (candidate) { 
    // <option value="volvo">Volvo XC90</option>
    $("#candidate-dropdown-list").append("<option value='" + candidate + "'>" + candidate + "</option>");
  });
}

function populateCandidateLinks() {
  let candidateNames = Object.keys(candidates);
  for (var i = 0; i < candidateNames.length; i++) {
    let name = candidateNames[i];
    VotingFactory.deployed().then(function(contractInstance) {
      contractInstance.getCandidateSubmissionLink.call(name).then(function(v) {
        let link = "<a href='https://www.youtube.com/watch?v=" + v.toString() + "'>link</a>";
        $("#" + candidates[name] + "-link").html(link);
      });
    });
  }
}

function populateCandidateVotes() {
  let candidateNames = Object.keys(candidates);
  for (var i = 0; i < candidateNames.length; i++) {
    let name = candidateNames[i];
    VotingFactory.deployed().then(function(contractInstance) {
      contractInstance.totalVotesFor.call(name).then(function(v) {
        let voteDivId = candidates[name] + "-vote";
        $("#" + voteDivId).html(v.toString());
      });
    });
  }
}

/*
* Voter information population
*/
function populateVoters() {
  //TODO(LJ): Eventually all voters will be read from Smart contract init.
  for (var i = 0; i < web3.eth.accounts.length; i++) {
    let address = web3.eth.accounts[i];
    voters[address] = "voter-" + i.toString();
  }
  setupVoterRows();
  setupVoterDropdownList();
  populateVoterCounts();
}

// Construct html of candidate rows with their information. 
function setupVoterRows() {
  Object.keys(voters).forEach(function (voterAddress) { 
    let nameTd = "<td>" + voterAddress + "</td>"
    let voteTd = "<td id='" + voters[voterAddress] + "'></td>"
    $("#voter-rows").append("<tr>" + nameTd + voteTd + "</tr>");
  });
}

function setupVoterDropdownList() {
  Object.keys(voters).forEach(function (voterAddress) { 
    $("#voter-dropdown-list").append("<option value='" + voterAddress + "'>" + voterAddress + "</option>");
  });
}

function populateVoterCounts() {
  Object.keys(voters).forEach(function(voterAddress) {
    VotingFactory.deployed().then(function(contractInstance) {
      contractInstance.totalVotesCasted({ from: voterAddress })
      .then(function(voteCount) {
        $("#" + voters[voterAddress]).html(voteCount.toString());
      })
      .catch(function(err) {
        console.log("Error in getting voting counts: " + err);
      });
    });
  }); 
}

$( document ).ready(function() {
  if (typeof web3 !== 'undefined') {
    console.warn("Using web3 detected from external source like Metamask")
    // Use Mist/MetaMask's provider
    window.web3 = new Web3(web3.currentProvider);
  } else {
    console.warn("No web3 detected. Falling back to http://localhost:8545. You should remove this fallback when you deploy live, as it's inherently insecure. Consider switching to Metamask for development. More info here: http://truffleframework.com/tutorials/truffle-and-metamask");
    // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
    window.web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
  }

  VotingFactory.setProvider(web3.currentProvider);
  populateCountdown();
  populateVoters();
  populateCandidates();

});
