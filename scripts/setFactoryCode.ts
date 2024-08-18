import { Address, toNano } from '@ton/core';
import { JettonVesting } from '../wrappers/JettonVesting';
import { compile, NetworkProvider } from '@ton/blueprint';
import { Factory } from '../wrappers/Factory';
import { JettonMinter } from '../wrappers/JettonMinter';
import { JettonWallet } from '../wrappers/JettonWallet';
import { buildOnchainMetadata } from '../wrappers/buildOnchain';

export async function run(provider: NetworkProvider) {
    const factory = provider.open(Factory.createFromAddress(Address.parse("EQBK8uTlStT0O2MeeTx-aKm1ye8xrtjimk356TxbDA5L37jz")))
    await factory.sendChangeCode(provider.sender(), await compile("Factory"));
}
