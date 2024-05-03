import { toNano } from '@ton/core';
import { JettonVesting } from '../wrappers/JettonVesting';
import { compile, NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const jettonVesting = provider.open(JettonVesting.createFromConfig({}, await compile('JettonVesting')));

    await jettonVesting.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(jettonVesting.address);

    // run methods on `jettonVesting`
}
