import { toNano } from '@ton/core';
import { Factory } from '../wrappers/Factory';
import { compile, NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const factory = provider.open(Factory.createFromConfig({}, await compile('Factory')));

    await factory.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(factory.address);

    // run methods on `factory`
}
