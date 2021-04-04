# Results trade circuits:


## verifyTrade:
Fixed cost: 1175 constraints

per additonal balance:
- 1361 costraint check balance transistion
- 24314 constraints mimcsponge signature


## verifyAndUpdateMerkle:
Fixed Cost: 1 constraint

per aditional balance:
- 95254 constraints


## finalHash:
Fixed cost: 237712 constraints

per additional balance:
- 55713 constraints

## total:
(1175 + 1 + 237712) * (1361 + 24314 + 95254 + 55713) * n

