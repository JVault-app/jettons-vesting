import { Blockchain, SandboxContract, TreasuryContract, prettyLogTransactions, printTransactionFees } from '@ton/sandbox';
import { Cell, toNano } from '@ton/core';
import { JettonVesting, JettonVestingConfigInited } from '../wrappers/JettonVesting';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';
import { Factory } from '../wrappers/Factory';
import { JettonWallet } from '../wrappers/JettonWallet';
import { JettonMinter } from '../wrappers/JettonMinter';
import { ErrorCodes } from '../wrappers/helpers/constants';

describe('JettonVesting', () => {
    let vestingCode: Cell;
    let factoryCode: Cell;
    let jettonCode: Cell;
    let jettonWalletCode: Cell;

    beforeAll(async () => {
        vestingCode = await compile('JettonVesting');
        factoryCode = await compile('Factory');
        jettonCode = await compile('JettonMinter')
        jettonWalletCode = await compile("JettonWallet")
    });

    let blockchain: Blockchain;
    let admin: SandboxContract<TreasuryContract>;
    let vesting: SandboxContract<JettonVesting>;
    let factory: SandboxContract<Factory>;
    let owner: SandboxContract<TreasuryContract>;
    let jettonMinter: SandboxContract<JettonMinter>;
    let ownerJetton: SandboxContract<JettonWallet>;
    let adminJetton: SandboxContract<JettonWallet>;
    let vestingJetton: SandboxContract<JettonWallet>;
    let factoryJetton: SandboxContract<JettonWallet>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        blockchain.now = 1000000000

        admin = await blockchain.treasury("admin")
        owner = await blockchain.treasury("owner")

        jettonMinter = blockchain.openContract(JettonMinter.createFromConfig({admin: admin.address, wallet_code: jettonWalletCode, content: Cell.EMPTY}, jettonCode))
        await jettonMinter.sendMint(admin.getSender(), owner.address, toNano(1000), toNano("0.02"), toNano("0.05"))
        ownerJetton = blockchain.openContract(JettonWallet.createFromAddress(await jettonMinter.getWalletAddress(owner.address)))
        adminJetton = blockchain.openContract(JettonWallet.createFromAddress(await jettonMinter.getWalletAddress(admin.address)))

        factory = blockchain.openContract(Factory.createFromConfig({admin_address: admin.address, jetton_vesting_code: vestingCode, creation_fee: toNano("0.1")}, factoryCode));
        await factory.sendDeploy(admin.getSender(), toNano("0.03"))
        vesting = blockchain.openContract(JettonVesting.createFromAddress(await factory.getNftAddressByIndex(0n)))

        factoryJetton = blockchain.openContract(JettonWallet.createFromAddress(await jettonMinter.getWalletAddress(factory.address)))
        vestingJetton = blockchain.openContract(JettonWallet.createFromAddress(await jettonMinter.getWalletAddress(vesting.address)))

        await ownerJetton.sendTransfer(owner.getSender(), toNano("2"), toNano(1000), factory.address, owner.address, null, toNano(1), Factory.createDeployVestingPayload({jettonMinter: jettonMinter.address, jettonsOwner: owner.address, firstUnlockTime: blockchain.now!! + 1000, firstUnlockSize: 10000000, cycleLength: 100, cyclesNumber: 9, content: null}))
        expect((await vesting.getStorage() as JettonVestingConfigInited).jettonWalletAddress).toEqualAddress(vestingJetton.address)
        expect(await vestingJetton.getJettonBalance()).toEqual(toNano(1000))
        expect((await vesting.getStorage() as JettonVestingConfigInited).jettonsLocked).toBeTruthy()
    });

    it('should send every cycle', async () => {
        // blockchain.verbosity.vmLogs = "vm_logs"

        let res = await vesting.sendClaim(owner.getSender(), toNano("0.1"))

        expect(res.transactions).toHaveTransaction({
            to: vesting.address,
            exitCode: ErrorCodes.notUnlockedYet
        })

        let conf = await vesting.getStorage() as JettonVestingConfigInited
        blockchain.now = conf.firstUnlockTime + 1
        res = await vesting.sendClaim(owner.getSender(), toNano("0.1"))
        expect(await vestingJetton.getJettonBalance()).toEqual(toNano(900))
        expect(await ownerJetton.getJettonBalance()).toEqual(toNano(100))

        let curLocked = toNano(900)

        for (let index = 0; index < conf.cyclesNumber; index++) {
            blockchain.now += conf.cycleLength
            res = await vesting.sendClaim(owner.getSender(), toNano("0.1"))

            curLocked -= toNano(100)
            expect(await vestingJetton.getJettonBalance()).toEqual(curLocked)
            expect(await ownerJetton.getJettonBalance()).toEqual(toNano(1000) - curLocked)
        }
    });
    it('claim after end', async () => {
        let conf = await vesting.getStorage() as JettonVestingConfigInited
        blockchain.now = conf.firstUnlockTime + 1 + conf.cycleLength * conf.cyclesNumber
        let res = await vesting.sendClaim(owner.getSender(), toNano("0.1"))

        expect(await vestingJetton.getJettonBalance()).toEqual(toNano(0))
        expect(await ownerJetton.getJettonBalance()).toEqual(toNano(1000))
    })
    it('claim in the middle of vesting', async () => {
        let conf = await vesting.getStorage() as JettonVestingConfigInited
        blockchain.now = conf.firstUnlockTime + 1 + conf.cycleLength * conf.cyclesNumber / 2
        let res = await vesting.sendClaim(owner.getSender(), toNano("0.1"))

        expect(await vestingJetton.getJettonBalance()).toEqual(toNano(500))
        expect(await ownerJetton.getJettonBalance()).toEqual(toNano(500))
    })
    it('sends wrong jettons', async () => {
        let jet2 = blockchain.openContract(JettonMinter.createFromConfig({admin: owner.address, content: Cell.EMPTY, wallet_code: jettonWalletCode}, jettonCode))
        await jet2.sendMint(owner.getSender(), owner.address, toNano(1000), toNano("0.2"), toNano("0.3"))
        let jet2owner = blockchain.openContract(JettonWallet.createFromAddress(await jet2.getWalletAddress(owner.address)))
        await jet2owner.sendTransfer(owner.getSender(), toNano("0.1"), toNano(1000), vesting.address, owner.address, null, 0n, null)
        expect(await jet2owner.getJettonBalance()).toEqual(0n)
        await vesting.sendWithdrawJetton(owner.getSender(), toNano("0.1"), await jet2.getWalletAddress(vesting.address), toNano(1000))
        expect(await jet2owner.getJettonBalance()).toEqual(toNano(1000))
    })
    it('should burn all', async () => {
        let conf = await vesting.getStorage() as JettonVestingConfigInited
        blockchain.now = conf.firstUnlockTime + 1
        await vesting.sendBurnLockedJettons(owner.getSender(), toNano("0.1"), null)
        expect(await jettonMinter.getTotalSupply()).toEqual(0n)
        let res = await vesting.sendClaim(owner.getSender(), toNano("0.1"))
        expect(res.transactions).toHaveTransaction({
            to: vesting.address,
            exitCode: ErrorCodes.incorrectSender
        })
    })
    it('should burn part', async () => {
        let conf = await vesting.getStorage() as JettonVestingConfigInited
        blockchain.now = conf.firstUnlockTime + 1 + conf.cycleLength
        let res = await vesting.sendClaim(owner.getSender(), toNano("0.1"))
        expect(await vestingJetton.getJettonBalance()).toEqual(toNano(800))
        expect(await ownerJetton.getJettonBalance()).toEqual(toNano(200))
        await vesting.sendBurnLockedJettons(owner.getSender(), toNano("0.1"), toNano(100))
        expect(await jettonMinter.getTotalSupply()).toEqual(toNano(900))

        blockchain.now += conf.cycleLength
        res = await vesting.sendClaim(owner.getSender(), toNano("0.1"))

        for (let index = 0; index < conf.cyclesNumber - 1; index++) {
            blockchain.now += conf.cycleLength
            res = await vesting.sendClaim(owner.getSender(), toNano("0.1"))
        }
        expect(await vestingJetton.getJettonBalance()).toEqual(0n)
        expect(await ownerJetton.getJettonBalance()).toEqual(toNano(900))
    })
});
