import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Cell, toNano } from '@ton/core';
import { Factory } from '../wrappers/Factory';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';

describe('Factory', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('Factory');
    });

    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let factory: SandboxContract<Factory>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        factory = blockchain.openContract(Factory.createFromConfig({}, code));

        deployer = await blockchain.treasury('deployer');

        const deployResult = await factory.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: factory.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and factory are ready to use
    });
});
