import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from '@ton/core';

export type JettonVestingConfig = {
    factory_address: Address;
    index: bigint;
    owner_address: Address;
    jetton_wallet_address: Address;
    jetton_address_set: boolean;
    content?: Cell;
    factory_jetton_wallet: Address;
    locked_jettons: bigint;  // amount of locked jettons
    jettons_locked: boolean  // were jettons locked?
    claimed_times: number;
    claimed_jettons: bigint;
    first_unlock_time: number;
    first_unlock_size: number;
    cycle_length: number;
    cycles_number: number;
};

export function jettonVestingConfigToCell(config: JettonVestingConfig): Cell {
    return beginCell()
        .storeAddress(config.factory_address)
        .storeUint(config.index, 128)
        .storeAddress(config.owner_address)
        .storeAddress(config.jetton_wallet_address)
        .storeInt(config.jetton_address_set?, 1)
        .storeMaybeRef(config.content)
        .storeRef(
            beginCell()
                .storeAddress(config.factory_jetton_wallet)
                .storeCoins(config.locked_jettons)
                .storeInt(config.jettons_locked?, 1)
                .storeUint(config.claimed_times, 16)
                .storeCoins(config.claimed_jettons)
                .storeUint(config.first_unlock_time, 32)
                .storeUint(config.first_unlock_size, 32)
                .storeUint(config.cycle_length, 32)
                .storeUint(config.cycles_number, 16)
            .endCell()
        )
    .endCell();
}

export class JettonVesting implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new JettonVesting(address);
    }

    static createFromConfig(config: JettonVestingConfig, code: Cell, workchain = 0) {
        const data = jettonVestingConfigToCell(config);
        const init = { code, data };
        return new JettonVesting(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }
}
