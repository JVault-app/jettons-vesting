import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from '@ton/core';
import { Maybe } from '@ton/core/dist/utils/maybe';

export type FactoryConfig = {
    admin_address: Address;
    creation_fee: bigint;
    jetton_vesting_code: Cell;
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

export function factoryConfigToCell(config: FactoryConfig): Cell {
    return beginCell()
        .storeAddress(config.admin_address)
        .storeUint(0, 128)
        .storeCoins(config.creation_fee)
        .storeRef(config.jetton_vesting_code)
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

    static createDeployVestingPayload(args: DeployVestingMessage) {
        return  beginCell()
                    .storeAddress(args.jettonMinter)
                    .storeAddress(args.jettonsOwner)
                    .storeUint(args.firstUnlockTime, 32)
                    .storeUint(args.firstUnlockSize, 32)
                    .storeUint(args.cycleLength, 32)
                    .storeUint(args.cyclesNumber, 16)
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
