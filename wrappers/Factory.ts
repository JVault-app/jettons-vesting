import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from '@ton/core';

export type FactoryConfig = {
    admin_address: Address;
    creation_fee: bigint;
    jetton_vesting_code: Cell;
};

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
}
