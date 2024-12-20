import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Dictionary, DictionaryValue, Sender, SendMode, Slice } from '@ton/core';
import { Maybe } from '@ton/core/dist/utils/maybe';
import { toNano } from '@ton/core';
import { OpCodes } from './helpers/constants';


export type FactoryConfig = {
    admin_address: Address;
    start_index: bigint;
    creation_fee: bigint;
    jetton_vesting_codes: Dictionary<bigint, Slice>;
    content: Maybe<Cell>;
    version: number;
};

export type DeployVestingMessage = {
    jettonMinter: Address,
    jettonsOwner: Address,
    firstUnlockTime: number,
    firstUnlockSize: number,
    cycleLength: number,
    cyclesNumber: number,
    content: Maybe<Cell>
}

export function sliceDictValueParser(): DictionaryValue<Slice> {
    return {
        serialize: (src, buidler) => {
            buidler.storeSlice(src).endCell();
        },
        parse: (src) => {
            return src;
        }
    }
}

export function factoryConfigToCell(config: FactoryConfig): Cell {
    return beginCell()
        .storeAddress(config.admin_address)
        .storeUint(config.start_index, 128)
        .storeCoins(config.creation_fee)
        .storeDict(config.jetton_vesting_codes, Dictionary.Keys.BigUint(128), sliceDictValueParser())
        .storeMaybeRef(config.content)
        .storeUint(config.version, 8)
    .endCell();
}

export class Factory implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new Factory(address);
    }

    static createFromConfig(config: FactoryConfig, code: Cell, workchain = 0) {
        const data = factoryConfigToCell(config);
        const init = { code, data };
        return new Factory(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async sendUpdateVestingCode(provider: ContractProvider, via: Sender, new_code: Cell) {
        await provider.internal(via, {
            value: toNano("0.01"),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().storeUint(OpCodes.updateVestingCode, 32).storeUint(0, 64).storeMaybeRef(new_code).endCell(),
        });
    }

    async sendChangeCreationFee(provider: ContractProvider, via: Sender, new_creation_fee: bigint) {
        await provider.internal(via, {
            value: toNano("0.02"),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().storeUint(OpCodes.changeCreationFee, 32).storeUint(0, 64).storeCoins(new_creation_fee).endCell(),
        });
    }

    async sendChangeContent(provider: ContractProvider, via: Sender, newContent: Cell) {
        await provider.internal(via, {
            value: toNano("0.01"),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().storeUint(OpCodes.changeContent, 32).storeUint(0, 64).storeMaybeRef(newContent).endCell(),
        });
    }

    async sendWithdrawTon(provider: ContractProvider, via: Sender) {
        await provider.internal(via, {
            value: toNano("0.01"),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().storeUint(OpCodes.withdrawTon, 32).storeUint(0, 64).endCell(),
        });
    }

    async sendChangeCode(provider: ContractProvider, via: Sender, new_code: Cell) {
        await provider.internal(via, {
            value: toNano("0.01"),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().storeUint(OpCodes.changeFactoryCode, 32).storeUint(0, 64).storeRef(new_code).endCell(),
        });
    }

    async sendWithdrawJetton(provider: ContractProvider, via: Sender, jettonWalletAddress: Address, jettonAmount: bigint, recipientAddress: Address, forwardPayload: Cell) {
        await provider.internal(via, {
            value: toNano("0.15"),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().storeUint(OpCodes.withdrawJetton, 32).storeUint(0, 64).storeAddress(jettonWalletAddress).storeCoins(jettonAmount).storeAddress(recipientAddress).storeSlice(forwardPayload.asSlice()).endCell(),
        });
    }

    static createDeployVestingPayload(args: DeployVestingMessage) {
        return  beginCell()
                    .storeAddress(args.jettonMinter)
                    .storeAddress(args.jettonsOwner)
                    .storeUint(args.firstUnlockTime, 32)
                    .storeUint(args.firstUnlockSize, 32)
                    .storeUint(args.cycleLength, 32)
                    .storeUint(args.cyclesNumber, 32)
                    .storeMaybeRef(args.content)
                .endCell()
    }

    async getStorage(provider: ContractProvider) {
        let { stack } = await provider.get('get_storage_data', []);
        return {
            admin: stack.readAddress(),
            nextItem: stack.readBigNumber(),
            creationFee: stack.readBigNumber(),
            vestingCode: stack.readCell()
        }
    }

    async getNftAddressByIndex(provider: ContractProvider, index: bigint): Promise<Address> {
        const res = await provider.get('get_nft_address_by_index', [{ type: 'int', value: index}])
        return res.stack.readAddress()
    }
}
