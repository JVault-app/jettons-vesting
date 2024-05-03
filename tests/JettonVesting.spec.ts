import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Cell, toNano } from '@ton/core';
import { JettonVesting } from '../wrappers/JettonVesting';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';

describe('JettonVesting', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('JettonVesting');
    });

    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let jettonVesting: SandboxContract<JettonVesting>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        jettonVesting = blockchain.openContract(JettonVesting.createFromConfig({}, code));

        deployer = await blockchain.treasury('deployer');

        const deployResult = await jettonVesting.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: jettonVesting.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and jettonVesting are ready to use
    });
});
