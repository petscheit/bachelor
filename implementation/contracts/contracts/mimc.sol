pragma solidity ^0.5.2;

contract Sponge {
    uint256 prime;
    uint256 r;
    uint256 c;
    uint256 m;
    uint256 outputSize;
    uint256 nRounds;

    constructor (uint256 prime_, uint256 r_, uint256 c_, uint256 nRounds_)
        public
    {
        prime = prime_;
        r = r_;
        c = c_;
        m = r + c;
        outputSize = c;
        nRounds = nRounds_;
    }

    function LoadAuxdata()
        internal view
        returns (uint256[] memory /*auxdata*/);

    function permutation_func(uint256[] memory /*auxdata*/, uint256[] memory /*elements*/)
        internal view
        returns (uint256[] memory /*hash_elements*/);

    function sponge(uint256[] memory inputs)
        internal view
        returns (uint256[] memory outputElements)
    {
        uint256 inputLength = inputs.length;
        for (uint256 i = 0; i < inputLength; i++) {
            require(inputs[i] < prime, "elements do not belong to the field");
        }

        require(inputLength % r == 0, "Number of field elements is not divisible by r.");

        uint256[] memory state = new uint256[](m);
        for (uint256 i = 0; i < m; i++) {
            state[i] = 0; // fieldZero.
        }

        uint256[] memory auxData = LoadAuxdata();
        uint256 n_columns = inputLength / r;
        for (uint256 i = 0; i < n_columns; i++) {
            for (uint256 j = 0; j < r; j++) {
                state[j] = addmod(state[j], inputs[i * r + j], prime);
            }
            state = permutation_func(auxData, state);
        }

        require(outputSize <= r, "No support for more than r output elements.");
        outputElements = new uint256[](outputSize);
        for (uint256 i = 0; i < outputSize; i++) {
            outputElements[i] = state[i];
        }
    }

    function getParameters()
        public view
        returns (uint256[] memory status)
    {
        status = new uint256[](4);
        status[0] = prime;
        status[1] = r;
        status[2] = c;
        status[3] = nRounds;
    }
}

contract STARK_Friendly_Hash_Challenge_MiMC_80 is Sponge {
    address roundConstantsContract;

    constructor (uint256 prime, uint256 nRounds, address roundConstantsContract_)
        public payable
        Sponge(prime, 1, 1, nRounds)
    {
        roundConstantsContract = roundConstantsContract_;
    }

    function LoadAuxdata()
        internal view
        returns (uint256[] memory roundConstants)
    {
        roundConstants = new uint256[](nRounds);
        address contractAddr = roundConstantsContract;
        assembly {
            let sizeInBytes := mul(mload(roundConstants), 0x20)
            // The first and last round use the roundConstants 0.
            mstore(add(roundConstants, 0x20), 0)
            extcodecopy(contractAddr, add(roundConstants, 0x40), 0, sub(sizeInBytes, 0x40))
            // Last roundConstants is at offset 0x20 + sizeInBytes - 0x20.
            mstore(add(roundConstants, sizeInBytes), 0)
        }
    }

    function permutation_func(uint256[] memory roundConstants, uint256[] memory elements)
        internal view
        returns (uint256[] memory hash_elements)
    {
        uint256 xLeft = elements[0];
        uint256 xRight = elements[1];
        for (uint256 i = 0; i < roundConstants.length; i++) {
            uint256 xLeftOld;
            xLeftOld = xLeft;
            uint256 step1 = addmod(xLeft, roundConstants[i], prime);
            uint256 step2 = mulmod(mulmod(step1, step1, prime), step1, prime);
            xLeft = addmod(xRight, step2, prime);
            xRight = xLeftOld;
        }
        hash_elements = new uint256[](2);
        hash_elements[0] = xLeft;
        hash_elements[1] = xRight;
    }
}
