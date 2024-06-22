import { Address, toNano } from '@ton/core';
import { Factory } from '../wrappers/Factory';
import { compile, NetworkProvider } from '@ton/blueprint';
import { buildOnchainMetadata } from '../wrappers/buildOnchain';

export async function run(provider: NetworkProvider) {
    const factory = provider.open(Factory.createFromConfig({
        admin_address: provider.sender().address!!,
        start_index: 0n,
        creation_fee: toNano('0.001'),
        jetton_vesting_code: await compile('JettonVesting'),
        content: buildOnchainMetadata({name: "JVault locks", description: "Collection with soulbound tokens confirming ownership of jettons locked in JVault Locker", image: "https://jvault.xyz/static/images/lock_collection.png"})
    }, await compile('Factory')));

    await factory.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(factory.address);

    // run methods on `factory`
}
