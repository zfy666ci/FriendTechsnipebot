const abi = require("./v1abi.json")
const Web3 = require("web3");
const axios = require('axios')
const web3 = new Web3("https://base-mainnet.diamondswap.org/rpc");
const FriendContracl = '0xcf205808ed36593aa40a44f10c7f7c2f67d4a4d4'
const readline = require('readline');
const util = require('util');
const config = require("./config.json")
const Friendcall = new web3.eth.Contract(
    abi,
    FriendContracl
);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = util.promisify(rl.question).bind(rl);

async function seasrChAddress(name) {
    try {
        const headers = {
            "Authorization": config.jwttoken,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        }
        let result = await axios.get('https://prod-api.kosetto.com/search/users?username=' + name, { headers: headers })

        return result.data.users[0].address

    } catch (error) {
        console.log('未查询到')
        return ""
    }

}


async  function estBuy(address,amount,MaxETH){
  let sendvalue= 0
  console.log(`开始获取价格`)
  while (parseFloat(sendvalue)==0){
    sendvalue= await  getsharePrice(address,amount)
    console.log(`当前所需价格${sendvalue}`)
  }
  if(parseFloat(sendvalue)<parseFloat(MaxETH)){
    console.log(`符合条件开始购买`)
        buyShares(address,amount,sendvalue)
  }else{
    console.log('价格超出预期')
    return
  }

}

async function sendTry(tx, privateKey) {
    try {
        var signed = await web3.eth.accounts.signTransaction(tx, privateKey);

        var tran = await web3.eth.sendSignedTransaction(signed.rawTransaction);
        console.log(tran)
        return tran;
    } catch (error) {
        console.log(error);
    }
}

async function buyShares(address, amount,sendvalue) {
    const encodedABI = Friendcall.methods.buyShares(address, amount).encodeABI();
    const tx = {
        from: address,
        maxFeePerGas: web3.utils.toWei("5", "gwei"),
        maxPriorityFeePerGas: web3.utils.toWei("0.1", "gwei"),
        to: "0xcf205808ed36593aa40a44f10c7f7c2f67d4a4d4",
        gas: "300000",
        
        value: web3.utils.toWei(sendvalue, 'ether'),
        data: encodedABI,
    };
    sendTry(tx, config.privately)

}

async function buySharesFast(address, amount,sendvalue,nonce) {
    const encodedABI = Friendcall.methods.buyShares(address, amount).encodeABI();
    const tx = {
        from: address,
        maxFeePerGas: web3.utils.toWei("5", "gwei"),
        maxPriorityFeePerGas: web3.utils.toWei("0.1", "gwei"),
        to: "0xcf205808ed36593aa40a44f10c7f7c2f67d4a4d4",
        gas: "300000",
        nonce,
        value: web3.utils.toWei(sendvalue, 'ether'),
        data: encodedABI,
    };
    sendTry(tx, config.privately)

}

async function getsharePrice(addr,amount) {
    const price = await Friendcall.methods.getBuyPriceAfterFee(addr, amount).call()
    return web3.utils.fromWei(price)
}

async function fastBuy(addr,amount,MaxETH,sleeptime){
    let nonce = await web3.eth.getTransactionCount(config.address,'pending');
    let Balance=await web3.eth.getBalance(addr)

    while(parseFloat(Balance)<=0){
        console.log('地址未充值 暂不开始碰撞 '+Balance)
        Balance=await web3.eth.getBalance(addr)
    }
    while(true){
        buySharesFast(addr,amount,MaxETH,nonce)
        nonce++;
        await sleep(sleeptime)
    }

}
async function sleep(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
}

async function main() {
    console.log('friend.tech 快速购买 💗')
    const Address = await question('输入购买地址或者推特名称: ')
    const type= await question('输入狙击方式 1预估购买 2燃烧购买: ')
    const amount=await question('输入购买份额')
    const MaxETH=await question('输入最大愿意承受金额')

    let BuyAddress=""
     if (web3.utils.isAddress(Address) == true) {
        BuyAddress=Address
    } else {
        console.log(`输入twitter用户正在查询用户`)
        const address = await seasrChAddress(Address)
        console.log(`查询成功${address}`)
        if (web3.utils.isAddress(address) == true) {
            BuyAddress=address
        }else{
            console.log('没有获取到地址 请检查')
        
            return
        }
    }
    if(type==1){
      
            estBuy(BuyAddress,amount,MaxETH)
    }
    if(type==2){
        const Sleep=await question('输入延迟频率')
        console.log(`选择碰撞购买 请输入延迟频率`)
            fastBuy(BuyAddress,amount,MaxETH,Sleep)
        
    }


}

main()