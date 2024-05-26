import { Address, toNano } from '@ton/core';
import { compile, NetworkProvider } from '@ton/blueprint';
import { JettonMinter } from '../wrappers/JettonMinter';
import { buildOnchainMetadata } from '../wrappers/buildOnchain';

export async function run(provider: NetworkProvider) {
    let jetton = provider.open(JettonMinter.createFromConfig({admin: provider.sender().address!!, wallet_code: await compile("JettonWallet"), content: buildOnchainMetadata({name: "aboba", description: "aboba token", symbol: "boba", image: "https://media.tenor.com/4cTJ4sDdIn0AAAAe/aboba.png"} )}, await compile("JettonMinter")))
    
    await jetton.sendMint(provider.sender(), provider.sender().address!!, toNano(9999999), toNano("0.03"), toNano("0.06"))
    await provider.waitForDeploy(jetton.address)
}
