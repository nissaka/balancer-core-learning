const Web3 = require("@solana/web3.js");

const getTransaction = () => {
    const transaction=new Web3.Transaction();
    console.log(transaction)
};

console.log(getTransaction())