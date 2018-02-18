pragma solidity ^0.4.18;

contract StringConversionHelper {
	// Converts a bytes32 content into string. 
	// https://ethereum.stackexchange.com/questions/2519/how-to-convert-a-bytes32-to-string
	function _bytes32ToString(bytes32 x) pure internal returns (string) {
	    bytes memory bytesString = new bytes(32);
	    uint charCount = 0;
	    for (uint j = 0; j < 32; j++) {
	        byte char = byte(bytes32(uint(x) * 2 ** (8 * j)));
	        if (char != 0) {
	            bytesString[charCount] = char;
	            charCount++;
	        }
	    }
	    bytes memory bytesStringTrimmed = new bytes(charCount);
	    for (j = 0; j < charCount; j++) {
	        bytesStringTrimmed[j] = bytesString[j];
	    }
		return string(bytesStringTrimmed);
	}

	// https://ethereum.stackexchange.com/questions/9142/how-to-convert-a-string-to-bytes32
	function _stringToBytes32(string memory source) pure internal returns (bytes32 result) {
	    bytes memory tempEmptyStringTest = bytes(source);
	    if (tempEmptyStringTest.length == 0) {
	        return 0x0;
	    }

	    assembly {
	        result := mload(add(source, 32))
	    }
	}
}

