import { Address, toNano } from '@ton/core';
import { JettonVesting } from '../wrappers/JettonVesting';
import { compile, NetworkProvider } from '@ton/blueprint';
import { Factory } from '../wrappers/Factory';
import { JettonMinter } from '../wrappers/JettonMinter';
import { JettonWallet } from '../wrappers/JettonWallet';
import { buildOnchainMetadata } from '../wrappers/buildOnchain';

export async function run(provider: NetworkProvider) {
    const factory = provider.open(Factory.createFromAddress(Address.parse("EQByKSuuGWaODEGpFZAvtRwW4Es1xo4vkiasQD9q5BamRyyr")))
    const jetton = provider.open(JettonMinter.createFromAddress(Address.parse("kQC-xM01ujh_zezCBLveA1SYAHCkZ1kLkIKi9rgAvgKP9lxD")))
    const jettonWallet = provider.open(JettonWallet.createFromAddress(await jetton.getWalletAddress(provider.sender().address!!)))

    await jettonWallet.sendTransfer(provider.sender(), toNano("0.72"), 1n, factory.address, provider.sender().address!!, null, toNano("0.66"), Factory.createDeployVestingPayload({jettonMinter: jetton.address, jettonsOwner: provider.sender().address!!, firstUnlockTime: Math.floor(Date.now() / 1000) + 10000, firstUnlockSize: 10000000, cycleLength: 1000, cyclesNumber: 9, content: buildOnchainMetadata({decimals: 9, symbol: "boba", image: "https://media.tenor.com/4cTJ4sDdIn0AAAAe/aboba.png"})}))
}
