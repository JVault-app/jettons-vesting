import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from '@ton/core';

export type JettonVestingConfig = {};

export function jettonVestingConfigToCell(config: JettonVestingConfig): Cell {
    return beginCell().endCell();
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
