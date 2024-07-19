import { Address, toNano } from '@ton/core';
import { Factory } from '../wrappers/Factory';
import { compile, NetworkProvider } from '@ton/blueprint';
import { buildOnchainMetadata } from '../wrappers/buildOnchain';

export async function run(provider: NetworkProvider) {
    const factory = provider.open(Factory.createFromConfig({
        admin_address: provider.sender().address!!,
        start_index: 204n,
        creation_fee: toNano('0.5'),
        jetton_vesting_codes: await compile('JettonVesting'),
        content: buildOnchainMetadata({name: "JVault locks", description: "Collection with soulbound tokens confirming ownership of jettons locked in JVault Locker (updated version)", image: "https://jvault.xyz/static/images/lock_collection.png"})
    }, await compile('Factory')));

    await factory.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(factory.address);

    // run methods on `factory`
}
