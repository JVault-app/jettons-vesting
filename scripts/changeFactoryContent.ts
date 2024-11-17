import { Address, toNano } from '@ton/core';
import { compile, NetworkProvider } from '@ton/blueprint';
import { Factory } from '../wrappers/Factory';
import { buildOnchainMetadata } from '../wrappers/buildOnchain';

export async function run(provider: NetworkProvider) {
    const factory = provider.open(Factory.createFromAddress(Address.parse("EQBK8uTlStT0O2MeeTx-aKm1ye8xrtjimk356TxbDA5L37jz")))
    await factory.sendChangeContent(provider.sender(), buildOnchainMetadata({
        name: "OLD JVault locks", 
        description: "Collection with soulbound tokens confirming ownership of jettons locked in JVault Locker (old version)", 
        image: "https://jvault.xyz/static/images/locker-image.png"
    }))
}
