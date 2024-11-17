import { Address, toNano } from '@ton/core';
import { JettonVesting } from '../wrappers/JettonVesting';
import { compile, NetworkProvider, sleep } from '@ton/blueprint';
import { Factory } from '../wrappers/Factory';
import { JettonMinter } from '../wrappers/JettonMinter';
import { JettonWallet } from '../wrappers/JettonWallet';
import { buildOnchainMetadata } from '../wrappers/buildOnchain';

export async function run(provider: NetworkProvider) {
    const factory = provider.open(Factory.createFromAddress(Address.parse("EQCSFRiFm_qjv7W6S9xjI7ZY2XJecUhd4VymLglsOE88lMYH")))
    await factory.sendChangeCode(provider.sender(), await compile("Factory"));
    await sleep(1000 * 20)
    await factory.sendUpdateVestingCode(provider.sender(), await compile("JettonVesting"))
}
