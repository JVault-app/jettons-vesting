import { Blockchain, SandboxContract, SendMessageResult, TreasuryContract, prettyLogTransactions, printTransactionFees } from '@ton/sandbox';
import { Cell, Dictionary, DictionaryValue, Slice, beginCell, toNano } from '@ton/core';
import { JettonVesting, JettonVestingConfigInited } from '../wrappers/JettonVesting';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';
import { Factory, sliceDictValueParser } from '../wrappers/Factory';
import { JettonWallet } from '../wrappers/JettonWallet';
import { JettonMinter } from '../wrappers/JettonMinter';
import { ErrorCodes } from '../wrappers/helpers/constants';
import { buildOnchainMetadata } from '../wrappers/buildOnchain';
import exp from 'constants';

describe('JettonVesting', () => {
    let vestingCode: Cell;
    let factoryCode: Cell;
    let jettonCode: Cell;
    let jettonCodeBad: Cell;
    let jettonWalletCode: Cell;

    beforeAll(async () => {
        vestingCode = await compile('JettonVesting');
        factoryCode = await compile('Factory');
        jettonCode = await compile('JettonMinter');
        jettonCodeBad = await compile("JettonMinterBad");
        jettonWalletCode = await compile("JettonWallet");
    });

    let blockchain: Blockchain;
    let admin: SandboxContract<TreasuryContract>;
    let vesting: SandboxContract<JettonVesting>;
    let factory: SandboxContract<Factory>;
    let owner: SandboxContract<TreasuryContract>;
    let jettonMinter: SandboxContract<JettonMinter>;
    let jettonMinterBad: SandboxContract<JettonMinter>;
    let ownerJettonWallet: SandboxContract<JettonWallet>;
    let adminJettonWallet: SandboxContract<JettonWallet>;
    let vestingJettonWallet: SandboxContract<JettonWallet>;
    let factoryJettonWallet: SandboxContract<JettonWallet>;

    let transactionRes: SendMessageResult;
    beforeEach(async () => {
        blockchain = await Blockchain.create();
        blockchain.now = 1000000000

        admin = await blockchain.treasury("admin")
        owner = await blockchain.treasury("owner")

        let vestingCodesDict = Dictionary.empty(Dictionary.Keys.BigInt(128), sliceDictValueParser());
        vestingCodesDict.set(0n, beginCell().storeMaybeRef(beginCell().storeUint(1231, 123).endCell()).endCell().beginParse());
        
        factory = blockchain.openContract(Factory.createFromConfig({
            admin_address: admin.address,
            start_index: 0n, 
            jetton_vesting_codes: vestingCodesDict, 
            creation_fee: toNano("0.5"), 
            content: null, 
            version: 0
        }, factoryCode));
        await factory.sendDeploy(admin.getSender(), toNano("0.03")); 
        await factory.sendChangeCode(admin.getSender(), await compile("Factory"));
        await factory.sendUpdateVestingCode(admin.getSender(), vestingCode);

        vesting = blockchain.openContract(JettonVesting.createFromAddress(await factory.getNftAddressByIndex(0n)))

        jettonMinter = blockchain.openContract(JettonMinter.createFromConfig({admin: admin.address, wallet_code: jettonWalletCode, content: Cell.EMPTY}, jettonCode))
        await jettonMinter.sendMint(admin.getSender(), owner.address, toNano(1000), toNano("0.02"), toNano("0.05"))

        ownerJettonWallet = blockchain.openContract(JettonWallet.createFromAddress(await jettonMinter.getWalletAddress(owner.address)))
        adminJettonWallet = blockchain.openContract(JettonWallet.createFromAddress(await jettonMinter.getWalletAddress(admin.address)))
        factoryJettonWallet = blockchain.openContract(JettonWallet.createFromAddress(await jettonMinter.getWalletAddress(factory.address)))
        vestingJettonWallet = blockchain.openContract(JettonWallet.createFromAddress(await jettonMinter.getWalletAddress(vesting.address)))

        await ownerJettonWallet.sendTransfer(owner.getSender(), toNano("2"), toNano(1000), factory.address, owner.address, null, toNano(1), Factory.createDeployVestingPayload({jettonMinter: jettonMinter.address, jettonsOwner: owner.address, firstUnlockTime: blockchain.now!! + 1000, firstUnlockSize: 10000000, cycleLength: 100, cyclesNumber: 9, content: buildOnchainMetadata({decimals: 9, symbol: "boba", image: "https://media.tenor.com/4cTJ4sDdIn0AAAAe/aboba.png", uri: "https://jvault.xyz/"})}))
        expect((await vesting.getStorage() as JettonVestingConfigInited).jettonWalletAddress).toEqualAddress(vestingJettonWallet.address)
        expect(await vestingJettonWallet.getJettonBalance()).toEqual(toNano(1000))
        expect((await vesting.getStorage() as JettonVestingConfigInited).jettonsLocked).toBeTruthy()
    });

    it('should decline non-discoverable jetton', async () => {
        vesting = blockchain.openContract(JettonVesting.createFromAddress(await factory.getNftAddressByIndex(1n)))

        jettonMinterBad = blockchain.openContract(JettonMinter.createFromConfig({admin: admin.address, wallet_code: jettonWalletCode, content: Cell.EMPTY}, jettonCodeBad));
        await jettonMinterBad.sendMint(admin.getSender(), owner.address, toNano(1000), toNano("0.02"), toNano("0.05"));

        ownerJettonWallet = blockchain.openContract(JettonWallet.createFromAddress(await jettonMinterBad.getWalletAddress(owner.address)));
        adminJettonWallet = blockchain.openContract(JettonWallet.createFromAddress(await jettonMinterBad.getWalletAddress(admin.address)));
        factoryJettonWallet = blockchain.openContract(JettonWallet.createFromAddress(await jettonMinterBad.getWalletAddress(factory.address)));
        vestingJettonWallet = blockchain.openContract(JettonWallet.createFromAddress(await jettonMinterBad.getWalletAddress(vesting.address)));
        
        let res = await ownerJettonWallet.sendTransfer(owner.getSender(), toNano("2"), toNano(1000), factory.address, owner.address, null, toNano(1), Factory.createDeployVestingPayload({jettonMinter: jettonMinterBad.address, jettonsOwner: owner.address, firstUnlockTime: blockchain.now!! + 1000, firstUnlockSize: 10000000, cycleLength: 100, cyclesNumber: 9, content: buildOnchainMetadata({decimals: 9, symbol: "boba", image: "https://media.tenor.com/4cTJ4sDdIn0AAAAe/aboba.png", uri: "https://jvault.xyz/"})}))
        // await printTransactionFees(res.transactions);

        expect((await vesting.getStorage() as JettonVestingConfigInited).jettonsLocked).toBeFalsy();
        expect(await vestingJettonWallet.getJettonBalance()).toEqual(0n);
        expect(await factoryJettonWallet.getJettonBalance()).toEqual(0n);
        expect(await ownerJettonWallet.getJettonBalance()).toEqual(toNano(1000));
    })

    it('should show data', async () => {
        // blockchain.verbosity.blockchainLogs = true
        // console.log(await vesting.getH())
        let data = await vesting.getData();
        // console.log(data)
    })
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
        expect(await vestingJettonWallet.getJettonBalance()).toEqual(toNano(900))
        expect(await ownerJettonWallet.getJettonBalance()).toEqual(toNano(100))

        let curLocked = toNano(900)

        for (let index = 0; index < conf.cyclesNumber; index++) {
            blockchain.now += conf.cycleLength
            res = await vesting.sendClaim(owner.getSender(), toNano("0.1"))

            curLocked -= toNano(100)
            expect(await vestingJettonWallet.getJettonBalance()).toEqual(curLocked)
            expect(await ownerJettonWallet.getJettonBalance()).toEqual(toNano(1000) - curLocked)
        }
    });

    it('should claim after end', async () => {
        let conf = await vesting.getStorage() as JettonVestingConfigInited
        blockchain.now = conf.firstUnlockTime + 1 + conf.cycleLength * conf.cyclesNumber
        let res = await vesting.sendClaim(owner.getSender(), toNano("0.1"))

        expect(await vestingJettonWallet.getJettonBalance()).toEqual(toNano(0))
        expect(await ownerJettonWallet.getJettonBalance()).toEqual(toNano(1000))
    });

    it('should claim in the middle of vesting', async () => {
        let conf = await vesting.getStorage() as JettonVestingConfigInited
        blockchain.now = conf.firstUnlockTime + 1 + conf.cycleLength * conf.cyclesNumber / 2
        let res = await vesting.sendClaim(owner.getSender(), toNano("0.1"))

        expect(await vestingJettonWallet.getJettonBalance()).toEqual(toNano(500))
        expect(await ownerJettonWallet.getJettonBalance()).toEqual(toNano(500))
    });

    it('should decline withdrawal of main jetton', async () => {
        await vesting.sendWithdrawJetton(owner.getSender(), toNano("0.1"), await jettonMinter.getWalletAddress(vesting.address), toNano(1000), 0, true);
        await vesting.sendWithdrawJetton(owner.getSender(), toNano("0.1"), await jettonMinter.getWalletAddress(vesting.address), toNano(1000), 0, false);
        expect(await ownerJettonWallet.getJettonBalance()).toEqual(toNano(0));
    });


    it('should accept withdrawal of wrong jettons', async () => {
        let jet2 = blockchain.openContract(JettonMinter.createFromConfig({admin: owner.address, content: Cell.EMPTY, wallet_code: jettonWalletCode}, jettonCode))
        await jet2.sendMint(owner.getSender(), owner.address, toNano(1000), toNano("0.2"), toNano("0.3"))
        let jet2owner = blockchain.openContract(JettonWallet.createFromAddress(await jet2.getWalletAddress(owner.address)))
        await jet2owner.sendTransfer(owner.getSender(), toNano("0.1"), toNano(1000), vesting.address, owner.address, null, 0n, null)
        expect(await jet2owner.getJettonBalance()).toEqual(0n)
        await vesting.sendWithdrawJetton(owner.getSender(), toNano("0.1"), await jet2.getWalletAddress(vesting.address), toNano(1000))
        expect(await jet2owner.getJettonBalance()).toEqual(toNano(1000))
    });

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
    });

    it('should burn part', async () => {
        let conf = await vesting.getStorage() as JettonVestingConfigInited
        blockchain.now = conf.firstUnlockTime + 1 + conf.cycleLength
        let res = await vesting.sendClaim(owner.getSender(), toNano("0.1"))
        expect(await vestingJettonWallet.getJettonBalance()).toEqual(toNano(800))
        expect(await ownerJettonWallet.getJettonBalance()).toEqual(toNano(200))
        await vesting.sendBurnLockedJettons(owner.getSender(), toNano("0.1"), toNano(100))
        expect(await jettonMinter.getTotalSupply()).toEqual(toNano(900))

        blockchain.now += conf.cycleLength
        res = await vesting.sendClaim(owner.getSender(), toNano("0.1"))

        for (let index = 0; index < conf.cyclesNumber - 1; index++) {
            blockchain.now += conf.cycleLength
            res = await vesting.sendClaim(owner.getSender(), toNano("0.1"))
        }
        expect(await vestingJettonWallet.getJettonBalance()).toEqual(0n)
        expect(await ownerJettonWallet.getJettonBalance()).toEqual(toNano(900))
    });
});