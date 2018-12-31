pragma solidity ^0.4.2;

contract Election {
    // Model a Candidate
    struct Candidate {
        uint id;
        string name;
        string birth;
        string introduction;
        uint voteCount;
    }

    // voted event
    event votedEvent (
        uint indexed _candidateId
    );

    // add event
    event addEvent (
        //string indexed _candidateName
    );

    // Store accounts that have voted
    mapping(address => bool) public voters;
    // Store Candidates
    mapping(uint => Candidate) public candidates;
    // Store Candidates Count
    uint public candidatesCount;

    // constructor 
    function Election ()  public {
        // init with a candidate
        //addCandidate("Candidate1", "1998/02/10", "introduction");
    }

    function addCandidate (string _name, string _birth, string _introduction) public {    
        // update candidates Count
        candidatesCount++;

        // add new candidate to container
        candidates[candidatesCount] = Candidate(candidatesCount, _name, _birth, _introduction, 0);
        
        // trigger add event
        votedEvent(0);
    }

    function vote (uint _candidateId) public {
        // require that they haven't voted before
        require(!voters[msg.sender]);

        // require a valid candidate
        require(_candidateId > 0 && _candidateId <= candidatesCount);

        // record that voter has voted
        voters[msg.sender] = true;

        // update candidate vote Count
        candidates[_candidateId].voteCount ++;

        // trigger voted event
        votedEvent(_candidateId);
    }
}