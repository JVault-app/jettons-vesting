import { Address, Dictionary, beginCell, toNano } from '@ton/core';
import { Factory, sliceDictValueParser } from '../wrappers/Factory';
import { compile, NetworkProvider } from '@ton/blueprint';
import { buildOnchainMetadata } from '../wrappers/buildOnchain';

export async function run(provider: NetworkProvider) {
    let vestingCodesDict = Dictionary.empty(Dictionary.Keys.BigInt(128), sliceDictValueParser());
    vestingCodesDict.set(1n, beginCell().storeMaybeRef(await compile('JettonVesting')).endCell().beginParse());
    
    const factory = provider.open(Factory.createFromConfig({
        admin_address: provider.sender().address!!,
        start_index: 0n,
        creation_fee: toNano('0.5'),
        jetton_vesting_codes: vestingCodesDict,
        content: buildOnchainMetadata({name: "JVault locks", description: "Collection with soulbound tokens confirming ownership of jettons locked in JVault Locker (actual version)", image: "https://jvault.xyz/static/images/lock_collection.png"}),
        version: 1
    }, await compile('Factory')));

    await factory.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(factory.address);

    // run methods on `factory`
}
