
# damn-vulnerable-nft
![HACKED](https://github.com/zk1tty/damn-vulnerable-nft/assets/23345846/e1712e57-1ef9-4667-9a0c-c1b5ed4f84fd)




I organized the Cats The Flag (Please check the event detail from [cstf.dev](https://cstf.dev/)) at EthLisbon and EthCC on 15th May in 2023.  
The Damn Vulnerable NFT is the quiz made for 1st Cats The Flag by [zkitty](https://github.com/zk1tty).  

## Setting up
- make sure that you have a `hardhat` dev env. 

```shell
npx hardhat help
npx hardhat test <a file filepath>
```

## Quiz description

Quiz description is at [Damn Vulnerability NFT](https://0xcerberus.notion.site/Damn-Vulnerable-NFT-888ba677fdaf4e24ac78b9cb4963a9fb)

## Background story: $3M hacking 😨
I faced to the hacking incident at [my first NFT collection](https://twitter.com/MintMitama).  
The NFT collection was sold out. The smart contract of NFT collection got 1280 Eth, equivalent to $3M.   
Just when we got sold out, we found that the ownership of NFT collection was transferred to a stranger's wallet.  
Here, we noticed something bad happened.  
We exposed the private-key of contract-deployer wallet on public Github repo.  
The "whitehacker" reached to the original wallet account, and started threatening with the condition to get back the 1/3 Eth on the contract.  
We hardcoded withdraw wallet address on the code, so "whitehacker" was not able to withdraw. That's why they reached out to the foundering team.  
We started the negotiation process on [Session](https://getsession.org/).  

We deployed AtomicSwap contract with 12h time-lock, where we transfer the ransom to "whitehacker" only if "whitehacker" transfer the ownership of NFT contract to us.
This is right decition, and we got back our ownership of NFT collection.  

From this experience, I and our founder team learned the following questions.
- Wallet Operation of deployment contract should be properly planned in advance.
  - I wanna have a guideline for wallet operation!
- We didn't get audit because of our law-budget and pre-revenue project status.
  - Why not can we have a cheap and effective option for code and operation audit?
